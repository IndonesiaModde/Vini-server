const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public (login.html, oauth-callback.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// SISTEMA DE SUPER LOG
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n--- [${timestamp}] ${req.method} ${req.path} ---`);
  if (Object.keys(req.query).length > 0) console.log("QUERY:", JSON.stringify(req.query));
  if (req.body && Object.keys(req.body).length > 0) console.log("BODY:", JSON.stringify(req.body));
  
  const oldJson = res.json;
  res.json = function(data) {
    console.log("RESPOSTA:", JSON.stringify(data));
    return oldJson.apply(res, arguments);
  };
  next();
});

const VERSION = "1.26.0";
const FILE_INFO = `gameassetbundles,mzZtylZ1fawV5N8D8XikRyF+5mY=,12060,0
main/gameentry,DZlCrLRuzwyuNzUZrh+p0QxJCcI=,2018,0
localization/loc,gWXz0dDNM8MJyFcAFhzbqWWqvrY=,632921,0
ingame/avatarmanager,Tjb+QEzOiGwy+DBpxlLrVBZRphA=,1915,0
config/resconf,ysnx0NubzKPaLVGszrP45y9WQH0=,34896,0
avatar/assetindexer,IbV74Hqrb07rdlrKYQx6JZIhZ5M=,74343,0
avatar/uma_dcs,BSJQtQt6qEeFdLv8gsrVtPDQubo=,14523,0`;

// UID fixo do jogador
const PLAYER_UID = "100067";

// Endpoints de Versão e Recursos
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => {
  if (req.path.includes('ver.php')) {
    const myUrl = "https://vini-server.onrender.com/live/";
    return res.send(`${VERSION},${myUrl},${myUrl},${myUrl}`);
  }
  res.send(VERSION);
});
app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => res.send(FILE_INFO));

// -----------------------------------------------------------------------
// CORREÇÃO 1: Endpoint /v2.5/:id — distingue App ID de User ID
// O SDK Android chama /v2.5/{APP_ID}?fields=supports_implicit_sdk_logging,...
// e espera receber a configuração do App, não o perfil do usuário.
// -----------------------------------------------------------------------
app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  const fields = req.query.fields || '';

  // Se o request pede campos de configuração do SDK, é uma chamada de App Config
  const isAppConfigRequest = fields.includes('supports_implicit_sdk_logging') ||
                             fields.includes('android_dialog_configs') ||
                             fields.includes('gdpv4_nux_enabled');

  // Se for 'me' ou o UID do jogador E não for pedido de config, retorna perfil
  if ((id === 'me' || id === PLAYER_UID) && !isAppConfigRequest) {
    console.log(`[FB] Retornando perfil do usuário para id=${id}`);
    return res.json({
      id: PLAYER_UID,
      name: "ViniPlayer",
      first_name: "Vini",
      last_name: "Player"
    });
  }

  // Caso contrário (App ID ou pedido de config): retorna configuração do App
  console.log(`[FB] Retornando config do App para id=${id}`);
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    gdpv4_nux_enabled: false,
    gdpv4_nux_content: "",
    android_dialog_configs: {
      oauth: {
        // URL do diálogo de login que o SDK vai abrir
        url: "https://vini-server.onrender.com/v2.5/dialog/oauth"
      }
    },
    android_sdk_error_categories: [
      { name: "login_recoverable", items: [{ code: 102, message: "Login recoverable" }] }
    ]
  });
});

app.post('/v2.5/:app_id/activities', (req, res) => {
  res.json({ success: true, app_events_config: { custom_events_default_sampling_probability: 1 } });
});

// -----------------------------------------------------------------------
// CORREÇÃO 2: /v2.5/dialog/oauth — redirecionar com ?query em vez de #fragment
// O SDK Android do Facebook lê o token via query string (?access_token=...)
// Fragmentos (#) são descartados pelo sistema operacional Android ao invocar
// o deep link fbconnect://success, causando o "erro de conexão".
// -----------------------------------------------------------------------
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  const uid = PLAYER_UID;

  // IMPORTANTE: usar ? (query string) e NÃO # (fragment)
  // O Android não repassa fragmentos ao app nativo via deep link
  const params = `access_token=${token}&expires_in=5184000&user_id=${uid}&base_domain=onrender.com&return_scopes=true`;
  const finalUrl = `fbconnect://success?${params}`;

  console.log(`[OAuth] Redirecionando para: ${finalUrl}`);
  res.redirect(302, finalUrl);
});

// -----------------------------------------------------------------------
// Handlers de login/token — aceita tokens vindos do fluxo OAuth
// -----------------------------------------------------------------------
const handleLoginSuccess = (req, res) => {
  const token = req.body.facebook_access_token || req.body.access_token || uuidv4();
  const uid = PLAYER_UID;
  const appId = req.body.client_id || "2036793259884297";
  const now = Date.now();
  
  const response = {
    access_token: token,
    token: token,
    key: token,
    user_id: uid,
    uid: uid,
    id: uid,
    application_id: appId,
    expires_in: 5184000,
    expires_at: now + 5184000000,
    last_refresh: now,
    session_key: token,
    token_type: "bearer",
    permissions: ["public_profile", "email"],
    declined_permissions: [],
    status: 200,
    code: 0,
    msg: "success"
  };

  if (req.path.includes('exchange')) {
    console.log(`[Exchange Success] UID: ${uid}`);
    return res.json({ ...response, data: response });
  }

  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/oauth/token/facebook/exchange'], handleLoginSuccess);

// Rota para recursos /live/* (CDN Redirection)
app.get('/live/*', (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath.length > 20) {
    const garenaCDN = `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`;
    return res.redirect(302, garenaCDN);
  }
  res.status(200).end();
});

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V23 (FB OAuth Fix) na porta ${PORT}`));
