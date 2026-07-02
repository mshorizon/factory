import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// In dev we prefer pretty logs, but the pino-pretty transport resolves its
// target in a worker thread — under some setups (pnpm hoisting + Vite SSR) that
// resolution fails and pino() throws synchronously, which would otherwise take
// down ALL middleware. Degrade gracefully to plain JSON logging instead.
function createLogger() {
  const base = { service: "factory-engine" };
  if (isDev) {
    try {
      return pino({
        level: "debug",
        transport: { target: "pino-pretty", options: { colorize: true } },
        base,
      });
    } catch {
      // pino-pretty not resolvable here — fall through to plain logging
    }
  }
  return pino({ level: isDev ? "debug" : "info", base });
}

const logger = createLogger();

export default logger;

export function createRequestLogger(
  request: Request,
  businessId?: string,
) {
  const url = new URL(request.url);
  return logger.child({
    requestId: crypto.randomUUID(),
    businessId,
    method: request.method,
    path: url.pathname,
  });
}
