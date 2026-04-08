import { createServer } from "node:http";
import { execSync } from "node:child_process";

const SECRET = process.env.HOOK_SECRET || "hazelgrouse-deploy-hook";
const PORT = process.env.PORT || 9876;

const server = createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/update-wildcard") {
    res.writeHead(404).end("Not found");
    return;
  }

  const token = req.headers["x-hook-secret"];
  if (token !== SECRET) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const out = execSync(
      `bash ${new URL("./update-prod-wildcard.sh", import.meta.url).pathname}`,
      { uid: 0 }
    ).toString();
    console.log("Hook executed:", out);
    res.writeHead(200).end("OK");
  } catch (err) {
    console.error("Hook failed:", err.message);
    res.writeHead(500).end("Error");
  }
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on :${PORT}`);
});
