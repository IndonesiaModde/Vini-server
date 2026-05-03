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
