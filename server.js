const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');
const db = require('./database/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- ROTAS DE BYPASS DE VERSÃO (CRÍTICO PARA O APK) ---

app.get(['/live/ver.php', '/ver.php'], (req, res) => {
  // Retorna a versão que o jogo espera para passar da tela de carregamento
  res.send('1.17.1');
});

app.get(['/live/versioninfo', '/versioninfo'], (req, res) => {
  res.send('1.17.1');
});

app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => {
  // Retorna vazio para não exigir download de pacotes de expansão adicionais
  res.send('');
});

// --- ROTAS DE LOGIN E CONFIGURAÇÃO (COMPATIBILIDADE MSDK) ---

app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({
    status: 200,
    message: "success",
    data: {
      is_review: false,
      update_url: "",
      latest_version: "1.17.1"
    }
  });
});

// Simulação de Login Facebook/Garena para o MSDK
app.all(['/conn/*', '/sso/*', '/auth/facebook'], (req, res) => {
  console.log("Login attempt detected:", req.path);
  
  // Resposta padrão de sucesso que o jogo espera para liberar o acesso
  res.json({
    error: 0,
    msg: "success",
    session_key: "vini_session_" + uuidv4().substring(0, 8),
    access_token: "vini_token_" + uuidv4().substring(0, 8),
    account_id: "1000001",
    username: "ViniPlayer",
    is_new: false
  });
});

// --- ROTAS ORIGINAIS DO REPOSITÓRIO (MANTIDAS E INTEGRADAS) ---

const apiPrefix = config.api.prefix;

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const shopRoutes = require('./routes/shop');
const leaderboardRoutes = require('./routes/leaderboard');

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/game`, gameRoutes);
app.use(`${apiPrefix}/shop`, shopRoutes);
app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '4.1.0-fixed' });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Iniciar servidor
const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   MRVVINIVX GAME SERVER v4.1.0 FIXED   ║
╚════════════════════════════════════════╝
✅ Servidor rodando na porta ${PORT}
🌐 URL: https://vini-server.onrender.com
📡 Bypass de Versão Ativo: /live/ver.php
🔐 Fluxo de Login Corrigido: /conn/
╚════════════════════════════════════════╝
  `);
});
