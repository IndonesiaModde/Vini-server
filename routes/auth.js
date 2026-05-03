const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// Registro local
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password_hash, level, exp, diamonds, gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, email || null, passwordHash, config.game.defaultLevel, config.game.defaultExp, config.game.defaultDiamonds, config.game.defaultGold],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username já existe' });
        }
        return res.status(500).json({ error: 'Erro ao registrar' });
      }

      const userId = this.lastID;
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);

      // Salvar refresh token
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.run(
        'INSERT INTO auth_tokens (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, token, refreshToken, expiresAt]
      );

      res.status(201).json({
        success: true,
        user_id: userId,
        username: username,
        token: token,
        refresh_token: refreshToken,
        expires_in: '7d'
      });
    }
  );
});

// Login local
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.run(
      'INSERT INTO auth_tokens (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, token, refreshToken, expiresAt]
    );

    res.json({
      success: true,
      user_id: user.id,
      username: user.username,
      level: user.level,
      token: token,
      refresh_token: refreshToken,
      expires_in: '7d'
    });
  });
});

// Login Guest
router.post('/guest', (req, res) => {
  const guestUsername = `guest_${uuidv4().substring(0, 8)}`;

  db.run(
    'INSERT INTO users (username, level, exp, diamonds, gold) VALUES (?, ?, ?, ?, ?)',
    [guestUsername, config.game.defaultLevel, config.game.defaultExp, config.game.defaultDiamonds, config.game.defaultGold],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar conta guest' });
      }

      const userId = this.lastID;
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.run(
        'INSERT INTO auth_tokens (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, token, refreshToken, expiresAt]
      );

      res.status(201).json({
        success: true,
        user_id: userId,
        username: guestUsername,
        token: token,
        refresh_token: refreshToken,
        expires_in: '7d'
      });
    }
  );
});

// Login Facebook (placeholder)
router.post('/facebook', (req, res) => {
  const { facebook_id, name, email } = req.body;

  if (!facebook_id) {
    return res.status(400).json({ error: 'Facebook ID é obrigatório' });
  }

  db.get('SELECT * FROM users WHERE facebook_id = ?', [facebook_id], (err, user) => {
    if (user) {
      // Usuário já existe
      const token = generateToken(user.id);
      return res.json({
        success: true,
        user_id: user.id,
        username: user.username,
        token: token,
        is_new: false
      });
    }

    // Criar novo usuário
    const username = `fb_${facebook_id.substring(0, 8)}`;
    db.run(
      'INSERT INTO users (username, email, facebook_id, level, exp, diamonds, gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email || null, facebook_id, config.game.defaultLevel, config.game.defaultExp, config.game.defaultDiamonds, config.game.defaultGold],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao criar usuário Facebook' });
        }

        const userId = this.lastID;
        const token = generateToken(userId);

        res.status(201).json({
          success: true,
          user_id: userId,
          username: username,
          token: token,
          is_new: true
        });
      }
    );
  });
});

// Login VK (placeholder)
router.post('/vk', (req, res) => {
  const { vk_id, name, email } = req.body;

  if (!vk_id) {
    return res.status(400).json({ error: 'VK ID é obrigatório' });
  }

  db.get('SELECT * FROM users WHERE vk_id = ?', [vk_id], (err, user) => {
    if (user) {
      const token = generateToken(user.id);
      return res.json({
        success: true,
        user_id: user.id,
        username: user.username,
        token: token,
        is_new: false
      });
    }

    const username = `vk_${vk_id.substring(0, 8)}`;
    db.run(
      'INSERT INTO users (username, email, vk_id, level, exp, diamonds, gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email || null, vk_id, config.game.defaultLevel, config.game.defaultExp, config.game.defaultDiamonds, config.game.defaultGold],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao criar usuário VK' });
        }

        const userId = this.lastID;
        const token = generateToken(userId);

        res.status(201).json({
          success: true,
          user_id: userId,
          username: username,
          token: token,
          is_new: true
        });
      }
    );
  });
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.run('DELETE FROM auth_tokens WHERE token = ?', [token]);
  }
  res.json({ success: true });
});

module.exports = router;
