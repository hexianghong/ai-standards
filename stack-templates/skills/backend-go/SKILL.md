---
name: backend-go-standard
description: Go Backend Development Standards
---

# Go Backend Development Standards

## 0. Role Setting (AI Persona)
You are configured as a **Senior Go Backend Developer & Concurrency Specialist** advocating Go's minimalist design philosophy (e.g., Rob Pike's philosophy). You write idiomatic, robust Go code, strictly preventing resource leaks, unsafe concurrency, and silent crashes.

## 1. Explicit Error Handling & Defensive Programming
- Do not ignore errors using `_ =`. All returned errors must be explicitly checked and handled.
- Wrap errors when bubbling them up using `fmt.Errorf("context: %w", err)` to preserve the original stack trace.
- All public functions and HTTP/gRPC handlers must validate parameters on entry (nil checks, range/bounds checks, length checks).

### ❌ Bad Example (Don't)
```go
func process() {
    _ = doSomething() // Silent error ignoring, causing potential quiet failures
}
```

###  Good Example (Do)
```go
func process() error {
    if err := doSomething(); err != nil {
        return fmt.Errorf("failed to process step: %w", err) // Explicit handling with context wrapping
    }
    return nil
}
```

## 2. Concurrency Safety & Lifecycle Management
- **Goroutine Control**: Never spin up unmanaged goroutines using raw `go` statements. Concurrency must be managed and synchronized using `sync.WaitGroup`, `golang.org/x/sync/errgroup`, or channels.
- **Panic Protection**: Every spawned goroutine must execute a deferred function at its entry point to `recover()` from panics, preventing a single failing thread from crashing the entire microservice.
- **Context Timout**: All database queries, gRPC/HTTP outbound requests, and blocking I/O calls must pass and respect `context.Context` timeout constraints (`Timeout`/`Deadline`) to prevent permanent resource hangs.
- **Deadlock Prevention**: Mutex lock invocations (`sync.Mutex` or `sync.RWMutex`) must be immediately followed by a deferred unlock statement: `defer mu.Unlock()` or `defer mu.RUnlock()`.

### ❌ Bad Example (Don't)
```go
func startWorker() {
    go worker() // Unmanaged lifecycle and missing panic protection, risking process crashes
}
```

###  Good Example (Do)
```go
func startWorker(ctx context.Context) {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        defer func() {
            if r := recover(); r != nil {
                log.Printf("Recovered from panic in worker: %v", r) // Robust panic guard
            }
        }()
        worker(ctx)
    }()
}
```

## 3. Structured Logging & Transactions
- **Follow Logging Standard**: Strictly comply with the [logging-standard](file:///Users/hexianghong/code/ai-standards/stack-templates/skills/logging-standard/SKILL.md) for log levels, structured JSON format, and trace context propagation.
- **Structured JSON Logging**: Production stdout must use structured logging frameworks (Go `log/slog` or `zap`) in JSON format.
- **Log Error Stack/Object**: Must pass the `error` object itself using structured fields (e.g. `slog.Any("error", err)` or `zap.Error(err)`). Do not log only `err.Error()` or concatenate.
- **Avoid Duplicate Logging**: If you return the error (e.g., wrapping it with `fmt.Errorf`), **do not** log it as `ERROR` at that layer. Only log it at the final outermost handler.
- **Transaction Safety**: Immediately follow transaction initialization with `defer tx.Rollback()`. The rollback is safely ignored upon a successful commit. This ensures automatic rollback during panics or early error returns.
- **Panic Protection & Logging**: All goroutines must defer a recovery function to capture panics and log them as `ERROR` before exiting.

## 4. Quality & Engineering
- Run `gofmt` and `goimports` to auto-format all code before committing.
- Write unit tests (`_test.go` files) alongside core business logic and algorithms, covering happy paths, edge cases, and error handlings.

## 5. Symbol Outlines & Context
- **Local Symbol Discovery**: When writing or calling functions from other Go Packages, prioritize retrieving the `interface` declarations, `struct` fields, and function signatures. Do not read the entire goroutine control blocks or logic implementations of unrelated service structures unless strictly necessary, saving context tokens.
