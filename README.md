# Vitrine — Espaço da Beleza Vam

App simples para sua mãe cadastrar produtos (foto + descrição + preço) pelo
celular, e as clientes verem tudo numa vitrine bonita pelo navegador.

## O que tem aqui

- **Vitrine pública** (`/`): as clientes acessam por um link, veem os
  produtos em cards com foto, preço e descrição, filtram por categoria
  (Avon, Jequiti, etc.) e clicam num botão que já abre o WhatsApp com uma
  mensagem pronta perguntando sobre o produto.
- **Painel administrativo** (`/admin.html`): protegido por senha. É onde
  sua mãe tira a foto, digita nome/preço/descrição/categoria e
  adiciona/edita/remove produtos.
- Tudo roda em **Node.js + Express**, com um banco **SQLite** (um único
  arquivo, sem precisar instalar nada a mais) e as fotos ficam salvas em
  `public/uploads`.

## Como rodar na sua máquina

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo de configuração:
   ```bash
   cp .env.example .env
   ```
3. Abra o `.env` e ajuste:
   - `ADMIN_PASSWORD`: a senha que sua mãe vai usar para entrar no painel
   - `WHATSAPP_NUMBER`: o número que recebe as mensagens das clientes
     (formato: `55` + DDD + número, só dígitos)
   - `NOME_SALAO`: o nome que aparece no topo da vitrine
4. Suba o servidor:
   ```bash
   npm start
   ```
5. Acesse:
   - Vitrine: http://localhost:3000
   - Painel da sua mãe: http://localhost:3000/admin.html

## Testando pelo celular dela na mesma rede Wi-Fi

Enquanto está rodando local, dá pra abrir do celular dela sem precisar
publicar na internet ainda:

1. Descubra o IP do computador na rede Wi-Fi (no Windows: `ipconfig`, no
   Mac/Linux: `ifconfig` ou `ip a` — procure por algo como `192.168.0.x`).
2. No celular (conectado na mesma Wi-Fi), acesse
   `http://192.168.0.x:3000/admin.html` para cadastrar produtos direto da
   câmera, e `http://192.168.0.x:3000` para ver a vitrine.

## Colocando o link no ar para as clientes (WhatsApp/Instagram)

Quando quiser divulgar de verdade, o próximo passo é colocar o projeto num
serviço de hospedagem (ex: Render ou Railway, que têm planos gratuitos) para
gerar um link público fixo, tipo `https://vitrine-vam.onrender.com`. Nesse
momento vale ajustar duas coisas:

- As fotos precisam ficar num **disco persistente** (Render e Railway
  oferecem isso nos planos pagos; no gratuito os arquivos podem ser
  apagados a cada reinício — se isso for um problema, dá pra trocar o
  armazenamento de fotos para um serviço como Cloudinary, que é gratuito
  até um certo volume).
- Trocar `SESSION_SECRET` e `ADMIN_PASSWORD` por valores fortes antes de
  publicar.

Posso te ajudar com esse passo a passo quando chegar a hora — é só avisar.

## Estrutura do projeto

```
vitrine-vam/
├── server.js              # ponto de entrada do servidor
├── db.js                  # configuração do banco SQLite
├── routes/
│   ├── auth.js             # login/logout do painel admin
│   └── produtos.js         # criar, listar, editar, apagar produtos
└── public/
    ├── index.html           # vitrine pública
    ├── admin.html            # painel da administradora
    ├── css/style.css         # visual do site
    ├── js/vitrine.js         # lógica da vitrine pública
    ├── js/admin.js           # lógica do painel admin
    └── uploads/              # fotos dos produtos
```

## Próximas ideias (quando quiser evoluir)

- Deixar o app "instalável" na tela inicial do celular (PWA)
- Botão de compartilhar produto direto no WhatsApp/Instagram Stories
- Marcar produtos como "mais vendido" ou "novidade"
- Relatório simples de quais produtos mais geraram cliques no WhatsApp
