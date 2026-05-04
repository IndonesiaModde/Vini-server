const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- DIÁLOGO DE LOGIN (V9 - RESPOSTA DIRETA E INJEÇÃO) ---
app.get('/v2.5/dialog/oauth', (req, res) => {
  const token = 'EAAG' + uuidv4().replace(/-/g, '').substring(0, 32);
  const uid = '1000001';
  
  console.log("Enviando Resposta Direta de Login...");

  // Se o jogo pedir JSON (comum em chamadas de API de login)
  if (req.headers.accept && req.headers.accept.includes('json')) {
      return res.json({ access_token: token, user_id: uid, expires_in: 5184000 });
  }

  // Se o jogo pedir HTML (WebView)
  // Colocamos o token no título, no corpo e no fragmento para não ter erro
  res.send(`
    <html>
    <head><title>Success access_token=${token}</title></head>
    <body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;">
        <div style="text-align:center;">
            <h2>Vini Server</h2>
            <p>Autenticado com Sucesso!</p>
            <!-- Texto puro para o SDK capturar via Regex -->
            <div style="display:none;">access_token=${token}&user_id=${uid}</div>
        </div>
        <script>
            const token = "${token}";
            const uid = "${uid}";
            
            // Tenta todas as formas de fechar e avisar o jogo
            window.location.hash = "access_token=" + token + "&user_id=" + uid;
            
            if (window.Android && window.Android.onFacebookLogin) {
                window.Android.onFacebookLogin(token, uid);
            }
            
            setTimeout(() => {
                window.location.href = "fbconnect://success?access_token=" + token + "&user_id=" + uid;
                setTimeout(() => { window.close(); }, 500);
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

// --- ROTAS DE SUPORTE ---
app.get('/v2.5/me', (req, res) => {
  res.json({ id: "1000001", name: "ViniPlayer" });
});

app.get('/v2.5/:app_id', (req, res) => {
  if (req.params.app_id === 'me') return;
  res.json({ id: req.params.app_id, name: "Free Fire Vini", permissions: ["public_profile"] });
});

// Bypass de Versão
app.get(['/live/ver.php', '/ver.php', '/live/versioninfo', '/versioninfo'], (req, res) => res.send('1.17.1'));
app.get(['/sbt/fileinfo', '/fileinfo'], (req, res) => res.send(''));

// Resposta de Login Mestre (API)
const handleLoginSuccess = (req, res) => {
  const s = uuidv4().replace(/-/g, '');
  const response = {
    error: 0, msg: "success", code: 0, status: 200,
    session_key: "s_" + s.substring(0, 16),
    access_token: "t_" + s.substring(0, 16),
    token: "t_" + s.substring(0, 16),
    refresh_token: "r_" + s.substring(0, 8),
    open_id: "1000001", account_id: "1000001", uid: "1000001",
    username: "ViniPlayer", nickname: "ViniPlayer",
    is_new: 0, region: "BR", login_type: 1, expire_time: 5184000
  };
  res.json({ code: 0, msg: "success", data: response, ...response });
};

app.all(['/conn/*', '/sso/*', '/auth/*', '/api/v1/auth/*', '/app/info/get', '/info/app/info/get'], handleLoginSuccess);

app.get('/health', (req, res) => res.json({ status: 'ok', version: '4.1.0-fixed-v9' }));

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => console.log(`✅ Servidor Vini V9 (Direct Injection) na porta ${PORT}`));
