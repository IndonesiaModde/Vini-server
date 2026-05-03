const express = require('express');
const db = require('../database/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Obter itens da loja
router.get('/items', (req, res) => {
  const { type, rarity } = req.query;

  let query = 'SELECT * FROM shop_items WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (rarity) {
    query += ' AND rarity = ?';
    params.push(rarity);
  }

  db.all(query, params, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar itens' });
    }

    res.json({
      items: items || []
    });
  });
});

// Obter item específico
router.get('/items/:itemId', (req, res) => {
  const itemId = req.params.itemId;

  db.get('SELECT * FROM shop_items WHERE id = ?', [itemId], (err, item) => {
    if (err || !item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json(item);
  });
});

// Comprar item
router.post('/buy', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { item_id, quantity } = req.body;

  if (!item_id || !quantity) {
    return res.status(400).json({ error: 'item_id e quantity são obrigatórios' });
  }

  // Obter item
  db.get('SELECT * FROM shop_items WHERE id = ?', [item_id], (err, item) => {
    if (err || !item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const totalPrice = item.price * quantity;

    // Obter usuário
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se tem recursos suficientes
      const resourceField = item.currency === 'diamonds' ? 'diamonds' : 'gold';
      if (user[resourceField] < totalPrice) {
        return res.status(400).json({
          error: `Recursos insuficientes. Você tem ${user[resourceField]} ${item.currency}`,
          required: totalPrice,
          current: user[resourceField]
        });
      }

      // Descontar recursos
      db.run(
        `UPDATE users SET ${resourceField} = ${resourceField} - ? WHERE id = ?`,
        [totalPrice, userId]
      );

      // Adicionar ao inventário
      db.get(
        'SELECT * FROM inventory WHERE user_id = ? AND item_id = ?',
        [userId, item_id],
        (err, inventoryItem) => {
          if (inventoryItem) {
            db.run(
              'UPDATE inventory SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
              [quantity, userId, item_id]
            );
          } else {
            db.run(
              'INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
              [userId, item_id, quantity]
            );
          }
        }
      );

      res.json({
        success: true,
        user_id: userId,
        item_id: item_id,
        item_name: item.name,
        quantity: quantity,
        price_paid: totalPrice,
        currency: item.currency,
        new_balance: user[resourceField] - totalPrice,
        purchased_at: new Date().toISOString()
      });
    });
  });
});

// Vender item
router.post('/sell', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { item_id, quantity } = req.body;

  if (!item_id || !quantity) {
    return res.status(400).json({ error: 'item_id e quantity são obrigatórios' });
  }

  // Obter item
  db.get('SELECT * FROM shop_items WHERE id = ?', [item_id], (err, item) => {
    if (err || !item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const sellPrice = Math.floor(item.price * 0.7); // 70% do preço original
    const totalPrice = sellPrice * quantity;

    // Verificar se tem o item no inventário
    db.get(
      'SELECT * FROM inventory WHERE user_id = ? AND item_id = ?',
      [userId, item_id],
      (err, inventoryItem) => {
        if (err || !inventoryItem || inventoryItem.quantity < quantity) {
          return res.status(400).json({ error: 'Quantidade insuficiente no inventário' });
        }

        // Remover do inventário
        if (inventoryItem.quantity === quantity) {
          db.run('DELETE FROM inventory WHERE user_id = ? AND item_id = ?', [userId, item_id]);
        } else {
          db.run(
            'UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?',
            [quantity, userId, item_id]
          );
        }

        // Adicionar recursos
        const resourceField = item.currency === 'diamonds' ? 'diamonds' : 'gold';
        db.run(
          `UPDATE users SET ${resourceField} = ${resourceField} + ? WHERE id = ?`,
          [totalPrice, userId]
        );

        res.json({
          success: true,
          user_id: userId,
          item_id: item_id,
          item_name: item.name,
          quantity: quantity,
          price_received: totalPrice,
          currency: item.currency,
          sold_at: new Date().toISOString()
        });
      }
    );
  });
});

module.exports = router;
