import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

function body(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function apiPlugin(): Plugin {
  const attach = (server: ViteDevServer) => {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = req.url ?? "";
      if (!url.startsWith("/api/cast") || req.method !== "POST") return next();
      try {
        const data = await body(req);
        const mod = await server.ssrLoadModule("/src/lib/xuan/api.ts");
        const out = await mod.runCastReading(data);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(out));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
      }
    });
  };
  return { name: "xuan-api", configureServer: attach, configurePreviewServer: attach as never };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.XAI_API_KEY) process.env.XAI_API_KEY = env.XAI_API_KEY;
  return {
    plugins: [tailwindcss(), react(), apiPlugin()],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: { host: true, port: 5173 },
  };
});
