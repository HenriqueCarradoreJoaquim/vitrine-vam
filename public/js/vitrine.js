(() => {
  const grade = document.getElementById('grade');
  const categoriasEl = document.getElementById('categorias');

  let produtos = [];
  let whatsappNumero = '';
  let categoriaAtiva = 'Todos';

  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const formatarPreco = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function iconeWhatsapp() {
    return `<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.09-.44-4.36-1.2l-.31-.18-3.1.81.82-3.02-.2-.32A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.4-5.9c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/></svg>`;
  }

  function cartaoProduto(produto) {
    const foto = produto.imagem
      ? `<img src="/uploads/${produto.imagem}" alt="${esc(produto.nome)}" loading="lazy">`
      : `<div class="sem-foto">VAM</div>`;

    const mensagem = encodeURIComponent(
      `Olá! Vi o produto "${produto.nome}" (${formatarPreco(produto.preco)}) na vitrine e quero saber mais.`
    );
    const linkWhats = whatsappNumero
      ? `https://wa.me/${whatsappNumero}?text=${mensagem}`
      : '#';

    const descricao = produto.descricao
      ? `<p class="descricao">${esc(produto.descricao)}</p>`
      : '';

    return `
      <article class="cartao-produto">
        <div class="foto-wrap">${foto}</div>
        <div class="corpo-cartao">
          <span class="categoria-tag">${esc(produto.categoria)}</span>
          <h3>${esc(produto.nome)}</h3>
          ${descricao}
          <div class="preco">${formatarPreco(produto.preco)}</div>
          <a class="botao-whatsapp" href="${linkWhats}" target="_blank" rel="noopener">
            ${iconeWhatsapp()} Pedir no WhatsApp
          </a>
        </div>
      </article>
    `;
  }

  function renderizarCategorias() {
    const categorias = ['Todos', ...new Set(produtos.map(p => p.categoria))];
    categoriasEl.innerHTML = categorias.map(cat => `
      <button class="categoria-pill ${cat === categoriaAtiva ? 'ativa' : ''}" data-categoria="${esc(cat)}">
        ${esc(cat)}
      </button>
    `).join('');

    categoriasEl.querySelectorAll('.categoria-pill').forEach(botao => {
      botao.addEventListener('click', () => {
        categoriaAtiva = botao.dataset.categoria;
        renderizarCategorias();
        renderizarGrade();
      });
    });
  }

  function renderizarGrade() {
    const visiveis = categoriaAtiva === 'Todos'
      ? produtos
      : produtos.filter(p => p.categoria === categoriaAtiva);

    if (visiveis.length === 0) {
      grade.innerHTML = `
        <div class="estado-vazio">
          <img class="marca" src="/img/monograma.png" alt="">
          <h2>Nenhum produto aqui ainda</h2>
          <p>Escolha outra categoria para ver os produtos.</p>
        </div>`;
      return;
    }

    grade.innerHTML = visiveis.map(cartaoProduto).join('');
  }

  async function carregar() {
    try {
      const [config, resProdutos] = await Promise.all([
        fetch('/api/config').then(r => r.json()),
        fetch('/api/produtos').then(r => r.json())
      ]);

      whatsappNumero = config.whatsapp || '';

      produtos = resProdutos;
      renderizarCategorias();
      renderizarGrade();
    } catch (erro) {
      grade.innerHTML = `<div class="estado-vazio"><h2>Não foi possível carregar a vitrine</h2><p>Tente novamente em instantes.</p></div>`;
    }
  }

  carregar();
})();
