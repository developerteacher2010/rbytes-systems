const formAcompanhar = document.getElementById("formAcompanhar");
const resultadoProjeto = document.getElementById("resultadoProjeto");
const codigoInput = document.getElementById("codigo");
const senhaInput = document.getElementById("senha");

function limparResultadoProjeto() {
  resultadoProjeto.innerHTML = "";
  resultadoProjeto.classList.add("hidden");
}

codigoInput?.addEventListener("input", limparResultadoProjeto);
senhaInput?.addEventListener("input", limparResultadoProjeto);

formAcompanhar?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = codigoInput.value.trim();
  const senha = senhaInput.value.trim();

  resultadoProjeto.classList.remove("hidden");
  resultadoProjeto.innerHTML = `<div class="sucesso">Consultando projeto...</div>`;

  try {
    const resposta = await fetch("/api/acompanhar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ codigo, senha })
    });

    const dados = await resposta.json();

    if (!dados.success) {
      resultadoProjeto.innerHTML = `<div class="erro">${dados.message || "Projeto não encontrado."}</div>`;
      return;
    }

    const projeto = dados.projeto;
    const timelineHtml = dados.timeline && dados.timeline.length
      ? dados.timeline.map(item => `
          <div class="card" style="margin-top:10px;">
            <p><strong>${item.etapa}</strong> - ${item.data}</p>
            <p>${item.descricao}</p>
          </div>
        `).join("")
      : "<p>Nenhuma etapa registrada ainda.</p>";

    resultadoProjeto.innerHTML = `
      <div class="status-tag">${projeto.status}</div>
      <h3>${projeto.nomeprojeto || projeto.nomeProjeto}</h3>
      <p><strong>Cliente:</strong> ${projeto.cliente}</p>
      <p><strong>Código:</strong> ${projeto.codigo}</p>
      <p><strong>Etapa atual:</strong> ${projeto.etapaatual || projeto.etapaAtual}</p>
      <p><strong>Previsão de entrega:</strong> ${projeto.previsaoentrega || projeto.previsaoEntrega || "Não definida"}</p>

      <div class="barra">
        <span style="width: ${projeto.progresso}%;"></span>
      </div>

      <p><strong>Progresso:</strong> ${projeto.progresso}%</p>
      <p><strong>Observações:</strong> ${projeto.observacoes || "-"}</p>

      <h4 style="margin-top:20px;">Linha do tempo do projeto</h4>
      ${timelineHtml}
    `;

    // limpa os campos depois da consulta
    formAcompanhar.reset();
  } catch (erro) {
    resultadoProjeto.innerHTML = `<div class="erro">Erro ao consultar o projeto.</div>`;
  }
});

function abrirModal(titulo, texto) {
    document.getElementById("modalTitulo").innerText = titulo;
    document.getElementById("modalTexto").innerText = texto;
    document.getElementById("modal").style.display = "flex";
  }
  
  function fecharModal() {
    document.getElementById("modal").style.display = "none";
  }
  

  window.onclick = function(e) {
    if (e.target.id === "modal") {
      fecharModal();
    }
  }
  

  const elementos = document.querySelectorAll(".card");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  });
  
  elementos.forEach(el => observer.observe(el));
  

  window.addEventListener("load", () => {
    document.getElementById("loader").style.display = "none";
  });
  const formOrcamento = document.getElementById("formOrcamento");
const resultadoOrcamento = document.getElementById("resultadoOrcamento");

formOrcamento?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    nome: document.getElementById("nomeLead").value.trim(),
    whatsapp: document.getElementById("whatsappLead").value.trim(),
    empresa: document.getElementById("empresaLead").value.trim(),
    servico: document.getElementById("servicoLead").value.trim(),
    mensagem: document.getElementById("mensagemLead").value.trim()
  };

  try {
    const resposta = await fetch("/api/orcamento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const dados = await resposta.json();

    if (!dados.success) {
      resultadoOrcamento.innerHTML = `<div class="erro">${dados.message || "Erro ao enviar orçamento."}</div>`;
      return;
    }

    resultadoOrcamento.innerHTML = `<div class="sucesso">${dados.message}</div>`;
    formOrcamento.reset();
  } catch (erro) {
    console.error("Erro no envio do orçamento:", erro);
    resultadoOrcamento.innerHTML = `<div class="erro">Erro ao enviar orçamento.</div>`;
  }
});
const chatbotToggle = document.getElementById("chatbotToggle");
const chatbotBox = document.getElementById("chatbotBox");
const chatbotMessages = document.getElementById("chatbotMessages");

chatbotToggle?.addEventListener("click", () => {
  chatbotBox.classList.toggle("hidden");
});

function adicionarMensagem(texto, tipo = "bot") {
  const div = document.createElement("div");
  div.className = tipo === "user" ? "user-msg" : "bot-msg";
  div.textContent = texto;
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function respostaChat(tipo) {
  if (tipo === "site") {
    adicionarMensagem("Quero um site", "user");
    adicionarMensagem("Perfeito. Criamos sites institucionais, landing pages e páginas profissionais sob medida.");
  }

  if (tipo === "sistema") {
    adicionarMensagem("Quero um sistema", "user");
    adicionarMensagem("Ótimo. Desenvolvemos sistemas web com login, painel, cadastros, relatórios e automações.");
  }

  if (tipo === "orcamento") {
    adicionarMensagem("Pedir orçamento", "user");
    adicionarMensagem("Você pode preencher o formulário de orçamento aqui na página e nossa equipe retorna com a proposta.");
    document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth" });
  }

  if (tipo === "whatsapp") {
    adicionarMensagem("Falar no WhatsApp", "user");
    adicionarMensagem("Estou te redirecionando para o WhatsApp.");
    window.open("https://wa.me/5531999038472?text=Olá! Quero falar com a Rbytes Systems.", "_blank");
  }
}
