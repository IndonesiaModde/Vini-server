const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// LOGS
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
const PLAYER_UID = "100067"; // Apenas números como no original
const DOMAIN = "https://vini-server.onrender.com';
const BASE_URL = `https://${DOMAIN}`;

// CONFIGURAÇÃO DO GAME SERVER (TCP)
const GAME_SERVER_IP = "192.168.0.193";
const GAME_SERVER_PORT = 10001;

// Endpoints de Versão e Recursos
app.all(['/app/info/get', '/info/app/info/get'], (req, res) => {
  res.json({ status: 200, message: "success", data: { is_review: false, update_url: "", latest_version: VERSION, force_update: false } });
});

app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo', '/android/versioninfo'], (req, res) => {
  if (req.path.includes('ver.php')) {
    const myUrl = `${BASE_URL}/live/`;
    return res.send(`${VERSION},${myUrl},${myUrl},${myUrl}`);
  }
  res.send(VERSION);
});

app.get(['/sbt/fileinfo', '/fileinfo', '/live/fileinfo', '/android/fileinfo'], (req, res) => {
  const FILE_INFO = `gameassetbundles,mzZtylZ1fawV5N8D8XikRyF+5mY=,12060,0
main/gameentry,DZlCrLRuzwyuNzUZrh+p0QxJCcI=,2018,0
localization/loc,gWXz0dDNM8MJyFcAFhzbqWWqvrY=,632921,0
ingame/avatarmanager,Tjb+QEzOiGwy+DBpxlLrVBZRphA=,1915,0
config/resconf,ysnx0NubzKPaLVGszrP45y9WQH0=,34896,0
avatar/assetindexer,IbV74Hqrb07rdlrKYQx6JZIhZ5M=,74343,0
avatar/uma_dcs,BSJQtQt6qEeFdLv8gsrVtPDQubo=,14523,0`;
  res.send(FILE_INFO);
});

// CONFIGURAÇÃO DE REDE (NETWORK CONFIG)
app.all(['/network/config', '/api/v1/network/config', '/v1/network/config', '/api/v2/network/config', '/v2/network/config'], (req, res) => {
    res.json({
        status: 200, code: 0, msg: "success",
        data: {
            lobby_server: GAME_SERVER_IP,
            lobby_port: GAME_SERVER_PORT,
            use_ssl: true,
            gate_server: GAME_SERVER_IP,
            gate_port: GAME_SERVER_PORT,
            cdn_url: `${BASE_URL}/live/`,
            update_url: `${BASE_URL}/live/`,
            file_server: DOMAIN,
            log_server: DOMAIN,
            api_server: DOMAIN,
            pay_server: DOMAIN,
            voice_server: DOMAIN,
            chat_server: DOMAIN,
            friend_server: DOMAIN,
            client_config: {
                show_loading: true,
                skip_tutorial: true,
                enable_log: true,
                heartbeat_interval: 30,
                reconnect_interval: 5,
                max_reconnect_times: 3,
                anti_cheat: false,
                force_update: false,
                debug_mode: true
            },
            servers: [
                { name: "Vini Server", ip: GAME_SERVER_IP, port: GAME_SERVER_PORT, ssl: true, status: 1, load: 0, region: "BR" }
            ],
            regions: [
                { id: "BR", name: "Brasil", domain: GAME_SERVER_IP, port: GAME_SERVER_PORT, ssl: true }
            ],
            emergency_config: { disable_shop: false, disable_lobby: false }
        }
    });
});

// Facebook OAuth
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = uuidv4();
  const redirectUrl = `fbconnect://success?access_token=${token}&user_id=${PLAYER_UID}&expires_in=5184000&base_domain=onrender.com`;
  res.redirect(302, redirectUrl);
});

app.all('/v2.5/:id', (req, res) => {
  const id = req.params.id;
  if (id === 'me' || id === PLAYER_UID) {
    return res.json({ id: PLAYER_UID, name: "ViniPlayer", first_name: "Vini", last_name: "Player" });
  }
  res.json({
    id: id,
    name: "Free Fire Vini",
    supports_implicit_sdk_logging: true,
    android_dialog_configs: { oauth: { url: `${BASE_URL}/v2.5/dialog/oauth` } }
  });
});

// Auth & SSO - CORRIGIDO PARA APENAS NÚMEROS
app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/oauth/token/facebook/exchange'], (req, res) => {
  const token = uuidv4();
  res.json({
    status: 200, code: 0, msg: "success",
    data: {
        access_token: token,
        openId: PLAYER_UID, // Removido o prefixo vini_
        user_id: PLAYER_UID,
        uid: PLAYER_UID,
        nickname: "ViniPlayer",
        region: "BR",
        level: 70,
        diamonds: 999999,
        gold: 999999
    }
  });
});

// Recursos /live/*
app.get('/live/*', (req, res) => {
  const resourcePath = req.params[0];
  if (resourcePath && resourcePath.length > 20) {
    return res.redirect(302, `https://freefiremobile-a.akamaihd.net/live/${resourcePath}`);
  }
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ SERVIDOR VINI V36 (UID FIX) NA PORTA ${PORT}`));
