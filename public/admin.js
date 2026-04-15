const loginAdminForm = document.getElementById("loginAdminForm");
const loginAdminResultado = document.getElementById("loginAdminResultado");
const adminArea = document.getElementById("adminArea");

const formProjeto = document.getElementById("formProjeto");
const resultadoProjetoAdmin = document.getElementById("resultadoProjetoAdmin");

const formTimeline = document.getElementById("formTimeline");
const resultadoTimeline = document.getElementById("resultadoTimeline");

const listaProjetos = document.getElementById("listaProjetos");
const listaLeads = document.getElementById("listaLeads");

loginAdminForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("adminUsuario").value.trim();
  const senha = document.getElementById("adminSenha").value.trim();

  try {
    const resposta = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resposta.json();

    if (!dados.success) {
      loginAdminResultado.innerHTML = `<div class="erro">${dados.message || "Login inválido"}</div>`;
      return;
    }

    loginAdminResultado.innerHTML = `<div class="sucesso">${dados.message || "Login realizado com sucesso."}</div>`;
    adminArea.classList.remove("hidden");

    await carregarProjetos();
    await carregarLeads();
  } catch (erro) {
    loginAdminResultado.innerHTML = `<div class="erro">Erro ao realizar login.</div>`;
  }
});
formProjeto?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(formProjeto);

  try {
    const resposta = await fetch("/api/admin/projetos", {
      method: "POST",
      body: formData
    });

    const dados = await resposta.json();

    if (!dados.success) {
      resultadoProjetoAdmin.innerHTML = `<div class="erro">${dados.message || "Erro ao cadastrar projeto."}</div>`;
      return;
    }

    resultadoProjetoAdmin.innerHTML = `
      <div class="sucesso">
        Projeto cadastrado com sucesso.<br>
        <strong>Código:</strong> ${dados.codigo}<br>
        <strong>Senha:</strong> ${dados.senha}
      </div>
    `;

    formProjeto.reset();
    carregarProjetos();
  } catch (erro) {
    resultadoProjetoAdmin.innerHTML = `<div class="erro">Erro ao cadastrar projeto.</div>`;
  }
});

formTimeline?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(formTimeline);

  const body = {
    projeto_id: formData.get("projeto_id"),
    etapa: formData.get("etapa"),
    descricao: formData.get("descricao"),
    data: formData.get("data")
  };

  try {
    const resposta = await fetch("/api/admin/timeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const dados = await resposta.json();

    if (!dados.success) {
      resultadoTimeline.innerHTML = `<div class="erro">${dados.message || "Erro ao adicionar etapa."}</div>`;
      return;
    }

    resultadoTimeline.innerHTML = `<div class="sucesso">${dados.message || "Etapa adicionada com sucesso."}</div>`;
    formTimeline.reset();
  } catch (erro) {
    resultadoTimeline.innerHTML = `<div class="erro">Erro ao adicionar etapa.</div>`;
  }
});

async function carregarProjetos() {
  try {
    const resposta = await fetch("/api/admin/projetos");
    const dados = await resposta.json();

    if (!dados.success) {
      listaProjetos.innerHTML = `<div class="erro">Erro ao carregar projetos.</div>`;
      return;
    }

    if (!dados.projetos || dados.projetos.length === 0) {
      listaProjetos.innerHTML = `<p>Nenhum projeto cadastrado ainda.</p>`;
      return;
    }

    listaProjetos.innerHTML = dados.projetos.map((projeto) => `
      <div class="card" style="margin-bottom: 15px;">
        <h3>${projeto.nomeprojeto || projeto.nomeProjeto}</h3>
        <p><strong>ID:</strong> ${projeto.id}</p>
        <p><strong>Cliente:</strong> ${projeto.cliente}</p>
        <p><strong>Código:</strong> ${projeto.codigo}</p>
        <p><strong>Senha:</strong> ${projeto.senha}</p>
        <p><strong>Status:</strong> ${projeto.status}</p>
        <p><strong>Progresso:</strong> ${projeto.progresso}%</p>
        <p><strong>Etapa atual:</strong> ${projeto.etapaatual || projeto.etapaAtual}</p>
        <p><strong>Previsão de entrega:</strong> ${projeto.previsaoentrega || projeto.previsaoEntrega || "Não definida"}</p>
        <p><strong>Observações:</strong> ${projeto.observacoes || "-"}</p>
      </div>
    `).join("");
  } catch (erro) {
    listaProjetos.innerHTML = `<div class="erro">Erro ao carregar projetos.</div>`;
  }
}

async function carregarLeads() {
  try {
    const resposta = await fetch("/api/admin/leads");
    const dados = await resposta.json();

    console.log("Leads recebidos:", dados);

    if (!dados.success) {
      listaLeads.innerHTML = `<div class="erro">Erro ao carregar leads.</div>`;
      return;
    }

    if (!dados.leads || dados.leads.length === 0) {
      listaLeads.innerHTML = `<p>Nenhum orçamento recebido ainda.</p>`;
      return;
    }

    listaLeads.innerHTML = dados.leads.map((lead) => `
      <div class="card" style="margin-bottom: 15px;">
        <p><strong>Nome:</strong> ${lead.nome}</p>
        <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
        <p><strong>Empresa:</strong> ${lead.empresa || "-"}</p>
        <p><strong>Serviço:</strong> ${lead.servico || "-"}</p>
        <p><strong>Mensagem:</strong> ${lead.mensagem || "-"}</p>
        <p><strong>Data:</strong> ${lead.data}</p>
      </div>
    `).join("");
  } catch (erro) {
    console.error("Erro ao buscar leads:", erro);
    listaLeads.innerHTML = `<div class="erro">Erro ao carregar leads.</div>`;
  }
}
setInterval(() => {
  if (!adminArea.classList.contains("hidden")) {
    carregarLeads();
  }
}, 5000);