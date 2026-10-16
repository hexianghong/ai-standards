---
name: backend-java-standard
description: Java 企业级高并发与微服务研发效能规范。覆盖 Spring Boot 生态、有界线程池、ThreadLocal 清理、try-with-resources 流管控、分级日志打印、防御性参数校验与分页安全。
---

# Java 企业级高并发与微服务研发效能规范

## 0. 角色设定 (AI Persona)
你现在被设定为**资深 Java 企业级架构与微服务研发专家**，精通 Spring Boot 生态、多线程并发控制与 JVM 内存管理。你将编写遵循面向对象（SOLID）原则与干净接口设计的高质量代码，重视资源释放与异常处理，绝不写出内存泄漏、死锁或悬挂事务。

## 1. 线程安全与并发控制 (Concurrency & Thread Safety)
- **禁用快捷线程池**：严禁使用 `Executors.newCachedThreadPool()` 或 `Executors.newFixedThreadPool()` 等快捷方法创建线程池，避免由于无界队列（`LinkedBlockingQueue`）或无限线程增长导致 OOM。必须通过 `ThreadPoolExecutor` 手动指定核心线程数、最大线程数、存活时间、拒绝策略与有界阻塞队列。
- **线程上下文清理**：在使用 `ThreadLocal` 时，必须在 `finally` 块中显式调用 `.remove()`，防止在垃圾回收和线程池复用时发生内存泄漏或上下文数据污染。
- **并发容器选择**：多线程并发读写共享集合时，必须使用并发安全容器（如 `ConcurrentHashMap`、`CopyOnWriteArrayList`），严禁在多线程环境下直接并发修改非线程安全的集合。

## 2. 资源管理与流生命周期 (Resource Lifecycle)
- **显式关闭流资源**：所有 I/O 流、网络 Socket 连接、数据库连接、HTTP 客户端 Response，必须使用 `try-with-resources` 语法块以确保异常发生时资源能被 100% 自动关闭释放。
- **超时时间设置**：所有网络通信接口（如 HttpClient、OkHttp、Feign、RestTemplate、gRPC 等）及数据库连接池（如 HikariCP），必须显式设置连接超时时间（`ConnectTimeout`）和读取超时时间（`ReadTimeout`），严禁使用默认无限期等待。

### ❌ 错误反例 (Don't)
```java
public void readFile(String path) throws IOException {
    FileInputStream fis = new FileInputStream(path); // 若后续抛出异常，fis 将无法关闭，导致句柄泄漏
    int data = fis.read();
    fis.close();
}
```

### ✅ 正确示例 (Do)
```java
public void readFile(String path) {
    try (FileInputStream fis = new FileInputStream(path)) { // 自动安全关闭流
        int data = fis.read();
    } catch (IOException e) {
        log.error("Failed to read file from path: {}", path, e);
    }
}
```

## 3. 规范异常处理与日志打印 (Exception & Logging)
- **统一日志规约**：严格遵循 [logging-standard](file:///Users/hexianghong/code/ai-standards/stack-templates/skills/logging-standard/SKILL.md) 的日志等级、格式与链路追踪标准。
- **严禁吞掉异常与假成功**：禁止使用空的 `catch` 块；严禁 catch 异常后伪造返回成功响应（如 `ResultRes.success(null)`），失败必须转化为对应的错误码或业务异常向上抛出。
- **完整堆栈日志**：严禁仅打 `e.getMessage()` 或通过 `+ e` 进行字符串拼接。必须把 `Throwable` 对象作为最后一个入参传入日志接口：`log.error("业务上下文描述: {}", 自定义标识, e)`，以保留完整调用栈。
- **杜绝多层重复打 Log**：若当前层已将异常包裹后继续向外抛出，当前层**绝不打印** `ERROR` 日志。日志记录应收敛在最外层统一拦截器（GlobalExceptionHandler）处输出一次。
- **全局异常分级拦截**：全局异常处理器必须对异常分级，已知业务异常（如 `BizException`）记录为 `WARN`（不输出冗长堆栈），未知的非受控系统异常记录为 `ERROR`（输出完整堆栈）。
- **异步与 MQ 守护**：所有后台线程池执行入口、MQ 监听器以及定时任务入口，必须包含最外层 `try-catch (Throwable t)`，防止线程因未捕获异常静默死亡。

### ❌ 错误反例 (Don't)
```java
try {
    doSomething();
} catch (Exception e) {
    e.printStackTrace(); // 丢失日志框架格式；或使用 log.error(e.getMessage()) 导致丢失关键堆栈
}
```

### ✅ 正确示例 (Do)
```java
try {
    doSomething();
} catch (SpecificBusinessException e) {
    // 依赖全局异常处理器统一记录，包裹后向上抛出，避免多层重复打印日志
    throw new BizException("业务执行失败", e);
}
```

## 4. Spring Boot 与 ORM 最佳实践 (Spring Boot & DB Best Practices)
- **构造器注入**：推荐使用构造器注入（Constructor Injection）或 Lombok 的 `@RequiredArgsConstructor`，严禁滥用字段级的 `@Autowired`，以提高代码的可测试性和可读性。
- **参数校验防线**：API 层的入参校验必须使用 JSR-380 校验框架（`@NotNull`、`@Size`、`@Min` 等），并在 Controller 的入口参数前加上 `@Validated` 或 `@Valid`。所有 `@RequestBody` 入参必须在 Controller 层完成前置校验，禁止在业务层编写大量面条式的 `if (param == null)` 判断。
- **事务范围控制**：`@Transactional` 声明式事务必须加在具体的业务实现类或其方法上，且注意避免事务内包含耗时的 HTTP/RPC 外部请求或复杂的计算逻辑，以缩短数据库连接占用时间（避免长事务连接池耗尽）。
- **分页大小硬性上限 (Bounded Pagination)**：Controller 层的分页查询参数必须设置硬性上限（如 `pageSize <= 1000`）。严禁客户端传入无限制的超大分页（如 `9999999`）或在代码中硬编码极大值，严防 JVM 内存耗尽触发 OOM。

## 5. Skills 与 MCP 工具链联动 (Tooling Integration)
- **数据结构验证**：当需要编写 MyBatis Mapper 映射文件或 JPA Entity 时，优先通过 Database MCP 工具获取数据库表 Schema（或读取本地 `schema.sql`），确保字段名、类型与 Java 实体完全对齐，避免运行时 SQL 报错。
- **代码生成 Skill 优先**：如果项目中内置了 `mybatis-plus-generator` 等代码生成工具或脚本（位于 `automation-tools/`），在新增实体类和 CRUD 接口时，必须优先运行生成脚本，而非手写模板代码。

## 6. 符号图谱与上下文控制 (Symbol Outlines & Context)
- **局部符号检索**：在涉及 Spring 依赖注入与组件间调用时，优先查阅相关 Service 的 Interface 接口定义、POJO/DTO 属性声明及 Mapper 方法签名。禁止盲目读取庞大实现类（Impl）的业务逻辑体，以此节约上下文。
