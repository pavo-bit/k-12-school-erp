import Fastify from "fastify";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok", service: "worker" }));
app.get("/readyz", async () => ({ status: "ready", service: "worker" }));

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`worker listening on ${host}:${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
