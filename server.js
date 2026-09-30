require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const { router: authRouter } = require('./routes/auth');
const produtosRouter = require('./routes/produtos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-provisorio-troque-isso',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8 // sessão dura 8 horas
  }
}));

// Disponibiliza o nome do salão e o número de WhatsApp para o front-end,
// sem precisar mexer no HTML toda vez que esses dados mudarem.
app.get('/api/config', (req, res) => {
  res.json({
    nomeSalao: process.env.NOME_SALAO || 'Vitrine',
    whatsapp: process.env.WHATSAPP_NUMBER || ''
  });
});

app.use('/api/auth', authRouter);
app.use('/api/produtos', produtosRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`\nVitrine rodando! Abra no navegador: http://localhost:${PORT}`);
  console.log(`Área da administradora: http://localhost:${PORT}/admin.html\n`);
});
