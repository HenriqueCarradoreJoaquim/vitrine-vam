(() => {
  const telaLogin = document.getElementById('tela-login');
  const painel = document.getElementById('painel');
  const formLogin = document.getElementById('form-login');
  const erroLogin = document.getElementById('erro-login');

  const formProduto = document.getElementById('form-produto');
  const erroForm = document.getElementById('erro-form');
  const sucessoForm = document.getElementById('sucesso-form');
  const listaAdmin = document.getElementById('lista-admin');
  const inputImagem = document.getElementById('imagem');
  const previewFoto = document.getElementById('preview-foto');
  const inputId = document.getElementById('produto-id');
  const botaoSalvar = document.getElementById('botao-salvar');
  const tituloForm = document.getElementById('titulo-form');
  const botaoCancelarEdicao = document.getElementById('botao-cancelar-edicao');
  const campoDisponivel = document.getElementById('campo-disponivel');
  const checkDisponivel = document.getElementById('disponivel');

  const formatarPreco = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function mostrarErro(el, msg) {
    el.textContent = msg;
    el.classList.add('visivel');
    setTimeout(() => el.classList.remove('visivel'), 4000);
  }

  function mostrarSucesso(el, msg) {
    el.textContent = msg;
    el.classList.add('visivel');
    setTimeout(() => el.classList.remove('visivel'), 3000);
  }

  // ---------- Login ----------

  async function verificarSessao() {
    const status = await fetch('/api/auth/status').then(r => r.json());
    if (status.autenticado) {
      telaLogin.style.display = 'none';
      painel.style.display = 'block';
      carregarLista();
    } else {
      telaLogin.style.display = 'block';
      painel.style.display = 'none';
    }
  }

  formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const senha = document.getElementById('senha').value;
    const resposta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    if (resposta.ok) {
      formLogin.reset();
      verificarSessao();
    } else {
      const dados = await resposta.json();
      mostrarErro(erroLogin, dados.erro || 'Não foi possível entrar.');
    }
  });

  document.getElementById('botao-sair').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    verificarSessao();
  });

  // ---------- Preview de foto ----------

  inputImagem.addEventListener('change', () => {
    const arquivo = inputImagem.files[0];
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    previewFoto.innerHTML = `<img src="${url}" alt="Pré-visualização">`;
  });

  // ---------- Formulário: adicionar / editar ----------

  function limparFormulario() {
    formProduto.reset();
    inputId.value = '';
    previewFoto.innerHTML = 'Toque para tirar foto ou escolher da galeria';
    tituloForm.textContent = 'Adicionar produto';
    botaoSalvar.textContent = 'Adicionar à vitrine';
    botaoCancelarEdicao.style.display = 'none';
    campoDisponivel.style.display = 'none';
  }

  botaoCancelarEdicao.addEventListener('click', limparFormulario);

  formProduto.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    botaoSalvar.disabled = true;

    const dados = new FormData();
    dados.append('nome', document.getElementById('nome').value);
    dados.append('preco', document.getElementById('preco').value);
    dados.append('categoria', document.getElementById('categoria').value || 'Outros');
    dados.append('descricao', document.getElementById('descricao').value);
    if (inputImagem.files[0]) dados.append('imagem', inputImagem.files[0]);

    const id = inputId.value;
    if (id) dados.append('disponivel', checkDisponivel.checked ? 'true' : 'false');

    const url = id ? `/api/produtos/${id}` : '/api/produtos';
    const metodo = id ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, { method: metodo, body: dados });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        mostrarErro(erroForm, resultado.erro || 'Não foi possível salvar o produto.');
        return;
      }

      mostrarSucesso(sucessoForm, id ? 'Produto atualizado!' : 'Produto adicionado à vitrine!');
      limparFormulario();
      carregarLista();
    } catch {
      mostrarErro(erroForm, 'Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      botaoSalvar.disabled = false;
    }
  });

  // ---------- Lista de produtos cadastrados ----------

  function itemAdmin(produto) {
    const foto = produto.imagem
      ? `<img src="/uploads/${produto.imagem}" alt="${produto.nome}">`
      : `<div class="sem-foto-mini">sem foto</div>`;

    return `
      <div class="item-admin" data-id="${produto.id}">
        ${foto}
        <div class="info">
          <strong>${produto.nome} ${produto.disponivel ? '' : '<span class="chip-indisponivel">oculto</span>'}</strong>
          <span>${produto.categoria} · <span class="preco-mini">${formatarPreco(produto.preco)}</span></span>
        </div>
        <div class="acoes">
          <button class="botao-icone editar" title="Editar" data-acao="editar">✎</button>
          <button class="botao-icone apagar" title="Apagar" data-acao="apagar">✕</button>
        </div>
      </div>
    `;
  }

  let cacheProdutos = [];

  async function carregarLista() {
    listaAdmin.innerHTML = '<div class="carregando">Carregando…</div>';
    const produtos = await fetch('/api/produtos?todos=1').then(r => r.json());
    cacheProdutos = produtos;

    if (produtos.length === 0) {
      listaAdmin.innerHTML = '<div class="carregando">Nenhum produto cadastrado ainda.</div>';
      return;
    }

    listaAdmin.innerHTML = produtos.map(itemAdmin).join('');

    listaAdmin.querySelectorAll('[data-acao="editar"]').forEach(botao => {
      botao.addEventListener('click', () => iniciarEdicao(botao.closest('.item-admin').dataset.id));
    });
    listaAdmin.querySelectorAll('[data-acao="apagar"]').forEach(botao => {
      botao.addEventListener('click', () => apagarProduto(botao.closest('.item-admin').dataset.id));
    });
  }

  function iniciarEdicao(id) {
    const produto = cacheProdutos.find(p => String(p.id) === String(id));
    if (!produto) return;

    inputId.value = produto.id;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('preco').value = produto.preco;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('descricao').value = produto.descricao || '';
    checkDisponivel.checked = !!produto.disponivel;

    previewFoto.innerHTML = produto.imagem
      ? `<img src="/uploads/${produto.imagem}" alt="${produto.nome}">`
      : 'Toque para tirar foto ou escolher da galeria';

    tituloForm.textContent = `Editando: ${produto.nome}`;
    botaoSalvar.textContent = 'Salvar alterações';
    botaoCancelarEdicao.style.display = 'block';
    campoDisponivel.style.display = 'block';

    formProduto.scrollIntoView({ behavior: 'smooth' });
  }

  async function apagarProduto(id) {
    const produto = cacheProdutos.find(p => String(p.id) === String(id));
    const confirmar = confirm(`Remover "${produto ? produto.nome : 'este produto'}" da vitrine?`);
    if (!confirmar) return;

    const resposta = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
    if (resposta.ok) {
      carregarLista();
    } else {
      alert('Não foi possível remover o produto.');
    }
  }

  verificarSessao();
})();
