const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Garantir pasta uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const nomeSeguro = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${nomeSeguro}`);
  }
});

const upload = multer({ storage });

// Banco SQLite
const db = new sqlite3.Database(path.join(__dirname, "database.db"));

// Criar tabelas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE,
      senha TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT,
      senha TEXT,
      cliente TEXT,
      nomeProjeto TEXT,
      status TEXT,
      progresso INTEGER,
      etapaAtual TEXT,
      previsaoEntrega TEXT,
      observacoes TEXT,
      imagem TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projeto_id INTEGER,
      etapa TEXT,
      descricao TEXT,
      data TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      whatsapp TEXT,
      empresa TEXT,
      servico TEXT,
      mensagem TEXT,
      data TEXT
    )
  `);

  db.run(
    `
    INSERT OR REPLACE INTO admins (id, usuario, senha)
    VALUES (
      COALESCE((SELECT id FROM admins WHERE usuario = 'rbytes.systems'), NULL),
      'rbytes.systems',
      'Gvs0047*83@83'
    )
    `,
    (err) => {
      if (err) {
        console.log("Erro admin:", err.message);
      } else {
        console.log("Admin pronto: rbytes.systems");
      }
    }
  );
});

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Página admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Login admin
app.post("/api/admin/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({
      success: false,
      message: "Informe usuário e senha."
    });
  }

  db.get(
    `SELECT * FROM admins WHERE usuario = ? AND senha = ?`,
    [usuario, senha],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erro interno no login."
        });
      }

      if (!row) {
        return res.status(401).json({
          success: false,
          message: "Usuário ou senha inválidos."
        });
      }

      return res.json({
        success: true,
        message: "Login realizado com sucesso."
      });
    }
  );
});

// Cadastrar projeto
app.post("/api/admin/projetos", upload.single("imagem"), (req, res) => {
  const {
    cliente,
    nomeProjeto,
    status,
    progresso,
    etapaAtual,
    previsaoEntrega,
    observacoes
  } = req.body;

  if (!cliente || !nomeProjeto || !status || !progresso || !etapaAtual) {
    return res.status(400).json({
      success: false,
      message: "Preencha os campos obrigatórios do projeto."
    });
  }

  const codigo = "RB-" + Math.floor(100000 + Math.random() * 900000);
  const senha = Math.random().toString(36).slice(-8).toUpperCase();
  const imagem = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    `
    INSERT INTO projetos
    (codigo, senha, cliente, nomeProjeto, status, progresso, etapaAtual, previsaoEntrega, observacoes, imagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      codigo,
      senha,
      cliente,
      nomeProjeto,
      status,
      Number(progresso),
      etapaAtual,
      previsaoEntrega || "",
      observacoes || "",
      imagem
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erro ao cadastrar projeto."
        });
      }

      return res.status(201).json({
        success: true,
        message: "Projeto cadastrado com sucesso.",
        projetoId: this.lastID,
        codigo,
        senha
      });
    }
  );
});

// Listar projetos
app.get("/api/admin/projetos", (req, res) => {
  db.all(`SELECT * FROM projetos ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar projetos."
      });
    }

    return res.json({
      success: true,
      projetos: rows
    });
  });
});

// Adicionar etapa na timeline
app.post("/api/admin/timeline", (req, res) => {
  const { projeto_id, etapa, descricao, data } = req.body;

  if (!projeto_id || !etapa || !descricao || !data) {
    return res.status(400).json({
      success: false,
      message: "Preencha todos os campos da timeline."
    });
  }

  db.run(
    `
    INSERT INTO timeline (projeto_id, etapa, descricao, data)
    VALUES (?, ?, ?, ?)
    `,
    [projeto_id, etapa, descricao, data],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erro ao adicionar etapa."
        });
      }

      return res.json({
        success: true,
        message: "Etapa adicionada com sucesso."
      });
    }
  );
});

// Acompanhar projeto
app.post("/api/acompanhar", (req, res) => {
  const { codigo, senha } = req.body;

  if (!codigo || !senha) {
    return res.status(400).json({
      success: false,
      message: "Informe código e senha."
    });
  }

  db.get(
    `SELECT * FROM projetos WHERE codigo = ? AND senha = ?`,
    [codigo, senha],
    (err, projeto) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erro ao consultar projeto."
        });
      }

      if (!projeto) {
        return res.status(404).json({
          success: false,
          message: "Projeto não encontrado."
        });
      }

      db.all(
        `SELECT * FROM timeline WHERE projeto_id = ? ORDER BY id DESC`,
        [projeto.id],
        (err2, etapas) => {
          if (err2) {
            return res.status(500).json({
              success: false,
              message: "Erro ao buscar timeline."
            });
          }

          return res.json({
            success: true,
            projeto,
            timeline: etapas
          });
        }
      );
    }
  );
});

// Salvar orçamento
app.post("/api/orcamento", (req, res) => {
  const { nome, whatsapp, empresa, servico, mensagem } = req.body;
  const data = new Date().toLocaleString("pt-BR");

  if (!nome || !whatsapp) {
    return res.status(400).json({
      success: false,
      message: "Nome e WhatsApp são obrigatórios."
    });
  }

  db.run(
    `
    INSERT INTO leads (nome, whatsapp, empresa, servico, mensagem, data)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [nome, whatsapp, empresa || "", servico || "", mensagem || "", data],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Erro ao salvar orçamento."
        });
      }

      return res.json({
        success: true,
        message: "Orçamento enviado com sucesso."
      });
    }
  );
});

// Listar leads
app.get("/api/admin/leads", (req, res) => {
  db.all(`SELECT * FROM leads ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar leads."
      });
    }

    return res.json({
      success: true,
      leads: rows
    });
  });
});

// Fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});