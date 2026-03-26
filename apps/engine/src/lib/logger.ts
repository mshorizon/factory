import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
  base: { service: "factory-engine" },
});

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
