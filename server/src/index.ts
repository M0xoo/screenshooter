import fastifyStatic from "@fastify/static";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { captureRequestSchema } from "@screenshoter/shared";
import { captureScreenshot } from "./capture.js";
import { assertUrlSafeForCapture } from "./ssrf.js";

const PORT = Number(process.env.PORT) || 3001;

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, "../../client/dist");

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.post("/api/capture", async (request, reply) => {
  const parsed = captureRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;

  try {
    await assertUrlSafeForCapture(body.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Blocked URL";
    return reply.status(400).send({ error: msg });
  }

  try {
    const png = await captureScreenshot(body);
    reply.header("Content-Type", "image/png");
    reply.header("Cache-Control", "no-store");
    return reply.send(png);
  } catch (e) {
    request.log.error(e);
    const msg = e instanceof Error ? e.message : "Capture failed";
    return reply.status(502).send({ error: msg });
  }
});

app.get("/api/health", async () => ({ ok: true }));

if (existsSync(clientDist)) {
  await app.register(fastifyStatic, {
    root: clientDist,
    prefix: "/",
    decorateReply: false,
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return reply.status(404).send({ error: "Not Found" });
    }
    if (request.url.startsWith("/api")) {
      return reply.status(404).send({ error: "Not Found" });
    }
    const indexPath = join(clientDist, "index.html");
    return reply.type("text/html").send(readFileSync(indexPath, "utf8"));
  });
}

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
