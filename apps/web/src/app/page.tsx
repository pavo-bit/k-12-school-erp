export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>School ERP</h1>
      <p>Multi-tenant K-12 school ERP for Indian day schools.</p>
      <p>
        Health: <a href="/healthz">/healthz</a> | <a href="/readyz">/readyz</a>
      </p>
    </main>
  );
}
