const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    const nomeUnico = crypto.randomBytes(8).toString('hex') + extensao;
    cb(null, nomeUnico);
  }
});

const TIPOS_PERMITIDOS = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB, dá folga para fotos tiradas direto do celular
  fileFilter: (req, file, cb) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    if (TIPOS_PERMITIDOS.includes(extensao)) {
      cb(null, true);
    } else {
      cb(new Error('Envie uma imagem em JPG, PNG ou WEBP.'));
    }
  }
});

function apagarImagem(nomeArquivo) {
  if (!nomeArquivo) return;
  const caminho = path.join(UPLOADS_DIR, nomeArquivo);
  fs.unlink(caminho, () => {}); // se der erro (arquivo já não existe), apenas ignora
}

// Lista pública dos produtos — usada pela vitrine que as clientes acessam.
// Por padrão só mostra produtos marcados como disponíveis.
router.get('/', (req, res) => {
  const mostrarTodos = req.query.todos === '1' && req.session && req.session.autenticado;
  const linhas = mostrarTodos
    ? db.prepare('SELECT * FROM produtos ORDER BY criado_em DESC').all()
    : db.prepare('SELECT * FROM produtos WHERE disponivel = 1 ORDER BY criado_em DESC').all();
  res.json(linhas);
});

// Criação de produto — protegida, só a área admin consegue chamar.
router.post('/', requireAuth, (req, res) => {
  upload.single('imagem')(req, res, (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({ erro: erroUpload.message });
    }

    const { nome, descricao, preco, categoria } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'Informe o nome do produto.' });
    }
    const precoNumero = Number(preco);
    if (!preco || Number.isNaN(precoNumero) || precoNumero < 0) {
      return res.status(400).json({ erro: 'Informe um preço válido.' });
    }

    const imagem = req.file ? req.file.filename : null;

    const resultado = db.prepare(`
      INSERT INTO produtos (nome, descricao, preco, categoria, imagem)
      VALUES (?, ?, ?, ?, ?)
    `).run(nome.trim(), (descricao || '').trim(), precoNumero, (categoria || 'Outros').trim(), imagem);

    const produtoCriado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(produtoCriado);
  });
});

// Edição de produto. A foto é opcional: se não enviar uma nova, mantém a atual.
router.put('/:id', requireAuth, (req, res) => {
  upload.single('imagem')(req, res, (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({ erro: erroUpload.message });
    }

    const produtoAtual = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    if (!produtoAtual) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    const { nome, descricao, preco, categoria, disponivel } = req.body;
    const precoNumero = preco !== undefined ? Number(preco) : produtoAtual.preco;
    if (Number.isNaN(precoNumero) || precoNumero < 0) {
      return res.status(400).json({ erro: 'Informe um preço válido.' });
    }

    let imagem = produtoAtual.imagem;
    if (req.file) {
      apagarImagem(produtoAtual.imagem);
      imagem = req.file.filename;
    }

    db.prepare(`
      UPDATE produtos
      SET nome = ?, descricao = ?, preco = ?, categoria = ?, imagem = ?, disponivel = ?
      WHERE id = ?
    `).run(
      nome !== undefined ? nome.trim() : produtoAtual.nome,
      descricao !== undefined ? descricao.trim() : produtoAtual.descricao,
      precoNumero,
      categoria !== undefined ? categoria.trim() : produtoAtual.categoria,
      imagem,
      disponivel !== undefined ? (disponivel === 'true' || disponivel === '1' ? 1 : 0) : produtoAtual.disponivel,
      req.params.id
    );

    const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    res.json(produtoAtualizado);
  });
});

router.delete('/:id', requireAuth, (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  apagarImagem(produto.imagem);
  db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
