import Fastify from "fastify";

const port = Number(process.env.PORT ?? 3002);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok", service: "pdf-worker" }));
app.get("/readyz", async () => ({ status: "ready", service: "pdf-worker" }));

app.post("/render", async (request, reply) => {
  // Placeholder for Chromium rendering. Implemented in Milestone 6.
  return reply.code(501).send({ error: "not_implemented" });
});

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`pdf-worker listening on ${host}:${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
