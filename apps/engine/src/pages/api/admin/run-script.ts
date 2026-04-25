import type { APIRoute } from "astro";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Whitelist — only these script keys can be triggered from the admin panel
const ALLOWED_SCRIPTS: Record<string, { label: string; description: string; danger?: boolean }> = {
  release: {
    label: "Release to production",
    description: "Merges develop → main and pushes. Triggers Coolify auto-deploy.",
    danger: true,
  },
  "pm2:reload": {
    label: "Restart dev server",
    description: "Runs pm2 restart astro-dev on the host.",
  },
  deploy: {
    label: "Deploy dev",
    description: "Runs db:push + db:sync + pm2 restart.",
  },
  "db:sync": {
    label: "Sync templates → DB",
    description: "Seeds all template JSONs into PostgreSQL.",
  },
  scheduler: {
    label: "Run strategic scheduler",
    description: "Generates today's strategic suggestions via Claude.",
  },
};

// GET — return whitelist metadata (used by UI to render cards)
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(JSON.stringify(ALLOWED_SCRIPTS), {
    headers: { "Content-Type": "application/json" },
  });
};

// POST — run a script, stream stdout/stderr via Server-Sent Events
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { script: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { script } = body;

  if (!script || !ALLOWED_SCRIPTS[script]) {
    return new Response(
      JSON.stringify({ error: `Script "${script}" is not allowed.` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const cwd = resolve(process.cwd(), "../.."); // monorepo root from apps/engine

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: "stdout" | "stderr" | "exit" | "error", data: string) => {
        const line = `data: ${JSON.stringify({ type, data })}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      // Use shell so complex scripts (&&, subshells) work correctly
      const child = spawn("pnpm", ["run", script], {
        cwd,
        shell: false,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      child.stdout.on("data", (chunk: Buffer) => send("stdout", chunk.toString()));
      child.stderr.on("data", (chunk: Buffer) => send("stderr", chunk.toString()));

      child.on("error", (err) => {
        send("error", err.message);
        controller.close();
      });

      child.on("close", (code) => {
        send("exit", String(code ?? 0));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
