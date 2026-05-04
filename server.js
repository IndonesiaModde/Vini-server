import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors()); // Permite conexões de qualquer origem
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logs para depuração no Render
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // 1. OAuth Dialog - Correção do Redirecionamento
  app.get("/v2.5/dialog/oauth", (req, res) => {
    const { redirect_uri, state } = req.query;
    const mockToken = "EAAW2ZBZA8ZBZA8BAO7pZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA8ZBZA";
    
    if (redirect_uri && typeof redirect_uri === 'string') {
      if (redirect_uri.startsWith("fbconnect://success")) {
        const fragment = `access_token=${mockToken}&expires_in=3600${state ? `&state=${state}` : ""}`;
        return res.redirect(`${redirect_uri}#${fragment}`);
      }
    }
    res.json({ success: true, message: "Mock OAuth active" });
  });

  // 2. Configurações do App (Importante para o SDK não dar erro de conexão)
  app.get("/v2.5/:appId", (req, res, next) => {
    const { appId } = req.params;
    if (appId === "me") return next(); // Passa para o endpoint de usuário

    res.json({
      id: appId,
      name: "Vini Server",
      supports_implicit_sdk_logging: true,
      app_events_feature_bitmask: 63
    });
  });

  // 3. Log de Atividades
  app.post("/v2.5/:appId/activities", (req, res) => {
    res.json({ success: true });
  });

  // 4. Dados do Usuário (O que o jogo mostra após logar)
  app.get("/v2.5/me", (req, res) => {
    res.json({
      id: "100000000000001",
      name: "Vini Modder",
      email: "vini@example.com",
      picture: { data: { url: "https://placehold.co/100x100?text=Vini" } }
    });
  });

  // Configuração para servir o frontend (Vite)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor ativo na porta ${PORT}`);
  });
}

startServer().catch(console.error);
