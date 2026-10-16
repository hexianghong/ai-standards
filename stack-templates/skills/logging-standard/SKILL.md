---
name: logging-standard
description: 统一企业级日志规范（跨语言）。适用于 Java (SLF4J/Logback) 与 Go (slog/zap) 项目。涵盖日志分级原则、结构化字段 Schema、TraceId 链路追踪上下文传播、敏感信息脱敏规则、性能优化防线、ERROR 日志防线及反模式速查。
---

# 统一企业级日志规范 (Unified Logging Standard)

> [!IMPORTANT]
> **触发与激活场景**：当开发或代码评审任务涉及以下任何场景时，AI 必须主动加载并严格遵守本规范：
> - 编写包含 `log.info` / `log.error` / `log.warn` / `log.debug` 的业务代码
> - 设计或评审 Logback / Log4j2 / slog / zap 的日志框架配置文件
> - 编写切面日志，如 HTTP Filter 拦截器、AOP 切面或全局异常处理器
> - 设计跨微服务的全链路分布式追踪（TraceId 传递机制）

---

## 第一章：日志级别使用准则（强制约束）

精准选用日志级别是降低日志噪音、提升线上排障效率的第一道防线。

| 级别 | 适用场景 | 严禁使用场景 |
| :--- | :--- | :--- |
| `ERROR` | 导致业务功能不可用的严重异常；需要人工立即介入处理的故障 | 预期内的常规业务校验失败（如用户名重复）；可自动重试并自愈的瞬态波动 |
| `WARN` | 可恢复但需警示的异常；缺少非必要配置触发默认兜底；需要人工介入纠正的数据不一致 | 正常业务流程的分支判断；高频触发的业务告警（易引发告警风暴） |
| `INFO` | 服务启停关键生命周期里程碑；核心业务流程里程碑（如订单创建、支付成功）；定时任务启停 | 循环体内部的过程性打印（每轮循环都打）；生产环境高频请求/响应报文全量打印 |
| `DEBUG` | 本地或联调排错时的请求/响应报文详情；SQL 执行结果集；复杂算法的中间计算状态 | 生产环境（生产环境 `application.yml` 的 Root 日志级别必须为 INFO） |
| `TRACE` | 极其细粒度的方法调用跟踪；通常仅限本地极短时间调试 | 任何非本地开发环境 |

### ❌ 典型反模式：级别滥用
```java
// 反模式 1：将常规业务校验失败记为 ERROR，引发线上告警风暴
log.error("用户 {} 登录失败，密码错误次数: {}", userId, count); // 应为 WARN

// 反模式 2：在循环体内打印 INFO，导致生产环境日志爆炸
for (User user : allUsers) {
    log.info("正在处理用户: {}", user.getId()); // 严禁！应为 DEBUG
}
```

### ✅ 正确使用示例
```java
// 示例 1：使用 WARN 记录可恢复但需注意的业务预警
log.warn("用户 {} 连续输错密码 {} 次，即将触发账户锁定", userId, failCount);

// 示例 2：定时任务使用 INFO 记录里程碑，批处理详情使用 DEBUG
log.info("[ServiceAccountTask] 微服务同步任务启动，待处理总数={}", userList.size());
for (User user : userList) {
    log.debug("[ServiceAccountTask] 正在同步用户: id={}, account={}", user.getId(), user.getAccount());
}
log.info("[ServiceAccountTask] 微服务同步任务执行完毕，成功={}, 失败={}", successCount, failCount);
```

---

## 第二章：日志文本格式规范

### 2.1 消息格式模板
所有日志消息**必须**遵循以下结构，确保易于人工速读和日志检索工具索引：

```
[模块标识] 动宾短语描述 + 关键上下文参数
```

**必须包含的信息维度：**
- **模块标识**（推荐使用中括号标注）：如 `[WxCpSync]`、`[Auth]`、`[OrderPay]`
- **动宾短语**：使用主动语态清晰描述“发生了什么事”
- **核心定位标识**：定位问题所需的最小上下文（如 `userId`, `orderId`, `traceId`）

### 2.2 严禁行为（反模式）

```java
// ❌ 严禁 1：缺少上下文的无意义裸文本，无法定位问题
log.error("Failed");
log.info("Started");

// ❌ 严禁 2：字符串直接拼接（即使 DEBUG 关闭也会在内存构建字符串，浪费 CPU）
log.error("systemIdentifying: " + systemId + " not exist!"); 

// ❌ 严禁 3：使用 String.format 构建日志内容
log.error(String.format("[AppSyncClientService] param: %s", httpEntity)); 

// ❌ 严禁 4：仅打印异常的 getMessage()，丢失了整个调用栈
log.error("hasPathPermission error: " + ex.getMessage(), ex.getCause()); // 必须直接传入异常对象 ex 本身
```

### 2.3 正确示范

```java
// ✅ 占位符结构化 + 传入完整异常堆栈
log.error("[MenuService] 查询菜单失败: systemIdentifying={}", systemId, e);

// ✅ 具有明确指标维度的 INFO 里程碑日志
log.info("[WxCpSync] 企业微信同步完成: total={}, added={}, updated={}, deactivated={}",
    total, addedCount, updatedCount, deactivatedCount);

// ✅ 包含可行动上下文的 WARN 日志
log.warn("[PositionService] 发现重复岗位: name='{}', count={}, 默认取首条记录(id={})",
    name, count, firstId);
```

---

## 第三章：结构化日志字段 Schema（强制约束）

服务输出的所有日志**必须包含以下核心字段**，由日志框架统一自动注入（严禁在业务代码中手动拼接）：

### 3.1 标准字段 Schema

| 字段名称 | 类型 | 数据来源 | 说明 |
| :--- | :--- | :--- | :--- |
| `timestamp` | String (ISO-8601) | 框架自动 | 日志生成时间，如 `2026-06-04T09:40:00.000+08:00` |
| `level` | String | 框架自动 | `ERROR` / `WARN` / `INFO` / `DEBUG` |
| `service` | String | 环境变量/配置 | 服务名称，对应 `spring.application.name`（如 `ms-iam`） |
| `env` | String | 环境变量/配置 | 运行环境：`debug` / `dev` / `test` / `pro` |
| `traceId` | String | MDC / context | 全局分布式链路追踪 TraceId（见第四章） |
| `spanId` | String | MDC / context | 当前执行片段 SpanId |
| `thread` | String | 框架自动 | 线程名称 |
| `logger` | String | 框架自动 | Logger 全类名 |
| `message` | String | 业务输出 | 日志正文内容（符合第二章规范） |

### 3.2 Java Logback JSON 配置模板

生产环境 `logback-spring.xml` **必须以 JSON 格式输出至 stdout**（供容器 Fluentd/Loki 采集索引）：

```xml
<?xml version="1.1" encoding="UTF-8"?>
<configuration>
    <!-- 引入公共日志基座配置 -->
    <include resource="cn/wowjoy/commons/logging/logging-base.xml" />

    <!-- 生产与测试环境：JSON 格式输出至标准输出，由 K8s 采集器收集 -->
    <springProfile name="pro,test">
        <root level="INFO">
            <appender-ref ref="JSON_STDOUT" />
        </root>
    </springProfile>

    <!-- 本地与联调开发环境：彩色控制台输出 + Mapper DEBUG -->
    <springProfile name="debug,dev">
        <logger name="cn.wowjoy.cloud.iam.mapper" level="DEBUG" additivity="false">
            <appender-ref ref="CONSOLE" />
        </logger>
        <root level="DEBUG">
            <appender-ref ref="CONSOLE" />
        </root>
    </springProfile>
</configuration>
```

### 3.3 Go zap 结构化配置模板

```go
// 推荐：应用启动时初始化全局 zap logger
func NewLogger(env string) *zap.Logger {
    var cfg zap.Config
    if env == "pro" || env == "test" {
        cfg = zap.NewProductionConfig() // JSON 格式输出
    } else {
        cfg = zap.NewDevelopmentConfig() // 本地可读控制台格式
    }
    cfg.OutputPaths = []string{"stdout"} // K8s 环境统一输出至标准输出
    logger, _ := cfg.Build(
        zap.Fields(
            zap.String("service", "ms-example"),
            zap.String("env", env),
        ),
    )
    return logger
}
```

---

## 第四章：TraceId 全链路追踪透传（强制约束）

在微服务架构中，**TraceId 必须跨越服务边界进行透传**，确保单个请求链条上的所有日志均可被串联检索。

### 4.1 Java - MDC 透传方案

**核心原则**：在 HTTP 入口处注入 TraceId 到 MDC，并在所有出口处（下游 HTTP 调用、异步线程）负责传递。

#### 步骤 1：实现 OncePerRequestFilter 注入 MDC

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String MDC_TRACE_KEY = "traceId";
    private static final String MDC_SPAN_KEY = "spanId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 优先从上游 Header 读取 TraceId；若无则生成新 UUID
            String traceId = Optional.ofNullable(request.getHeader(TRACE_ID_HEADER))
                .filter(StringUtils::hasText)
                .orElse(UUID.randomUUID().toString().replace("-", ""));
            String spanId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

            MDC.put(MDC_TRACE_KEY, traceId);
            MDC.put(MDC_SPAN_KEY, spanId);
            // 写回响应头供前端或上游调用方关联
            response.setHeader(TRACE_ID_HEADER, traceId);

            filterChain.doFilter(request, response);
        } finally {
            // 关键：在 finally 中执行 MDC.clear() 防止线程池复用污染
            MDC.clear();
        }
    }
}
```

#### 步骤 2：在 Logback Pattern 中引用 MDC 变量

```xml
<!-- 在 logback-spring.xml JSON 布局中引用 MDC 变量 -->
<pattern>
  {"timestamp":"%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX}","level":"%level",
   "service":"${APP_NAME}","env":"${APP_ENV}",
   "traceId":"%X{traceId}","spanId":"%X{spanId}",
   "thread":"%thread","logger":"%logger{36}","message":"%message"}
</pattern>
```

#### 步骤 3：跨异步线程传递 MDC

```java
// ❌ 严禁：使用原生 Runnable 派生异步任务，会导致 MDC 上下文丢失
CompletableFuture.runAsync(() -> {
    log.info("此处 TraceId 已经丢失！"); // traceId 将为空
});

// ✅ 正确：通过 MDC.getCopyOfContextMap() 捕获并跨线程传递
Map<String, String> mdcContext = MDC.getCopyOfContextMap();
CompletableFuture.runAsync(() -> {
    try {
        if (mdcContext != null) MDC.setContextMap(mdcContext);
        log.info("[AsyncTask] 异步任务执行中，TraceId 已成功透传");
        // ... 业务处理
    } finally {
        MDC.clear(); // 异步子线程结束时也必须清理 MDC
    }
});
```

#### 步骤 4：向微服务下游（Feign / RestTemplate）传递 TraceId

```java
// Feign 拦截器：向微服务下游发起请求时自动注入 X-Trace-Id Header
@Component
public class TraceIdFeignInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        String traceId = MDC.get("traceId");
        if (StringUtils.hasText(traceId)) {
            template.header("X-Trace-Id", traceId);
        }
    }
}
```

### 4.2 Go - Context 链路传递方案

```go
// 中间件：提取或生成 traceId，并写入 context
func TraceMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        traceId := r.Header.Get("X-Trace-Id")
        if traceId == "" {
            traceId = uuid.New().String()
        }
        ctx := context.WithValue(r.Context(), "traceId", traceId)
        w.Header().Set("X-Trace-Id", traceId)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 业务层：从 context 提取 traceId 绑定到 logger 中输出
func ProcessOrder(ctx context.Context, orderId string) error {
    traceId, _ := ctx.Value("traceId").(string)
    logger := zap.L().With(zap.String("traceId", traceId))

    logger.Info("开始处理订单", zap.String("orderId", orderId))
    // ...
    return nil
}
```

---

## 第五章：敏感信息脱敏红线（安全强制约束）

在任何环境（包括 debug/dev）中，**严禁在日志中输出未经脱敏的个人隐私信息 (PII)**：

| 敏感数据类别 | 脱敏规则 | 示例 |
| :--- | :--- | :--- |
| **手机号** | 保留前 3 位和后 4 位，中间加星号 | `138****5678` |
| **电子邮箱** | 账号保留前 2 位，其余加星号，保留域名 | `he***@example.com` |
| **密码 / Token** | **绝对禁止打印**，全部替换为掩码 | `[REDACTED]` |
| **身份证号** | 保留前 6 位和后 4 位，中间加星号 | `110101********1234` |
| **银行卡号** | 仅保留最后 4 位，其余加星号 | `****5678` |

### ❌ 反模式：明文打印敏感信息
```java
// 明文隐私信息直接输出
log.info("获取企业微信用户信息 (userId={}, email={}, phone={})",
    wxCpUser.getUserId(), wxCpUser.getEmail(), wxCpUser.getMobile()); // ❌ 严重安全隐患

// ✅ 正确：脱敏后记录
log.info("[WxCpSync] 获取企业微信用户: userId={}, email={}, phone={}",
    wxCpUser.getUserId(),
    maskEmail(wxCpUser.getEmail()),    // he***@example.com
    maskPhone(wxCpUser.getMobile())); // 138****5678
```

### Java 常用脱敏工具方法模板
```java
public class LogMaskUtil {
    /** 手机号脱敏: 138****5678 */
    public static String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 7) return "[MASKED]";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /** 邮箱脱敏: he***@example.com */
    public static String maskEmail(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) return "[MASKED]";
        String[] parts = email.split("@");
        String name = parts[0].length() > 2 ? parts[0].substring(0, 2) + "***" : "***";
        return name + "@" + parts[1];
    }

    /** 密钥/Token 脱敏: 完全擦除 */
    public static String maskSecret(String secret) {
        return "[REDACTED]";
    }
}
```

---

## 第六章：日志性能防护防线

### 6.1 高频链路严禁无保护打印
```java
// ❌ 严禁：高频链路（如权限校验拦截器）无条件打印 DEBUG
@Override
public boolean hasPermission(String userId, String path) {
    log.debug("校验权限: userId={}, path={}", userId, path); // QPS=1000 时每秒输出 1000 行日志

    // ✅ 正确：在 DEBUG 级别开启时才进行日志参数计算与打印
    if (log.isDebugEnabled()) {
        log.debug("校验权限: userId={}, path={}", userId, path);
    }
    // ...
}
```

### 6.2 定时调度任务打印标准
```java
// ✅ 定时任务日志模板
@Scheduled(cron = "${service-account.sync.cron:0 0 2 * * ?}")
public void syncServiceAccounts() {
    long startTime = System.currentTimeMillis();
    log.info("[ServiceAccountTask] 定时同步任务启动");

    int successCount = 0, failCount = 0;
    try {
        // ... 业务循环处理，循环内使用 DEBUG
        log.info("[ServiceAccountTask] 定时同步任务完成: success={}, fail={}, costMs={}",
            successCount, failCount, System.currentTimeMillis() - startTime);
    } catch (Exception e) {
        log.error("[ServiceAccountTask] 定时同步任务发生异常中断: success={}, fail={}", successCount, failCount, e);
    }
}
```

### 6.3 避免 Catch 块中多层重复打印
```java
// ❌ 严禁：同一异常在 Service 层和 Controller 层被重复打印两次
// Service 层
} catch (Exception e) {
    log.error("业务处理失败", e);
    throw new BizException("处理失败", e); // 继续向外抛出
}
// Controller 层（GlobalExceptionHandler 又打了一次）
} catch (BizException e) {
    log.error("Controller 捕获异常", e); // 重复打印！
}

// ✅ 正确：异常仅在最外层统一边界记录一次（推荐由 GlobalExceptionHandler 统一输出）
@ExceptionHandler(Exception.class)
public RestResult handleException(Exception e, HttpServletRequest request) {
    log.error("[GlobalExceptionHandler] 未处理的系统异常: path={}, method={}",
        request.getRequestURI(), request.getMethod(), e);
    return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
}
```

---

## 第七章：环境日志配置矩阵

| 环境 | Root 级别 | Mapper/DAO 级别 | 输出格式 | 收集方式 |
| :--- | :--- | :--- | :--- | :--- |
| `debug` (本地开发) | DEBUG | DEBUG | 控制台彩色高亮 | 人工直接查看 |
| `dev` (K8s 联调) | DEBUG | DEBUG | 控制台彩色高亮 | `kubectl logs` |
| `test` (K8s 测试) | INFO | INFO | JSON 结构化 | Fluentd → ELK / Loki |
| `pro` (K8s 生产) | INFO | INFO | JSON 结构化 | Fluentd → ELK / Loki |

---

## 第八章：ERROR 级别深度防线与实战守则

`ERROR` 是权重最高、最敏感的日志级别。滥用 `ERROR` 会导致告警疲劳，而用法错误则会导致堆栈断裂。必须遵守以下规则：

### 8.1 边界判定与全局异常分级拦截
预期的业务校验失败或自动重试的瞬态错误绝不能打成 `ERROR`。应在 **GlobalExceptionHandler** 中严格分流：

1. **业务异常（如 `BizException`、参数校验失败）**：在全局处理器中记录为 `WARN`，**严禁输出冗长堆栈**，仅记录请求路径、错误码与简明提示。
2. **系统异常（如 `NullPointerException`、`SQLException`、未知运行时异常）**：必须记录为 `ERROR`，**且必须输出完整堆栈**。

#### ✅ Java 全局异常分级拦截示例
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. 业务异常：记录为 WARN，仅输出简要上下文（不带堆栈）
    @ExceptionHandler(BizException.class)
    public RestResult<?> handleBizException(BizException e, HttpServletRequest request) {
        log.warn("[GlobalException] 业务异常拦截: path={}, method={}, code={}, msg={}", 
            request.getRequestURI(), request.getMethod(), e.getCode(), e.getMessage());
        return RestResult.error(e.getCode(), e.getMessage());
    }

    // 2. 系统异常：记录为 ERROR，必须输出完整异常堆栈 e
    @ExceptionHandler(Exception.class)
    public RestResult<?> handleSystemException(Exception e, HttpServletRequest request) {
        log.error("[GlobalException] 未捕获的系统级故障: path={}, method={}", 
            request.getRequestURI(), request.getMethod(), e); // 最后一个参数必须是异常对象 e
        return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
    }
}
```

### 8.2 ERROR 日志三要素 (What, Why, Who)
任何一条 `ERROR` 日志的消息正文必须包含三个核心要素：

1. **What（发生了什么）**：清晰说明失败的业务动作（例如 `"发送扣费短信失败"`，而非 `"短信失败"`）。
2. **Why（为什么失败）**：清晰说明底层原因或数据状态（例如 `"HTTP 响应状态码为 503"`，而非 `"报错了"`）。
3. **Who（影响了谁）**：能够精准定位影响面的上下文标识（如 `userId`, `orderId`, `traceId`）。

#### ❌ 缺失要素的反例
```java
// 坏味道 1：缺少上下文，无法确定哪个用户或订单受损
log.error("解密回调失败!", e);

// 坏味道 2：使用 getMessage 丢掉了完整堆栈，且描述含糊
log.error("定时结算任务异常: " + e.getMessage()); 
```

#### ✅ 符合三要素的优秀示范
```java
// 规范示范 1：包含 What (回调处理失败)、Why (签名不一致)、Who (orderId/channelId) 并输出堆栈 e
log.error("[Callback] 支付回调验签失败: orderId={}, payChannelId={}, expectedSign={}, actualSign={}",
    orderId, channelId, expSign, actSign, e);

// 规范示范 2：Go slog 实现三要素
logger.Error("定时结算任务中断",
    slog.String("taskName", "MonthlySettle"),
    slog.Int("processedCount", processed),
    slog.Any("error", err), // Why
)
```

### 8.3 “谁处理，谁打 Log”（严禁重复打印）
- **若当前层捕获异常后继续向外抛出（无论是原样抛出还是包装后抛出），当前层严禁记录 `ERROR` 日志。**
- **仅在异常最终被消费、处理、不再向上抛出的最外层记录 `ERROR` 日志。**

### 8.4 严禁空 Catch 与吞异常
**严禁使用空的 catch 块，或仅使用 `System.out` / `e.printStackTrace()` 处理异常。** 这种做法会导致系统静默失败，掩盖故障现场。

```java
// ❌ 严禁空 catch
try {
    saveData();
} catch (Exception e) {}

// ✅ 正确：通过日志框架记录或向外继续抛出
try {
    saveData();
} catch (Exception e) {
    log.error("[DataService] 保存业务数据失败", e);
    // 或 throw new SystemException(e);
}
```

### 8.5 异步线程与定时任务兜底
后台线程池、`CompletableFuture`、定时任务脱离了 HTTP 的统一异常拦截体系。若抛出未受检异常，线程池将静默退出：

1. **顶级 try-catch 保护**：定时任务方法体、MQ 监听器入口、Runnable 任务体最外层必须包裹 `try { ... } catch (Throwable t) { log.error("...", t); }`。
2. **UncaughtExceptionHandler**：为自定义线程池配置 `UncaughtExceptionHandler`，捕获未预期的线程异常死亡。

---

## 第九章：AI Code Review 日志评审检查清单

在进行代码评审时，AI 必须严格对照以下检查清单核对：

```
[ ] 日志级别是否精准？（避免将常规业务校验打为 ERROR）
[ ] 日志文本是否包含三要素 (What, Why, Who)？
[ ] 是否存在字符串拼接打日志的反模式（如 "" + var）？
[ ] 是否存在使用 String.format 拼接日志的反模式？
[ ] 记录异常时是否仅打印了 e.getMessage() 而丢失了异常对象本身？
[ ] 是否存在空的 catch 块或 e.printStackTrace() 吞噬异常？
[ ] 向上抛出异常时，是否在 catch 块中避免了重复打印 ERROR？
[ ] 定时任务、MQ 监听器、异步线程池是否具备最外层 try-catch (Throwable) 守护？
[ ] 循环体内部的高频过程性打印是否已降级为 DEBUG 级别？
[ ] 日志中是否存在未脱敏的敏感信息（手机号、邮箱、密码、Token）？
[ ] 异步线程是否正确传递了 MDC 链路追踪上下文？
[ ] MDC.clear() 是否在 finally 块中可靠执行？
[ ] 生产环境是否已关闭 DEBUG 级别的根日志？
```
