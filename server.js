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
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Criar pasta uploads se não existir
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração upload
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

  // 🔐 ADMIN DEFINITIVO
  db.run(`
    INSERT OR REPLACE INTO admins (id, usuario, senha)
    VALUES (
      COALESCE((SELECT id FROM admins WHERE usuario = 'rbytes.systems'), NULL),
      'rbytes.systems',
      'Gvs0047*83@83'
    )
  `, (err) => {
    if (err) {
      console.log("Erro admin:", err.message);
    } else {
      console.log("Admin pronto: rbytes.systems");
    }
  });

});

// ROTAS

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Página admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// LOGIN ADMIN
app.post("/api/admin/login", (req, res) => {
  const { usuario, senha } = req.body;

  db.get(
    `SELECT * FROM admins WHERE usuario=? AND senha=?`,
    [usuario, senha],
    (err, row) => {
      if (!row) {
        return res.json({ success: false, message: "Login inválido" });
      }

      res.json({ success: true });
    }
  );
});

// CADASTRAR PROJETO
app.post("/api/admin/projetos", upload.single("imagem"), (req, res) => {

  const codigo = "RB-" + Math.floor(Math.random() * 999999);
  const senha = Math.random().toString(36).slice(-6).toUpperCase();

  const imagem = req.file ? "/uploads/" + req.file.filename : null;

  db.run(`
    INSERT INTO projetos 
    (codigo, senha, cliente, nomeProjeto, status, progresso, etapaAtual, previsaoEntrega, observacoes, imagem)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `,
    [
      codigo,
      senha,
      req.body.cliente,
      req.body.nomeProjeto,
      req.body.status,
      req.body.progresso,
      req.body.etapaAtual,
      req.body.previsaoEntrega,
      req.body.observacoes,
      imagem
    ],
    function () {
      res.json({
        success: true,
        codigo,
        senha
      });
    }
  );
});

// LISTAR PROJETOS
app.get("/api/admin/projetos", (req, res) => {
  db.all(`SELECT * FROM projetos`, (err, rows) => {
    res.json({ projetos: rows });
  });
});

// ADICIONAR TIMELINE
app.post("/api/admin/timeline", (req, res) => {
  db.run(`
    INSERT INTO timeline (projeto_id, etapa, descricao, data)
    VALUES (?,?,?,?)
  `,
    [req.body.projeto_id, req.body.etapa, req.body.descricao, req.body.data],
    () => res.json({ success: true })
  );
});

// CONSULTAR PROJETO (CLIENTE)
app.post("/api/acompanhar", (req, res) => {

  db.get(`
    SELECT * FROM projetos WHERE codigo=? AND senha=?
  `,
    [req.body.codigo, req.body.senha],
    (err, projeto) => {

      if (!projeto) return res.json({ success: false });

      db.all(`
        SELECT * FROM timeline WHERE projeto_id=?
      `,
        [projeto.id],
        (err, timeline) => {
          res.json({ success: true, projeto, timeline });
        });
    });
});

// SALVAR ORÇAMENTO
app.post("/api/orcamento", (req, res) => {

  db.run(`
    INSERT INTO leads (nome, whatsapp, empresa, servico, mensagem, data)
    VALUES (?,?,?,?,?,?)
  `,
    [
      req.body.nome,
      req.body.whatsapp,
      req.body.empresa,
      req.body.servico,
      req.body.mensagem,
      new Date().toLocaleString()
    ],
    () => res.json({ success: true })
  );
});

// LISTAR LEADS
app.get("/api/admin/leads", (req, res) => {
  db.all(`SELECT * FROM leads`, (err, rows) => {
    res.json({ leads: rows });
  });
});

// Fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});