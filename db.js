const Database = require('better-sqlite3');
const path = require('path');

// O banco fica salvo num arquivo único (vitrine.db) na raiz do projeto.
// Não precisa instalar nem configurar nenhum servidor de banco de dados.
const db = new Database(path.join(__dirname, 'vitrine.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco REAL NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Outros',
    imagem TEXT,
    disponivel INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
