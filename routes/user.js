const express = require('express');
const db = require('../database/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Obter perfil do usuário
router.get('/profile', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Obter estatísticas
    db.get('SELECT * FROM game_stats WHERE user_id = ?', [userId], (err, stats) => {
      res.json({
        user_id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        exp: user.exp,
        diamonds: user.diamonds,
        gold: user.gold,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        stats: stats || {
          kills: 0,
          deaths: 0,
          wins: 0,
          games_played: 0
        }
      });
    });
  });
});

// Atualizar perfil
router.put('/profile', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { avatar_url } = req.body;

  db.run(
    'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [avatar_url || null, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
      }

      res.json({ success: true, message: 'Perfil atualizado' });
    }
  );
});

// Obter inventário
router.get('/inventory', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT i.*, s.name, s.description, s.type, s.rarity 
     FROM inventory i 
     LEFT JOIN shop_items s ON i.item_id = s.id 
     WHERE i.user_id = ?`,
    [userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar inventário' });
      }

      res.json({
        user_id: userId,
        items: items || []
      });
    }
  );
});

// Obter amigos
router.get('/friends', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT u.id, u.username, u.level, u.avatar_url, f.status 
     FROM friends f 
     JOIN users u ON f.friend_id = u.id 
     WHERE f.user_id = ? AND f.status = 'accepted'`,
    [userId],
    (err, friends) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar amigos' });
      }

      res.json({
        user_id: userId,
        friends: friends || []
      });
    }
  );
});

// Adicionar amigo
router.post('/friends/add', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { friend_id } = req.body;

  if (!friend_id) {
    return res.status(400).json({ error: 'friend_id é obrigatório' });
  }

  db.run(
    'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
    [userId, friend_id, 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao adicionar amigo' });
      }

      res.status(201).json({ success: true, message: 'Solicitação de amizade enviada' });
    }
  );
});

// Aceitar amigo
router.post('/friends/accept', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { friend_id } = req.body;

  db.run(
    'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
    ['accepted', friend_id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao aceitar amigo' });
      }

      res.json({ success: true, message: 'Amizade aceita' });
    }
  );
});

// Obter clã do usuário
router.get('/clan', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT c.* FROM clans c 
     JOIN clan_members cm ON c.id = cm.clan_id 
     WHERE cm.user_id = ?`,
    [userId],
    (err, clan) => {
      if (err || !clan) {
        return res.json({ clan: null });
      }

      res.json({ clan });
    }
  );
});

module.exports = router;
