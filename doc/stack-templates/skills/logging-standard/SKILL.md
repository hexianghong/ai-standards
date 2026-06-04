---
name: logging-standard
description: >
  统一日志规范技能（跨语言）。适用于 Java（SLF4J/Logback）、Go（slog/zap）项目。
  覆盖：日志级别使用原则、结构化字段 Schema、TraceId 上下文传播、PII 脱敏红线、
  性能优化、反模式识别。当涉及任何日志打印、日志框架选型、可观测性设计时，必须加载本 Skill。
---

# 统一日志规范 (Unified Logging Standard)

> [!IMPORTANT]
> **加载时机**：当任务涉及以下任一场景时，AI 必须主动加载并严格遵守本规范：
> - 编写包含 `log.info` / `log.error` / `log.warn` / `log.debug` 的业务代码
> - 设计或评审 Logback / Log4j2 / slog / zap 配置文件
> - 实现 HTTP 过滤器、AOP 切面、全局异常处理器等切面日志
> - 设计跨服务调用的链路追踪（TraceId 传播）
---

## 第 1 章：日志级别使用原则（强制红线）

正确选择日志级别，是降低噪音、提升排障效率的第一道防线。

| 级别 | 使用场景 | 严禁场景 |
|------|----------|----------|
| `ERROR` | 导致业务功能不可用的异常；需要立即人工介入的故障 | 已预期的业务校验失败（如用户名重复）；可自动重试且已恢复的临时错误 |
| `WARN` | 可恢复但需要关注的异常情况；配置项缺失使用了默认值；数据不一致需修复 | 正常业务流程中的分支判断；频繁触发的业务预警（会产生大量噪音） |
| `INFO` | 服务启动/停止关键节点；核心业务流程的关键里程碑（如订单创建、支付成功）；定时任务开始/结束 | 循环体内部的过程性输出（每次迭代都打）；高频请求的入参/出参（生产环境） |
| `DEBUG` | 调试阶段的详细入参/出参、SQL 执行结果、中间计算状态 | 生产环境（必须在 `application.yml` 中配置 `pro` 环境日志级别为 INFO） |
| `TRACE` | 极细粒度的方法调用链追踪，通常仅本地开发使用 | 任何非开发环境 |

### ❌ 错误反例：级别误用
```java
// 反例1: 用 ERROR 输出正常的业务预警，导致告警风暴
log.error("用户 {} 登录失败，密码错误次数: {}", userId, count); // 应用 WARN

// 反例2: INFO 级别在循环内打印，生产日志量爆炸
for (User user : allUsers) {
    log.info("正在处理用户: {}", user.getId()); // 禁止，应用 DEBUG
}
```

### ✅ 正确示例
```java
// 正确1: WARN 记录可恢复的业务预警
log.warn("用户 {} 密码连续错误 {} 次，即将触发锁定", userId, failCount);

// 正确2: 定时任务使用 INFO 记录里程碑，过程细节用 DEBUG
log.info("[ServiceAccountTask] 微服务同步任务开始, totalUsers={}", userList.size());
for (User user : userList) {
    log.debug("[ServiceAccountTask] 处理用户: id={}, account={}", user.getId(), user.getAccount());
}
log.info("[ServiceAccountTask] 微服务同步任务结束, success={}, fail={}", successCount, failCount);
```

---

## 第 2 章：日志消息文案格式规范

### 2.1 消息格式模板
所有日志消息**必须**遵循以下结构，确保可检索性：

```
[模块标签] 动词短语 + 关键上下文参数
```

**必须包含的信息维度：**
- **模块标签**（可选但推荐）：用方括号标注所在功能模块，如 `[WxCpSync]`、`[Auth]`
- **动词短语**：描述"发生了什么"，用主动语态
- **关键标识符**：包含能定位问题的最小上下文（如 userId, orderId, traceId）

### 2.2 禁止的文案模式

```java
// ❌ 禁止1: 无上下文的裸消息 —— 排障时完全无法定位
log.error("处理失败");
log.info("开始了");

// ❌ 禁止2: 字符串拼接（会在 DEBUG 不开启时也执行字符串构建，浪费 CPU）
log.error("systemIdentifying: " + systemId + " not exist!"); // 实际发现于 MenuServiceImpl.java

// ❌ 禁止3: 使用 String.format 构造日志消息
log.error(String.format("[AppSyncClientService] param: %s", httpEntity)); // 实际发现于 SmsClientService.java

// ❌ 禁止4: 仅打印异常 message，丢失堆栈
log.error("hasPathPermission error: " + ex.getMessage(), ex.getCause()); // 应传入 ex 本身
```

### 2.3 正确的文案示例

```java
// ✅ 结构化占位符 + 完整异常堆栈
log.error("[MenuService] 查询菜单失败: systemIdentifying={}", systemId, e);

// ✅ 带里程碑标记的 INFO
log.info("[WxCpSync] 同步完成: total={}, added={}, updated={}, deactivated={}",
    total, addedCount, updatedCount, deactivatedCount);

// ✅ WARN 带可操作的上下文
log.warn("[PositionService] 发现重名职位: name='{}', count={}, 返回第一条(id={})",
    name, count, firstId);
```

---

## 第 3 章：结构化日志字段 Schema（强制）

所有服务输出的日志，**必须包含以下核心字段**，由日志框架统一注入（禁止在业务代码中手动拼接）：

### 3.1 标准字段定义

| 字段名 | 类型 | 来源 | 说明 |
|--------|------|------|------|
| `timestamp` | String（ISO-8601）| 框架自动 | 日志产生时间，如 `2026-06-04T09:40:00.000+08:00` |
| `level` | String | 框架自动 | `ERROR` / `WARN` / `INFO` / `DEBUG` |
| `service` | String | 配置注入 | 服务名，对应 `spring.application.name`（如 `ms-iam`）|
| `env` | String | 配置注入 | 运行环境：`debug` / `dev` / `test` / `pro` |
| `traceId` | String | MDC / context 注入 | 全链路追踪 ID（见第 4 章）|
| `spanId` | String | MDC / context 注入 | 当前服务调用段 ID |
| `thread` | String | 框架自动 | 线程名 |
| `logger` | String | 框架自动 | 产生日志的类全限定名 |
| `message` | String | 业务代码 | 业务日志消息体（遵循第 2 章格式）|

### 3.2 Java Logback JSON 配置模板

生产环境的 `logback-spring.xml` **必须输出 JSON 格式**（便于 ELK/Loki 索引）：

```xml
<?xml version="1.1" encoding="UTF-8"?>
<configuration>
    <!-- 引入公共基础配置（包含 JSON appender） -->
    <include resource="cn/wowjoy/commons/logging/logging-base.xml" />

    <!-- 生产环境：仅 JSON 输出到 stdout，由 K8s/Fluentd 采集 -->
    <springProfile name="pro,test">
        <root level="INFO">
            <appender-ref ref="JSON_STDOUT" />
        </root>
    </springProfile>

    <!-- 开发环境：彩色控制台输出 + Mapper 层 DEBUG -->
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
// 推荐：统一在应用初始化时创建全局 zap logger
func NewLogger(env string) *zap.Logger {
    var cfg zap.Config
    if env == "pro" || env == "test" {
        cfg = zap.NewProductionConfig() // JSON 格式输出
    } else {
        cfg = zap.NewDevelopmentConfig() // 可读控制台格式
    }
    cfg.OutputPaths = []string{"stdout"}  // K8s 场景：输出到 stdout
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

## 第 4 章：TraceId 全链路传播（强制）

微服务场景下，**必须实现跨服务的 TraceId 传播**，确保一次请求的所有日志可关联查询。

### 4.1 Java - MDC 传播方案

**核心原则：** 在 HTTP 请求入口注入 TraceId 到 MDC，在所有出口（HTTP 请求头、异步线程）传递。

#### 步骤 1: 实现 OncePerRequestFilter 注入 MDC

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
            // 优先从上游请求头读取，若无则生成新 TraceId
            String traceId = Optional.ofNullable(request.getHeader(TRACE_ID_HEADER))
                .filter(StringUtils::hasText)
                .orElse(UUID.randomUUID().toString().replace("-", ""));
            String spanId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

            MDC.put(MDC_TRACE_KEY, traceId);
            MDC.put(MDC_SPAN_KEY, spanId);
            // 将 traceId 写回响应头，供调用方关联
            response.setHeader(TRACE_ID_HEADER, traceId);

            filterChain.doFilter(request, response);
        } finally {
            // 关键：必须在 finally 中清理，防止线程复用时 MDC 污染
            MDC.clear();
        }
    }
}
```

#### 步骤 2: Logback 配置中引用 MDC 字段

```xml
<!-- logback-spring.xml JSON pattern 中引用 MDC -->
<pattern>
  {"timestamp":"%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX}","level":"%level",
   "service":"${APP_NAME}","env":"${APP_ENV}",
   "traceId":"%X{traceId}","spanId":"%X{spanId}",
   "thread":"%thread","logger":"%logger{36}","message":"%message"}
</pattern>
```

#### 步骤 3: 异步线程中传递 MDC

```java
// 禁止：普通 Runnable 派生异步任务，MDC 上下文丢失
CompletableFuture.runAsync(() -> {
    log.info("异步任务 traceId 已丢失！"); // traceId 为空
});

// 正确：使用 MDC.getCopyOfContextMap() 传递上下文
Map<String, String> mdcContext = MDC.getCopyOfContextMap();
CompletableFuture.runAsync(() -> {
    try {
        if (mdcContext != null) MDC.setContextMap(mdcContext);
        log.info("[AsyncTask] 异步任务执行, traceId 已正确传递");
        // ... 业务逻辑
    } finally {
        MDC.clear(); // 异步线程同样必须清理
    }
});
```

#### 步骤 4: Feign/RestTemplate 传递 TraceId 到下游

```java
// Feign 拦截器：自动在请求头中携带 traceId
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

### 4.2 Go - context 传播方案

```go
// 中间件：从请求头提取或生成 traceId，注入到 context
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

// 业务层：从 context 提取 traceId 写入结构化日志
func ProcessOrder(ctx context.Context, orderId string) error {
    traceId, _ := ctx.Value("traceId").(string)
    logger := zap.L().With(zap.String("traceId", traceId))

    logger.Info("开始处理订单", zap.String("orderId", orderId))
    // ...
    return nil
}
```

---

## 第 5 章：PII 脱敏红线（安全强制）

严禁在任何环境（包括 debug/dev）的日志中输出以下**未脱敏信息**：

| 敏感类型 | 脱敏规则 | 示例 |
|----------|----------|------|
| 手机号 | 保留前 3 位和后 4 位 | `138****5678` |
| 邮箱 | 用户名保留前 2 位，后接 `***` | `he***@example.com` |
| 密码/Token | **完全不打印**，用 `[REDACTED]` 替代 | `[REDACTED]` |
| 身份证号 | 保留前 6 位和后 4 位 | `110101********1234` |
| 银行卡号 | 仅保留后 4 位 | `****5678` |

### ❌ 实际发现的违规模式（参考真实项目）
```java
// 违规：企业微信同步时直接打印用户 phone/email（发现于 WxCpDepartmentServiceImpl）
log.info("企业微信端获取用户（userId={}, email={}, phone={}）",
    wxCpUser.getUserId(), wxCpUser.getEmail(), wxCpUser.getMobile()); // ❌ 明文 PII

// 正确：脱敏后打印
log.info("[WxCpSync] 企业微信用户: userId={}, email={}, phone={}",
    wxCpUser.getUserId(),
    maskEmail(wxCpUser.getEmail()),    // he***@example.com
    maskPhone(wxCpUser.getMobile())); // 138****5678
```

### Java 脱敏工具方法模板
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

    /** 密码/Token: 完全屏蔽 */
    public static String maskSecret(String secret) {
        return "[REDACTED]";
    }
}
```

---

## 第 6 章：性能要求

### 6.1 高频路径禁止无条件打日志
```java
// ❌ 禁止：高频接口（如权限校验）每次请求都打印 DEBUG，生产环境可能 QPS 很高
@Override
public boolean hasPermission(String userId, String path) {
    log.debug("检查权限: userId={}, path={}", userId, path); // 如果 QPS=1000，每秒 1000 条 DEBUG 日志

    // ✅ 正确：使用条件判断，仅在 DEBUG 级别开启时才构造日志参数
    if (log.isDebugEnabled()) {
        log.debug("检查权限: userId={}, path={}", userId, path);
    }
    // ...
}
```

### 6.2 定时任务日志规范
```java
// ✅ 定时任务日志模板（参考 ServiceAccountTask 优化版本）
@Scheduled(cron = "${service-account.sync.cron:0 0 2 * * ?}")
public void syncServiceAccounts() {
    long startTime = System.currentTimeMillis();
    log.info("[ServiceAccountTask] 定时同步开始");

    int successCount = 0, failCount = 0;
    try {
        // ... 业务逻辑，循环体内用 DEBUG
        log.info("[ServiceAccountTask] 定时同步完成: success={}, fail={}, costMs={}",
            successCount, failCount, System.currentTimeMillis() - startTime);
    } catch (Exception e) {
        log.error("[ServiceAccountTask] 定时同步异常中断: success={}, fail={}", successCount, failCount, e);
    }
}
```

### 6.3 禁止在 catch 块中重复打印同一异常
```java
// ❌ 错误：异常被重复打印（Service 层和 Controller 层各打一次，导致日志重复）
// Service 层
} catch (Exception e) {
    log.error("业务处理失败", e);
    throw new BizException("处理失败", e); // 异常继续向上传递
}
// Controller 层（GlobalExceptionHandler 又打了一次）
} catch (BizException e) {
    log.error("Controller 捕获异常", e); // 重复！
}

// ✅ 正确：异常只在最终兜底处打印一次（推荐在 GlobalExceptionHandler 统一打印）
@ExceptionHandler(Exception.class)
public RestResult handleException(Exception e, HttpServletRequest request) {
    log.error("[GlobalExceptionHandler] 未处理异常: path={}, method={}",
        request.getRequestURI(), request.getMethod(), e);
    return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
}
```

---

## 第 7 章：环境级别配置矩阵

| 环境 | 根日志级别 | Mapper/DAO 级别 | 输出格式 | 采集方式 |
|------|-----------|----------------|----------|---------|
| `debug`（本地） | DEBUG | DEBUG | 彩色 Console | 手动查看 |
| `dev`（开发环境 K8s） | DEBUG | DEBUG | 彩色 Console | kubectl logs |
| `test`（测试环境 K8s） | INFO | INFO | JSON | Fluentd → ELK |
| `pro`（生产环境 K8s） | INFO | INFO | JSON | Fluentd → ELK |

> [!NOTE]
> 参考 `ms-iam/bootstrap.yml` 中的现有配置：`debug` 环境 Mapper 级别已设为 `debug`，`pro`/`test` 已设为 `info`，需确保新项目对齐此约定。

---

## 第 9 章：ERROR 类型日志专项处理规范（深度细化）

`ERROR` 是所有日志级别中权重最高、最敏感的一级。滥用 `ERROR` 会造成告警疲劳，而错误的使用方式则会导致排查线索中断。以下是针对 `ERROR` 类型日志的专项深度规范：

### 9.1 判定边界与全局异常处理器分级捕获
严禁将“预期内的业务异常”或“可自愈的偶发抖动”标记为 `ERROR`。这需要在业务开发及**全局异常处理器（GlobalExceptionHandler）**中进行明确分级：

1. **业务异常（如 `BizException`、输入参数不合法等）**：在全局异常处理器中，必须以 `WARN` 级别记录，且**严禁打印完整的异常堆栈**，只记录请求路径、错误码及错误提示。
2. **系统异常（如 `NullPointerException`、`SQLException` 等非预期 RuntimeException）**：在全局异常处理器中，必须以 `ERROR` 级别记录，且**必须打印完整的异常堆栈**，并带上详细请求上下文。

#### ✅ Java 全局异常处理器分级捕获示例
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. 业务异常分级：使用 WARN 打印，仅记录摘要信息（不打印完整堆栈）
    @ExceptionHandler(BizException.class)
    public RestResult<?> handleBizException(BizException e, HttpServletRequest request) {
        log.warn("[GlobalException] 业务异常: path={}, method={}, code={}, msg={}", 
            request.getRequestURI(), request.getMethod(), e.getCode(), e.getMessage());
        return RestResult.error(e.getCode(), e.getMessage());
    }

    // 2. 系统异常分级：使用 ERROR 打印，必须输出完整堆栈 e
    @ExceptionHandler(Exception.class)
    public RestResult<?> handleSystemException(Exception e, HttpServletRequest request) {
        log.error("[GlobalException] 未处理系统故障: path={}, method={}", 
            request.getRequestURI(), request.getMethod(), e); // 最后一个参数为 e，输出完整堆栈
        return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
    }
}
```

---

### 9.2 ERROR 日志内容“三要素”原则
任何一条 `ERROR` 日志的消息体，必须具备以下三个核心要素（**What**, **Why**, **Who**）：

1. **发生了什么 (What happened)**：明确描述出错的业务操作或系统行为（如：`"发送扣款短信失败"`，而非 `"短信发送出错"`）。
2. **为什么失败 (Why it failed)**：说明失败的具体技术成因或数据状态（如：`"HTTP 响应状态码为 503"`，而非 `"异常"`）。
3. **关联上下文参数 (Who is affected)**：带上能够定位故障范围的关键实体标识（如 `userId`、`orderId`、`traceId`）。

#### ❌ 不合格的 ERROR 日志示例
```java
// 错误 1：无任何上下文，不知影响了哪个用户或订单
log.error("解密扣款回调失败！", e);

// 错误 2：用 getMessage 吞噬了堆栈信息，且说明语义不明
log.error("定时结算任务出错: " + e.getMessage()); 
```

#### ✅ 合格的 ERROR 日志正例
```java
// 正确 1：包含了 What(解密回调失败)、Why(签名不一致)、Who(订单号/支付流水号) 以及堆栈 e
log.error("[Callback] 核心扣款回调签名验证失败: orderId={}, payChannelId={}, expectedSign={}, actualSign={}",
    orderId, channelId, expSign, actSign, e);

// 正确 2：Go slog 实现三要素
logger.Error("定时结算任务执行中断",
    slog.String("taskName", "MonthlySettle"),
    slog.Int("processedCount", processed),
    slog.Any("error", err), // Why
)
```

---

### 9.3 “谁处理，谁打印”与禁止重复打印
为防止同一条异常在方法调用链中的每一层都被打印，导致日志膨胀和多重告警：
- **如果当前层只捕获异常，并原样（或包装后）向外 `throw`，则当前层绝对禁止打印 `ERROR` 日志。**
- **只能在最终吞掉并处理了该异常（不再向外抛出）的终点，打印一次 `ERROR` 日志。**

#### ❌ 重复打印与异常淹没反例
```java
// 底层 Service：打印了 ERROR 后又抛出，重复！
public void executePay(Order order) {
    try {
        paymentClient.pay(order);
    } catch (Exception e) {
        log.error("支付接口调用失败: orderId={}", order.getId(), e); // ❌ 错误：此处不应打印 ERROR
        throw new BizException("支付失败", e);
    }
}
```

#### ✅ 正确写法
```java
// 底层 Service：仅包装异常，原样抛出，不打印 ERROR 日志
public void executePay(Order order) {
    try {
        paymentClient.pay(order);
    } catch (Exception e) {
        throw new BizException("支付失败", e); // 向上抛出，由 Controller 全局处理器统一打印
    }
}
```

---

### 9.4 严禁静默 catch 与吞噬异常
在代码中，**严禁使用空的 catch 块，或者仅使用 `System.out` / `e.printStackTrace()` 来“处理”异常。** 这会导致系统错误在没有任何日志记录的情况下静默流失，带来极大的线上隐患。

#### ❌ 吞噬异常反例
```java
// 反例 1：完全静默，出了问题没有任何日志
try {
    saveData();
} catch (Exception e) {
}

// 反例 2：本地开发常用，但在生产环境中 `printStackTrace()` 会输出到 stdout 导致日志管理平台无法正确解析日志结构，且丢失上下文
try {
    saveData();
} catch (Exception e) {
    e.printStackTrace();
}
```

#### ✅ 安全的异常捕获处理
```java
// 正常处理：至少用日志框架记录，或者向上抛出
try {
    saveData();
} catch (Exception e) {
    log.error("[DataService] 保存业务数据失败", e);
    // 或者 throw new SystemException(e);
}
```

---

### 9.5 异步守护与未捕获异常（Uncaught Exception）全局拦截
由于异步线程（自定义线程池、CompletableFuture 任务）或定时任务脱离了 HTTP 容器的主线程链，常规的全局异常处理器无法捕获它们抛出的未捕获 RuntimeException。若无兜底日志设计，这些异常会被线程池直接“吞掉”，导致程序静默消亡。

1. **入口 try-catch 保护**：每个后台任务（如定时任务方法体、MQ 监听器、Runnable/Callable 任务体）的最高入口处，必须用 `try { ... } catch (Throwable t) { log.error("...", t); }` 包裹。
2. **全局未捕获异常处理器（UncaughtExceptionHandler）**：自定义线程池在初始化时必须显式配置未捕获异常监听器，并在其内记录 `ERROR` 日志。

#### ❌ 异步线程静默挂掉反例
```java
// 错误：当 executeTask 抛出 RuntimeException 时，线程静默消亡，无任何日志
executor.submit(() -> {
    executeTask();
});
```

#### ✅ 安全的异步任务正例
```java
// 正确 1：使用 try-catch (Throwable) 彻底包裹异步入口
executor.submit(() -> {
    try {
        executeTask();
    } catch (Throwable t) {
        log.error("[AsyncThread] 异步任务执行过程中发生严重异常", t);
    }
});

// 正确 2：为线程池定义兜底 UncaughtExceptionHandler（以 Java ThreadFactory 为例）
ThreadFactory customFactory = new ThreadFactoryBuilder()
    .setNameFormat("biz-pool-%d")
    .setUncaughtExceptionHandler((thread, throwable) -> {
        log.error("[FatalError] 线程池异常挂掉: thread={}", thread.getName(), throwable);
    })
    .build();
```

---

## 第 10 章：AI 检查清单（Code Review 用）

在提交包含日志代码的 PR 时，AI 必须逐项检查以下清单：

```
[ ] 日志级别使用是否合理？（参考第 1 章与第 9.1 节）
[ ] 消息文案是否包含足够的上下文标识符，且遵循三要素（What, Why, Context）？（参考第 2 章与第 9.2 节）
[ ] 是否存在字符串拼接日志？（`"" + var` 模式）
[ ] 是否存在 String.format 构造日志的反模式？
[ ] 是否存在 e.getMessage() 而非传入完整异常对象 e？（参考第 9.2 节）
[ ] 是否存在静默 catch 块或仅用 e.printStackTrace() 吞噬异常的行为？（参考第 9.4 节）
[ ] 抛出异常 (throw) 的同时，是否避免了在 catch 中重复打印 ERROR？（参考第 9.3 节）
[ ] 异步线程/定时任务/监听器的最高入口是否增加了 try-catch (Throwable) 保护？（参考第 9.5 节）
[ ] 循环体内的 INFO 日志是否改为 DEBUG？
[ ] 是否存在打印 PII（手机号、邮箱明文）？
[ ] 异步线程是否正确传递了 MDC 上下文？
[ ] 是否在 finally 中清理了 MDC？
[ ] 生产环境配置是否已关闭 DEBUG 日志？
```

