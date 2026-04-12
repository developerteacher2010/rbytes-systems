const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CONEXÃO CORRIGIDA (LOCAL + RAILWAY)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "postgres", // 🔁 troque se seu banco tiver outro nome
        password: "2026", // ✅ senha como STRING
        port: 5432
      }
);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Pasta de uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({ storage });

// Criar tabelas
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      usuario VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projetos (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) UNIQUE NOT NULL,
      senha VARCHAR(50) NOT NULL,
      cliente VARCHAR(255) NOT NULL,
      nomeProjeto VARCHAR(255) NOT NULL,
      status VARCHAR(255) NOT NULL,
      progresso INTEGER NOT NULL,
      etapaAtual VARCHAR(255) NOT NULL,
      previsaoEntrega VARCHAR(255),
      observacoes TEXT,
      imagem TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS timeline (
      id SERIAL PRIMARY KEY,
      projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
      etapa VARCHAR(255) NOT NULL,
      descricao TEXT NOT NULL,
      data VARCHAR(100) NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(255) NOT NULL,
      empresa VARCHAR(255),
      servico VARCHAR(255),
      mensagem TEXT,
      data VARCHAR(100) NOT NULL
    );
  `);

  await pool.query(`
    INSERT INTO admins (usuario, senha)
    VALUES ('rbytes.systems', 'Gvs0047*83@83')
    ON CONFLICT (usuario) DO UPDATE
    SET senha = EXCLUDED.senha;
  `);

  console.log("✅ Banco inicializado com sucesso.");
}

// Rotas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Login admin
app.post("/api/admin/login", async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    const result = await pool.query(
      "SELECT * FROM admins WHERE usuario = $1 AND senha = $2",
      [usuario, senha]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Login inválido" });
    }

    res.json({ success: true, message: "Login realizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro no login" });
  }
});

// Cadastrar projeto
app.post("/api/admin/projetos", upload.single("imagem"), async (req, res) => {
  try {
    const codigo = "RB-" + Math.floor(100000 + Math.random() * 900000);
    const senha = Math.random().toString(36).slice(-8).toUpperCase();
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;

    const {
      cliente,
      nomeProjeto,
      status,
      progresso,
      etapaAtual,
      previsaoEntrega,
      observacoes
    } = req.body;

    await pool.query(
      `INSERT INTO projetos
      (codigo, senha, cliente, nomeProjeto, status, progresso, etapaAtual, previsaoEntrega, observacoes, imagem)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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
      ]
    );

    res.json({
      success: true,
      message: "Projeto cadastrado com sucesso.",
      codigo,
      senha
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao cadastrar projeto" });
  }
});

// Listar projetos
app.get("/api/admin/projetos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projetos ORDER BY id DESC");
    res.json({ success: true, projetos: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao listar projetos" });
  }
});

// Adicionar timeline
app.post("/api/admin/timeline", async (req, res) => {
  try {
    const { projeto_id, etapa, descricao, data } = req.body;

    await pool.query(
      `INSERT INTO timeline (projeto_id, etapa, descricao, data)
       VALUES ($1,$2,$3,$4)`,
      [projeto_id, etapa, descricao, data]
    );

    res.json({ success: true, message: "Etapa adicionada com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao adicionar etapa" });
  }
});

// Consulta cliente
app.post("/api/acompanhar", async (req, res) => {
  try {
    const { codigo, senha } = req.body;

    const projetoResult = await pool.query(
      "SELECT * FROM projetos WHERE codigo = $1 AND senha = $2",
      [codigo, senha]
    );

    if (projetoResult.rows.length === 0) {
      return res.json({ success: false, message: "Projeto não encontrado" });
    }

    const projeto = projetoResult.rows[0];

    const timelineResult = await pool.query(
      "SELECT * FROM timeline WHERE projeto_id = $1 ORDER BY id DESC",
      [projeto.id]
    );

    res.json({
      success: true,
      projeto,
      timeline: timelineResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao consultar projeto" });
  }
});

// Salvar orçamento
app.post("/api/orcamento", async (req, res) => {
  try {
    const { nome, whatsapp, empresa, servico, mensagem } = req.body;

    await pool.query(
      `INSERT INTO leads (nome, whatsapp, empresa, servico, mensagem, data)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        nome,
        whatsapp,
        empresa || "",
        servico || "",
        mensagem || "",
        new Date().toLocaleString("pt-BR")
      ]
    );

    res.json({ success: true, message: "Orçamento enviado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erro ao salvar orçamento" });
  }
});

// Listar leads
app.get("/api/admin/leads", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM leads ORDER BY id DESC");
    res.json({
      success: true,
      leads: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar leads"
    });
  }
});
// Fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Inicialização
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao iniciar banco:", err);
    process.exit(1);
  });