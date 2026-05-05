// Proxy local: recibe peticiones en el puerto 80 y las reenvía a Railway.
// Necesario porque la configuración remota de Cloudflare apunta a localhost:80.
// Arrancar con: node proxy-local.js
// Requiere permisos de administrador para escuchar en el puerto 80.

const http = require("http");
const https = require("https");

const TARGET_HOST = "nuevavida-production.up.railway.app";
const PORT = 80;

const server = http.createServer((req, clientRes) => {
  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // Pasar cabeceras de respuesta al cliente
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502);
      clientRes.end("Bad Gateway");
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Proxy escuchando en :${PORT} → https://${TARGET_HOST}`);
});

server.on("error", (err) => {
  if (err.code === "EACCES") {
    console.error(
      `\n❌ Puerto ${PORT} requiere permisos de administrador.\n` +
        `   Abre una terminal como Administrador y ejecuta:\n` +
        `   node proxy-local.js\n`
    );
  } else {
    console.error("Server error:", err.message);
  }
  process.exit(1);
});
