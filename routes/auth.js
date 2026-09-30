const express = require('express');
const router = express.Router();

// Verifica se quem está fazendo a requisição já fez login como admin.
// Usado antes das rotas que criam, editam ou apagam produtos.
function requireAuth(req, res, next) {
  if (req.session && req.session.autenticado) {
    return next();
  }
  return res.status(401).json({ erro: 'Você precisa entrar com a senha primeiro.' });
}

router.post('/login', (req, res) => {
  const { senha } = req.body;
  if (senha && senha === process.env.ADMIN_PASSWORD) {
    req.session.autenticado = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ erro: 'Senha incorreta.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/status', (req, res) => {
  res.json({ autenticado: !!(req.session && req.session.autenticado) });
});

module.exports = { router, requireAuth };
