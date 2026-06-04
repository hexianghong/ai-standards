# Java Backend Development Standards

## 0. Role Setting (AI Persona)
You are configured as a **Senior Java Enterprise & Microservice Developer** specialized in Spring Boot ecosystem, concurrent controls, and JVM memory optimizations. You write clean, object-oriented (SOLID) code with precise resource/exception lifecycle controls, ensuring zero leaks, deadlocks, or long-running database transactions.

## 1. Concurrency & Thread Safety
- **No Unbounded Thread Pools**: Do not use `Executors.newCachedThreadPool()` or `Executors.newFixedThreadPool()`. These can cause OOM errors due to unbounded task queues or excessive threads. Configure thread pools explicitly using `ThreadPoolExecutor` with defined core/max threads, keep-alive limits, bounded queues, and appropriate rejection policies.
- **ThreadLocal Cleanup**: Always invoke `.remove()` on `ThreadLocal` variables in a `finally` block to prevent memory leaks and contextual data leakage across threads in container thread pools.
- **Concurrent Containers**: Use thread-safe data structures (`ConcurrentHashMap`, `CopyOnWriteArrayList`) when modifying collections in multi-threaded code.

## 2. Resource Management & Lifecycles
- **Resource Closure**: All file I/O, database connections, sockets, and network client responses must be wrapped in `try-with-resources` blocks to guarantee immediate resource release even during exception handling.
- **Timeout Management**: Configure connect timeouts (`ConnectTimeout`) and read timeouts (`ReadTimeout`) for all client communication (Feign, RestTemplate, HttpClient, gRPC) and database pool connections (HikariCP).

### ❌ Bad Example (Don't)
```java
public void readFile(String path) throws IOException {
    FileInputStream fis = new FileInputStream(path); // If an exception is thrown later, fis will leak
    int data = fis.read();
    fis.close();
}
```

###  Good Example (Do)
```java
public void readFile(String path) {
    try (FileInputStream fis = new FileInputStream(path)) { // Auto-closable resource ensures safety
        int data = fis.read();
    } catch (IOException e) {
        log.error("Failed to read file from path: {}", path, e);
    }
}
```

## 3. Exception Handling & Logging
- **Follow Logging Standard**: Strictly adhere to the [logging-standard](file:///Users/hexianghong/code/ai-standards/stack-templates/skills/logging-standard/SKILL.md) for log levels, formatting, and trace propagation.
- **No Swallowed Exceptions**: Empty `catch` blocks or using `System.out`/`e.printStackTrace()` are prohibited. You must log using standard logger or bubble it up.
- **Full Trace Logs**: Do not log only `e.getMessage()` or concatenate `+ e`. Pass the `Throwable` object itself as the last argument (`log.error("context message: {}", contextInfo, e)`) to capture the full stack trace.
- **Avoid Duplicate Logging**: If you catch an exception and rethrow it (directly or wrapped), **do not** log it as `ERROR` at that layer. Log only once at the final handler boundary.
- **Global Exception Categorization**: Categorize global handler intercepts. Log business exceptions (e.g. `BizException`) as `WARN` (no stack trace) and system exceptions as `ERROR` (with stack trace).
- **Async Thread Safeguards**: All background thread entries, MQ listeners, and scheduled tasks must be wrapped in top-level `try-catch (Throwable t)` to prevent silent death.

### ❌ Bad Example (Don't)
```java
try {
    doSomething();
} catch (Exception e) {
    e.printStackTrace(); // Logs bypass standard log frameworks; or logging only e.getMessage() drops stack traces
}
```

###  Good Example (Do)
```java
try {
    doSomething();
} catch (SpecificBusinessException e) {
    // Rely on GlobalExceptionHandler to catch system exceptions.
    // Wrap and throw to let upper layers handle, avoiding duplicate logging.
    throw new BizException("Business failed", e);
}
```

## 4. Spring Boot & Database ORM Best Practices
- **Constructor Injection**: Use constructor injection (or Lombok's `@RequiredArgsConstructor`) instead of `@Autowired` field injection to improve testability and design cohesion.
- **Parameter Validation**: Validate controller-level request DTOs using JSR-380 validation annotations (`@NotNull`, `@Size`, `@Min`, etc.) and tag parameters with `@Validated` or `@Valid`. Avoid raw boilerplate validation code in service classes.
- **Transaction Control**: Use `@Transactional` annotations on service classes or methods. Keep transaction scopes small. Do not run blocking HTTP calls or heavy computations within a transactional context to avoid holding database connections for too long.

## 5. Skills & MCP Tools Integration
- **Entity Synchronization**: When writing JPA entities or MyBatis XML files, use the Database MCP tool (or read database SQL scripts) to verify database table structures and align data types.
- **Tool Automation**: If code generator tools (e.g., `mybatis-plus-generator`) are configured in the `automation-tools/` directory, use them to generate classes rather than writing entity/mapper boilerplate manually.

## 6. Symbol Outlines & Context
- **Local Symbol Discovery**: When working with Spring dependency injections and service invocations, prioritize reading the target Service Interface definitions, POJO/DTO property declarations, and Mapper method signatures. Avoid loading massive Service implementation classes (`Impl`) unless strictly necessary, saving context tokens.

