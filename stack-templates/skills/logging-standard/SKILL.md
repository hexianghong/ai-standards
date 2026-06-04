---
name: logging-standard
description: >
  Unified logging standard skill (cross-language). Applicable to Java (SLF4J/Logback) and Go (slog/zap) projects.
  Covers: log level principles, structured field schemas, TraceId context propagation, PII masking rules,
  performance optimization, and anti-pattern recognition. Load this skill for logging implementation,
  log framework setup, or observability design.
---

# Unified Logging Standard

> [!IMPORTANT]
> **Activation Context**: AI must proactively load and strictly comply with this standard when the task involves any of the following scenarios:
> - Writing business code containing `log.info` / `log.error` / `log.warn` / `log.debug`
> - Designing or reviewing configuration files for Logback / Log4j2 / slog / zap
> - Implementing aspect logging such as HTTP filters, AOP aspects, or global exception handlers
> - Designing distributed tracing (TraceId propagation) across microservices

---

## Chapter 1: Log Level Usage Principles (Mandatory Guardrails)

Choosing the correct log level is the first line of defense in reducing log noise and boosting troubleshooting efficiency.

| Level | Usage Scenario | Strictly Forbidden Scenario |
|------|----------------|-----------------------------|
| `ERROR` | Exceptions that cause business features to become unavailable; failures requiring immediate manual intervention | Expected business validation failures (e.g., duplicate username); temporary errors that can be auto-retried and recovered |
| `WARN` | Recoverable exceptions that still require attention; missing configurations falling back to default values; data inconsistency requiring manual correction | Normal business flow branch logic; high-frequency business alerts (generates excessive noise) |
| `INFO` | Service start/stop critical milestones; key business process milestones (e.g., order created, payment successful); scheduled task start/stop | Process-oriented printouts inside loops (logged on every iteration); high-frequency request/response payloads (in Production) |
| `DEBUG` | Detailed request/response payloads during debugging; SQL execution results; intermediate computation states | Production environments (root log level for `pro` environment must be set to INFO in `application.yml`) |
| `TRACE` | Extremely fine-grained method call trace; typically used for local development only | Any non-development environment |

### ❌ Anti-pattern: Misused Log Levels
```java
// Anti-pattern 1: Using ERROR for normal business validation, causing alert storm
log.error("User {} login failed, password error count: {}", userId, count); // Should be WARN

// Anti-pattern 2: Printing INFO inside a loop, causing log explosion in production
for (User user : allUsers) {
    log.info("Processing user: {}", user.getId()); // Forbidden, should be DEBUG
}
```

### ✅ Correct Usage Examples
```java
// Example 1: Using WARN to record recoverable business warning
log.warn("User {} entered wrong password {} times, lockout will be triggered soon", userId, failCount);

// Example 2: Scheduled task uses INFO for milestones, detailed iterations use DEBUG
log.info("[ServiceAccountTask] Microservice synchronization task started, totalUsers={}", userList.size());
for (User user : userList) {
    log.debug("[ServiceAccountTask] Processing user: id={}, account={}", user.getId(), user.getAccount());
}
log.info("[ServiceAccountTask] Microservice synchronization task completed, success={}, fail={}", successCount, failCount);
```

---

## Chapter 2: Log Message Text Format Standard

### 2.1 Message Format Template
All log messages **must** follow this structure to ensure easy retrieval and searching:

```
[Module Tag] Verb phrase + key context parameters
```

**Required Information Dimensions:**
- **Module Tag** (optional but recommended): Bracketed functional module name, e.g., `[WxCpSync]`, `[Auth]`
- **Verb Phrase**: Describes "what happened" using active voice
- **Key Identifier**: Minimum context to locate the problem (e.g., userId, orderId, traceId)

### 2.2 Forbidden Patterns

```java
// ❌ Forbidden 1: Bare messages without context — impossible to debug
log.error("Failed");
log.info("Started");

// ❌ Forbidden 2: String concatenation (wastes CPU since string is constructed even when DEBUG is off)
log.error("systemIdentifying: " + systemId + " not exist!"); 

// ❌ Forbidden 3: Using String.format to construct log messages
log.error(String.format("[AppSyncClientService] param: %s", httpEntity)); 

// ❌ Forbidden 4: Printing only the exception message, losing the stack trace
log.error("hasPathPermission error: " + ex.getMessage(), ex.getCause()); // Exception ex itself should be passed
```

### 2.3 Correct Text Examples

```java
// ✅ Structured placeholders + complete exception stack trace
log.error("[MenuService] Failed to query menu: systemIdentifying={}", systemId, e);

// ✅ INFO with clear milestone metrics
log.info("[WxCpSync] Synchronization completed: total={}, added={}, updated={}, deactivated={}",
    total, addedCount, updatedCount, deactivatedCount);

// ✅ WARN with actionable context
log.warn("[PositionService] Duplicate position found: name='{}', count={}, returning first (id={})",
    name, count, firstId);
```

---

## Chapter 3: Structured Log Field Schema (Mandatory)

All logs emitted by services **must contain the following core fields**, injected automatically by the logging framework (manual splicing in business code is forbidden):

### 3.1 Standard Field Schema

| Field Name | Type | Source | Description |
|------------|------|--------|-------------|
| `timestamp` | String (ISO-8601) | Auto | Log generation time, e.g., `2026-06-04T09:40:00.000+08:00` |
| `level` | String | Auto | `ERROR` / `WARN` / `INFO` / `DEBUG` |
| `service` | String | Config | Service name, corresponding to `spring.application.name` (e.g., `ms-iam`) |
| `env` | String | Config | Environment: `debug` / `dev` / `test` / `pro` |
| `traceId` | String | MDC / context | Global distributed trace ID (see Chapter 4) |
| `spanId` | String | MDC / context | Current execution segment span ID |
| `thread` | String | Auto | Thread name |
| `logger` | String | Auto | Fully qualified class name of the logger |
| `message` | String | Business | Log message text (conforming to Chapter 2 format) |

### 3.2 Java Logback JSON Configuration Template

The production `logback-spring.xml` **must output logs in JSON format** (for ELK/Loki indexing):

```xml
<?xml version="1.1" encoding="UTF-8"?>
<configuration>
    <!-- Include common logging base (contains JSON appender) -->
    <include resource="cn/wowjoy/commons/logging/logging-base.xml" />

    <!-- Production & Test environments: output JSON to stdout, collected by K8s/Fluentd -->
    <springProfile name="pro,test">
        <root level="INFO">
            <appender-ref ref="JSON_STDOUT" />
        </root>
    </springProfile>

    <!-- Local & Dev environments: colored console output + Mapper DEBUG -->
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

### 3.3 Go zap Structured Configuration Template

```go
// Recommended: Initialize global zap logger on application startup
func NewLogger(env string) *zap.Logger {
    var cfg zap.Config
    if env == "pro" || env == "test" {
        cfg = zap.NewProductionConfig() // Outputs in JSON format
    } else {
        cfg = zap.NewDevelopmentConfig() // Readable console format
    }
    cfg.OutputPaths = []string{"stdout"} // K8s environment: output to stdout
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

## Chapter 4: TraceId End-to-End Propagation (Mandatory)

In a microservice architecture, **TraceId must be propagated across service boundaries** to ensure all logs for a single request can be correlated and searched together.

### 4.1 Java - MDC Propagation Scheme

**Core Principle**: Inject the TraceId into the MDC at the HTTP request entry point, and propagate it through all exit points (HTTP request headers, asynchronous threads).

#### Step 1: Implement OncePerRequestFilter to Inject MDC

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
            // Read traceId from upstream request headers; generate a new one if missing
            String traceId = Optional.ofNullable(request.getHeader(TRACE_ID_HEADER))
                .filter(StringUtils::hasText)
                .orElse(UUID.randomUUID().toString().replace("-", ""));
            String spanId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

            MDC.put(MDC_TRACE_KEY, traceId);
            MDC.put(MDC_SPAN_KEY, spanId);
            // Write traceId back to response header for caller correlation
            response.setHeader(TRACE_ID_HEADER, traceId);

            filterChain.doFilter(request, response);
        } finally {
            // CRITICAL: Clean up MDC in finally to prevent thread reuse pollution
            MDC.clear();
        }
    }
}
```

#### Step 2: Reference MDC Fields in Logback Pattern

```xml
<!-- Reference MDC in logback-spring.xml JSON pattern -->
<pattern>
  {"timestamp":"%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX}","level":"%level",
   "service":"${APP_NAME}","env":"${APP_ENV}",
   "traceId":"%X{traceId}","spanId":"%X{spanId}",
   "thread":"%thread","logger":"%logger{36}","message":"%message"}
</pattern>
```

#### Step 3: Propagate MDC to Asynchronous Threads

```java
// Forbidden: Spawning async task using raw Runnable, MDC context is lost
CompletableFuture.runAsync(() -> {
    log.info("TraceId is lost here!"); // traceId will be empty
});

// Correct: Use MDC.getCopyOfContextMap() to propagate context
Map<String, String> mdcContext = MDC.getCopyOfContextMap();
CompletableFuture.runAsync(() -> {
    try {
        if (mdcContext != null) MDC.setContextMap(mdcContext);
        log.info("[AsyncTask] Executing async task, TraceId propagated correctly");
        // ... business logic
    } finally {
        MDC.clear(); // Async thread must also clean up MDC
    }
});
```

#### Step 4: Propagate TraceId to Downstream via Feign/RestTemplate

```java
// Feign Interceptor: Automatically carry traceId in request headers
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

### 4.2 Go - context Propagation Scheme

```go
// Middleware: Extract or generate traceId, inject into context
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

// Business Layer: Extract traceId from context and log with it
func ProcessOrder(ctx context.Context, orderId string) error {
    traceId, _ := ctx.Value("traceId").(string)
    logger := zap.L().With(zap.String("traceId", traceId))

    logger.Info("Starting to process order", zap.String("orderId", orderId))
    // ...
    return nil
}
```

---

## Chapter 5: PII Masking Rules (Security Mandatory)

Printing unmasked **Personally Identifiable Information (PII)** in logs is strictly prohibited in all environments (including debug/dev):

| Sensitive Data Type | Masking Rule | Example |
|---------------------|--------------|---------|
| Phone Number | Keep first 3 and last 4 digits | `138****5678` |
| Email | Keep first 2 chars of username, suffix with `***` | `he***@example.com` |
| Password/Token | **Do not print at all**, replace with `[REDACTED]` | `[REDACTED]` |
| ID Card Number | Keep first 6 and last 4 digits | `110101********1234` |
| Bank Card Number | Keep only last 4 digits | `****5678` |

### ❌ Anti-pattern: Raw PII in Logs
```java
// Raw PII directly printed (found in WxCpDepartmentServiceImpl)
log.info("Get user from WeChat Work (userId={}, email={}, phone={})",
    wxCpUser.getUserId(), wxCpUser.getEmail(), wxCpUser.getMobile()); // ❌ Cleartext PII

// Correct: Print only after masking
log.info("[WxCpSync] WeChat Work user: userId={}, email={}, phone={}",
    wxCpUser.getUserId(),
    maskEmail(wxCpUser.getEmail()),    // he***@example.com
    maskPhone(wxCpUser.getMobile())); // 138****5678
```

### Java Masking Utility Method Template
```java
public class LogMaskUtil {
    /** Mask Phone Number: 138****5678 */
    public static String maskPhone(String phone) {
        if (!StringUtils.hasText(phone) || phone.length() < 7) return "[MASKED]";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    /** Mask Email: he***@example.com */
    public static String maskEmail(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) return "[MASKED]";
        String[] parts = email.split("@");
        String name = parts[0].length() > 2 ? parts[0].substring(0, 2) + "***" : "***";
        return name + "@" + parts[1];
    }

    /** Mask Password/Token: completely redact */
    public static String maskSecret(String secret) {
        return "[REDACTED]";
    }
}
```

---

## Chapter 6: Performance Requirements

### 6.1 No Unconditional Logging on High-Frequency Paths
```java
// ❌ Forbidden: Logging DEBUG unconditionally on high-frequency paths (e.g., auth check)
@Override
public boolean hasPermission(String userId, String path) {
    log.debug("Checking permission: userId={}, path={}", userId, path); // If QPS=1000, outputs 1000 logs/sec

    // ✅ Correct: Construct log arguments only when DEBUG level is enabled
    if (log.isDebugEnabled()) {
        log.debug("Checking permission: userId={}, path={}", userId, path);
    }
    // ...
}
```

### 6.2 Scheduled Task Logging Standard
```java
// ✅ Scheduled task logging template
@Scheduled(cron = "${service-account.sync.cron:0 0 2 * * ?}")
public void syncServiceAccounts() {
    long startTime = System.currentTimeMillis();
    log.info("[ServiceAccountTask] Scheduled synchronization started");

    int successCount = 0, failCount = 0;
    try {
        // ... business logic, use DEBUG inside loops
        log.info("[ServiceAccountTask] Scheduled synchronization completed: success={}, fail={}, costMs={}",
            successCount, failCount, System.currentTimeMillis() - startTime);
    } catch (Exception e) {
        log.error("[ServiceAccountTask] Scheduled synchronization interrupted: success={}, fail={}", successCount, failCount, e);
    }
}
```

### 6.3 Do Not Duplicate Exception Logging in Catch Blocks
```java
// ❌ Forbidden: Exception is printed twice (once in Service, once in Controller)
// Service Layer
} catch (Exception e) {
    log.error("Business processing failed", e);
    throw new BizException("Processing failed", e); // Exception continues to bubble up
}
// Controller Layer (GlobalExceptionHandler prints it again)
} catch (BizException e) {
    log.error("Controller caught exception", e); // Duplicate!
}

// ✅ Correct: Log the exception only once at the final boundary (recommended in GlobalExceptionHandler)
@ExceptionHandler(Exception.class)
public RestResult handleException(Exception e, HttpServletRequest request) {
    log.error("[GlobalExceptionHandler] Unhandled exception: path={}, method={}",
        request.getRequestURI(), request.getMethod(), e);
    return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
}
```

---

## Chapter 7: Environment Configuration Matrix

| Environment | Root Log Level | Mapper/DAO Level | Output Format | Collection Method |
|-------------|----------------|------------------|---------------|-------------------|
| `debug` (Local) | DEBUG | DEBUG | Colored Console | Manual Inspection |
| `dev` (Dev K8s) | DEBUG | DEBUG | Colored Console | `kubectl logs` |
| `test` (Test K8s) | INFO | INFO | JSON | Fluentd → ELK |
| `pro` (Prod K8s) | INFO | INFO | JSON | Fluentd → ELK |

> [!NOTE]
> Refer to the existing configuration in `ms-iam/bootstrap.yml`: `debug` Mapper level is set to `debug`, and `pro`/`test` is set to `info`. New projects should align with this convention.

---

## Chapter 9: Special Guidelines for ERROR Logs (Deep Refinement)

`ERROR` is the highest weight and most sensitive log level. Abuse of `ERROR` causes alert fatigue, while incorrect usage breaks the debugging trace. Below are the specific guidelines for handling `ERROR` logs:

### 9.1 Decision Boundary & Categorized Global Exception Handling
Expected business validation failures or auto-retried temporary glitches must never be logged as `ERROR`. They should be categorized in **GlobalExceptionHandler**:

1. **Business Exceptions (e.g., `BizException`, validation failure)**: Log as `WARN` at the global handler. **Do not print the stack trace**. Record only request path, error code, and message.
2. **System Exceptions (e.g., `NullPointerException`, `SQLException` or other unexpected runtime exceptions)**: Must log as `ERROR` at the global handler, **including the complete stack trace**.

#### ✅ Java Global Exception Handler Categorization Example
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Business Exception: Log as WARN, summary only (NO stack trace)
    @ExceptionHandler(BizException.class)
    public RestResult<?> handleBizException(BizException e, HttpServletRequest request) {
        log.warn("[GlobalException] Business exception: path={}, method={}, code={}, msg={}", 
            request.getRequestURI(), request.getMethod(), e.getCode(), e.getMessage());
        return RestResult.error(e.getCode(), e.getMessage());
    }

    // 2. System Exception: Log as ERROR, must output full stack trace e
    @ExceptionHandler(Exception.class)
    public RestResult<?> handleSystemException(Exception e, HttpServletRequest request) {
        log.error("[GlobalException] Unhandled system failure: path={}, method={}", 
            request.getRequestURI(), request.getMethod(), e); // last parameter is e to output full stack trace
        return RestResult.error(BizCodeEnum.SYSTEM_ERROR);
    }
}
```

---

### 9.2 The Three Elements of ERROR Logs (What, Why, Who)
The message payload of any `ERROR` log must contain three core elements:

1. **What happened**: Clear description of the failed business operation or system action (e.g., `"Failed to send billing SMS"`, not `"SMS failed"`).
2. **Why it failed**: Clear description of the technical cause or data state (e.g., `"HTTP response status was 503"`, not `"Error occurred"`).
3. **Who is affected**: Contextual identifiers to locate the impact (e.g., `userId`, `orderId`, `traceId`).

#### ❌ Insufficient ERROR Log Examples
```java
// Bad 1: No context, hard to know which user or order is affected
log.error("Failed to decrypt callback!", e);

// Bad 2: Using getMessage swallows stack trace, and message is unclear
log.error("Scheduled settlement task error: " + e.getMessage()); 
```

#### ✅ Compliant ERROR Log Examples
```java
// Good 1: Contains What(failed callback), Why(signature mismatch), Who(orderId/channelId) and stack trace e
log.error("[Callback] Payment callback signature verification failed: orderId={}, payChannelId={}, expectedSign={}, actualSign={}",
    orderId, channelId, expSign, actSign, e);

// Good 2: Go slog implementing the three elements
logger.Error("Scheduled settlement task interrupted",
    slog.String("taskName", "MonthlySettle"),
    slog.Int("processedCount", processed),
    slog.Any("error", err), // Why
)
```

---

### 9.3 "Who Handles, Who Logs" (Avoid Duplicate Logging)
To prevent the same exception from being printed at every layer of the call stack (which increases log size and generates duplicate alerts):
- **If the current layer catches an exception and rethrows it (directly or wrapped), it is STRICTLY FORBIDDEN to log it as `ERROR` at this layer.**
- **Only log it as `ERROR` at the final layer where the exception is swallowed and handled (no longer rethrown).**

#### ❌ Duplicate Logging Anti-pattern
```java
// Service layer catches, logs ERROR, and rethrows. Duplicate!
public void executePay(Order order) {
    try {
        paymentClient.pay(order);
    } catch (Exception e) {
        log.error("Payment client call failed: orderId={}", order.getId(), e); // ❌ Wrong: Do not log here
        throw new BizException("Payment failed", e);
    }
}
```

#### ✅ Correct Usage
```java
// Service layer wraps and throws without logging ERROR
public void executePay(Order order) {
    try {
        paymentClient.pay(order);
    } catch (Exception e) {
        throw new BizException("Payment failed", e); // Bubbles up to Controller to log
    }
}
```

---

### 9.4 Forbid Silent Catch & Swallowing Exceptions
**It is strictly forbidden to use empty catch blocks or use `System.out` / `e.printStackTrace()` to "handle" exceptions.** Doing so silent-fails the system, hiding potential risks.

#### ❌ Swallowing Exceptions Anti-patterns
```java
// Bad 1: Empty catch, completely silent
try {
    saveData();
} catch (Exception e) {
}

// Bad 2: printStackTrace outputs directly to stdout, disrupting parser indexers (e.g. ELK) and losing context
try {
    saveData();
} catch (Exception e) {
    e.printStackTrace();
}
```

#### ✅ Safe Exception Catching
```java
// Good: Log using logging framework or rethrow
try {
    saveData();
} catch (Exception e) {
    log.error("[DataService] Failed to save business data", e);
    // or throw new SystemException(e);
}
```

---

### 9.5 Async Guarding & Global Uncaught Exception Handling
Background threads (custom thread pools, CompletableFuture, scheduled tasks) bypass the default HTTP global exception handlers. If they throw an uncaught `RuntimeException`, the thread pool silent-swallows it, and the task fails silently.

1. **Top-level try-catch protection**: Every background entry point (scheduled task method body, MQ listener, Runnable/Callable task body) must be wrapped with a top-level `try { ... } catch (Throwable t) { log.error("...", t); }`.
2. **UncaughtExceptionHandler**: Configure an explicit `UncaughtExceptionHandler` for custom thread pools to catch uncaught thread deaths.

#### ❌ Thread Pool Silent-death Anti-pattern
```java
// Bad: If executeTask throws a RuntimeException, the thread dies silently with no logs
executor.submit(() -> {
    executeTask();
});
```

#### ✅ Secure Async Task Pattern
```java
// Good 1: Wrapped with try-catch (Throwable) at the entry point
executor.submit(() -> {
    try {
        executeTask();
    } catch (Throwable t) {
        log.error("[AsyncThread] Uncaught critical exception in async task", t);
    }
});

// Good 2: Custom ThreadFactory with UncaughtExceptionHandler
ThreadFactory customFactory = new ThreadFactoryBuilder()
    .setNameFormat("biz-pool-%d")
    .setUncaughtExceptionHandler((thread, throwable) -> {
        log.error("[FatalError] Thread pool thread died: thread={}", thread.getName(), throwable);
    })
    .build();
```

---

## Chapter 10: AI Checklist (For Code Review)

During Code Reviews of PRs involving logs, the AI must inspect the following checklist:

```
[ ] Is the log level chosen appropriate? (Refer to Chapter 1 & Section 9.1)
[ ] Does the log message text contain sufficient identifiers and conform to the Three Elements (What, Why, Who)? (Refer to Chapter 2 & Section 9.2)
[ ] Is there any string concatenation in log messages? (e.g., `"" + var` pattern)
[ ] Is String.format used to construct log messages (anti-pattern)?
[ ] Is e.getMessage() logged without passing the exception object e itself? (Refer to Section 9.2)
[ ] Are there empty catch blocks or printStackTrace() usages that swallow exceptions? (Refer to Section 9.4)
[ ] While rethrowing (throw), is duplicate logging of the exception avoided in the catch block? (Refer to Section 9.3)
[ ] Are scheduled tasks, MQ listeners, or async thread pools protected with top-level try-catch (Throwable)? (Refer to Section 9.5)
[ ] Are process-oriented INFO logs inside loops replaced with DEBUG logs?
[ ] Is there any unmasked PII (phone, email, password, token) in logs?
[ ] Do async threads propagate the MDC trace context correctly?
[ ] Is MDC.clear() executed in a finally block?
[ ] Are DEBUG logs disabled in production environments?
```
