const formAcompanhar = document.getElementById("formAcompanhar");
const resultadoProjeto = document.getElementById("resultadoProjeto");

formAcompanhar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo").value.trim();
  const senha = document.getElementById("senha").value.trim();

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
      resultadoProjeto.innerHTML = `<div class="erro">${dados.message}</div>`;
      return;
    }

    const projeto = dados.projeto;

    resultadoProjeto.innerHTML = `
      <div class="status-tag">${projeto.status}</div>
      <h3>${projeto.nomeProjeto}</h3>
      <p><strong>Cliente:</strong> ${projeto.cliente}</p>
      <p><strong>Código:</strong> ${projeto.codigo}</p>
      <p><strong>Etapa atual:</strong> ${projeto.etapaAtual}</p>
      <p><strong>Previsão de entrega:</strong> ${projeto.previsaoEntrega}</p>

      <div class="barra">
        <span style="width: ${projeto.progresso}%;"></span>
      </div>

      <p><strong>Progresso:</strong> ${projeto.progresso}%</p>
      <p><strong>Observações:</strong> ${projeto.observacoes}</p>
    `;
  } catch (erro) {
    resultadoProjeto.innerHTML = `<div class="erro">Erro ao consultar o projeto. Tente novamente.</div>`;
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