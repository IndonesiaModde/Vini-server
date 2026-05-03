const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const config = require('./config/config');
const db = require('./database/database');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const shopRoutes = require('./routes/shop');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'MrViniVx Game Server is running!',
    version: '4.1.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de versão (compatível com APK)
app.get('/version/check', (req, res) => {
  res.json({
    version: '4.1.0',
    updateAvailable: false,
    downloadUrl: '',
    status: 'ok'
  });
});

// Rota de conexão (compatível com APK)
app.get('/connect/info', (req, res) => {
  res.json({
    server_name: 'MrViniVx Server',
    server_version: '4.1.0',
    status: 'online',
    max_players: config.game.maxPlayers,
    current_players: Math.floor(Math.random() * config.game.maxPlayers),
    timestamp: new Date().toISOString()
  });
});

// Rotas de API
const apiPrefix = config.api.prefix;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/game`, gameRoutes);
app.use(`${apiPrefix}/shop`, shopRoutes);
app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);

// Página de login (compatível com APK)
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota de admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ✅ ROTA CORRIGIDA: OAuth Facebook retorna HTML com redirect via meta tag
app.get('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'mock_facebook_token_' + Date.now();
  const user_id = Math.floor(Math.random() * 1000000);
  
  // Retornar HTML que tenta fazer redirect via meta tag
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="1;url=fbconnect://success?access_token=${access_token}&user_id=${user_id}&expires_in=5184000">
        <title>Login</title>
        <style>
            body { 
                background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
                color: #fff; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                font-family: Arial; 
                margin: 0;
            }
            .container { 
                text-align: center; 
                padding: 40px;
            }
            .spinner { 
                border: 4px solid rgba(0,217,255,0.2); 
                border-top: 4px solid #00d9ff; 
                border-radius: 50%; 
                width: 50px; 
                height: 50px; 
                animation: spin 1s linear infinite; 
                margin: 0 auto 20px; 
            }
            @keyframes spin { 
                0% { transform: rotate(0deg); } 
                100% { transform: rotate(360deg); } 
            }
            p {
                color: #aaa;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="spinner"></div>
            <p>Finalizando login...</p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Se nada acontecer, feche esta aba.</p>
        </div>
        <script>
            // Tentar fazer redirect via protocolo customizado
            setTimeout(function() {
                window.location.href = 'fbconnect://success?access_token=${access_token}&user_id=${user_id}&expires_in=5184000';
            }, 500);
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.post('/v2.5/dialog/oauth', (req, res) => {
  const access_token = 'mock_facebook_token_' + Date.now();
  const user_id = Math.floor(Math.random() * 1000000);
  
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="1;url=fbconnect://success?access_token=${access_token}&user_id=${user_id}&expires_in=5184000">
        <title>Login</title>
        <style>
            body { 
                background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
                color: #fff; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                font-family: Arial; 
                margin: 0;
            }
            .container { 
                text-align: center; 
                padding: 40px;
            }
            .spinner { 
                border: 4px solid rgba(0,217,255,0.2); 
                border-top: 4px solid #00d9ff; 
                border-radius: 50%; 
                width: 50px; 
                height: 50px; 
                animation: spin 1s linear infinite; 
                margin: 0 auto 20px; 
            }
            @keyframes spin { 
                0% { transform: rotate(0deg); } 
                100% { transform: rotate(360deg); } 
            }
            p {
                color: #aaa;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="spinner"></div>
            <p>Finalizando login...</p>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">Se nada acontecer, feche esta aba.</p>
        </div>
        <script>
            setTimeout(function() {
                window.location.href = 'fbconnect://success?access_token=${access_token}&user_id=${user_id}&expires_in=5184000';
            }, 500);
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Rota de autenticação VK
app.get('/vk/oauth', (req, res) => {
  res.json({
    access_token: 'mock_vk_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de autenticação Line
app.get('/line/oauth', (req, res) => {
  res.json({
    access_token: 'mock_line_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de autenticação Garena
app.get('/garena/oauth', (req, res) => {
  res.json({
    access_token: 'mock_garena_token_' + Date.now(),
    user_id: Math.floor(Math.random() * 1000000)
  });
});

// Rota de info do app Facebook
app.get('/v2.5/:app_id', (req, res) => {
  res.json({
    id: req.params.app_id,
    name: 'MrViniVx Game',
    supports_implicit_sdk_logging: true,
    gdpv4_nux_content: '',
    gdpv4_nux_enabled: false,
    android_dialog_configs: [],
    android_sdk_error_categories: []
  });
});

// Rota de info da aplicacao
app.get('/app/info/get', (req, res) => {
  res.json({
    app_id: req.query.app_id || '100067',
    client_type: req.query.client_type || '4352',
    client_version: req.query.client_version || '2018120316',
    status: 'ok',
    version: '4.1.0',
    server_time: Date.now()
  });
});

// Rota de atividades do Facebook
app.post('/v2.5/:app_id/activities', (req, res) => {
  res.json({
    success: true,
    app_id: req.params.app_id,
    timestamp: Date.now()
  });
});

app.get('/v2.5/:app_id/activities', (req, res) => {
  res.json({
    success: true,
    app_id: req.params.app_id,
    activities: []
  });
});

// Rota de autenticacao com token Facebook
app.post('/api/v1/auth/facebook', (req, res) => {
  const { access_token, user_id } = req.body;
  
  if (!access_token || !user_id) {
    return res.status(400).json({
      error: 'access_token e user_id sao obrigatorios'
    });
  }
  
  const username = 'fb_user_' + user_id;
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: user_id, username: username },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
  
  res.json({
    success: true,
    token: token,
    user: {
      id: user_id,
      username: username,
      email: username + '@facebook.local'
    },
    redirect: '/dashboard'
  });
});

// Rota de dashboard
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   MRVVINIVX GAME SERVER v${config.game.maxPlayers === 100 ? '4.1.0' : '4.1.0'}              ║
╚════════════════════════════════════════╝

✅ Servidor rodando na porta ${PORT}
📍 URL: http://localhost:${PORT}
🌐 Painel: http://localhost:${PORT}/panel
🔐 Admin: http://localhost:${PORT}/admin
📡 API: http://localhost:${PORT}${apiPrefix}

Endpoints disponíveis:
  POST   ${apiPrefix}/auth/register
  POST   ${apiPrefix}/auth/login
  POST   ${apiPrefix}/auth/guest
  POST   ${apiPrefix}/auth/facebook
  POST   ${apiPrefix}/auth/vk
  POST   ${apiPrefix}/auth/logout
  GET    ${apiPrefix}/user/profile
  GET    ${apiPrefix}/user/inventory
  GET    ${apiPrefix}/user/friends
  POST   ${apiPrefix}/game/start
  POST   ${apiPrefix}/game/end
  GET    ${apiPrefix}/game/events
  GET    ${apiPrefix}/shop/items
  POST   ${apiPrefix}/shop/buy
  POST   ${apiPrefix}/shop/sell
  GET    ${apiPrefix}/leaderboard/kills
  GET    ${apiPrefix}/leaderboard/wins
  GET    ${apiPrefix}/leaderboard/level

Ambiente: ${config.nodeEnv}
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
