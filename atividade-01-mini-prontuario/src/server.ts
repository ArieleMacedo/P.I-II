/**
 * ============================================================
 * Mini-Prontuario - Servidor HTTP
 * ============================================================
 * Esta semana o servidor e PROPOSITALMENTE simples:
 * um unico arquivo, sem camadas, sem arquitetura.
 * O objetivo e enxergar o HTTP acontecendo.
 *
 * A separacao em camadas chega na Semana 03. Ate la, o que
 * queremos e que voce saiba exatamente o que cada linha faz.
 */
import express, { response } from "express";

import { db } from "./database.js";
const app = express();
const PORT = 3000;

// ------------------------------------------------------------
// MIDDLEWARES - executam ANTES das rotas, em ordem
// ------------------------------------------------------------

// Le o corpo da requisicao quando o Content-Type e application/json
// e coloca o resultado em req.body.
// SEM ESTA LINHA, req.body vem `undefined`. Erro numero 1 da turma.
app.use(express.json());

// Serve os arquivos de public/ como conteudo estatico.
// Por isso o frontend e a API vivem na MESMA origem (localhost:3000)
// e nao precisamos falar de CORS ainda.
app.use(express.static("public"));

// ------------------------------------------------------------
// ROTAS
// ------------------------------------------------------------

/** Rota de saude: serve para saber se o servidor esta de pe. */
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// TODO 1 (Encontro 2, Pratica 1)
// GET /api/patients  ->  200 com um ARRAY de pacientes.
// Comece devolvendo um array fixo, escrito na mao. Sem banco ainda.
// ============================================================

app.get("/api/patients", (req, res) => {
  try {
    const patients = db
      .prepare(
        `
      SELECT 
        id, 
        name, 
        birth_date as birthDate, 
        national_id as nationalId, 
        active 
        FROM patients
        ORDER BY name
    `,
      )
      .all();

    if (!patients) {
      return response.status(404).json({ error: "Paciente não encontrado" });
    }

    return res.status(200).json(patients);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: errorMessage });
  }
});

// ============================================================
// TODO 2 (Encontro 2, Pratica 2)
// POST /api/patients
//   - leia req.body
//   - valide: name obrigatorio (texto nao vazio)
//              birthDate obrigatorio no formato AAAA-MM-DD
//              nationalId obrigatorio
//   - se invalido:  400  { "error": "mensagem util" }
//   - se valido:    201  com o paciente criado
// ============================================================
app.post("/api/patients", (req, res) => {
  try {
    const { name, birthDate, nationalId } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "O campo nome é obrigatório" });
    }
    if (!birthDate || birthDate.trim() === "") {
      return res
        .status(400)
        .json({ error: "O campo data de nascimento é obrigatório" });
    }
    if (!nationalId || nationalId.trim() === "") {
      return res
        .status(400)
        .json({ error: "O campo nationalId é obrigatório" });
    }

    const stmt = db.prepare(
      `INSERT INTO patients (name, birth_date, national_id, active) VALUES(?,?,?,1)`,
    );

    const resultado = stmt.run(name, birthDate, nationalId);

    return res.status(201).json({
      id: resultado.lastInsertRowid,
      name,
      birthDate,
      nationalId,
      active: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: errorMessage });
  }
});

// ============================================================
// TODO 3 (Encontro 2, Pratica 3)
// Troque o array em memoria pelo banco:
//   import { db } from "./database";
//   const rows = db.prepare("SELECT ... FROM patients ORDER BY name").all();
// E crie GET /api/patients/:id devolvendo 404 quando nao existir.
// ============================================================
app.get("/api/patients/:id", (req, res) => {
  try {
    const { id } = req.params;

    const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id);

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(404).json({ error: errorMessage });
  }
});
// ------------------------------------------------------------

app.get("/api/patients/:id/encounters", (request, response) => {
  const { id } = request.params;

  // Verifica se o paciente existe
  const patient = db.prepare(`SELECT id FROM patients WHERE id = ?`).get(id);
  if (!patient) {
    return response.status(404).json({ error: "Paciente não encontrado" });
  }

  // Busca os atendimentos do paciente
  const encounters = db
    .prepare(
      `
    SELECT 
      id, 
      patient_id AS patientId, 
      started_at AS startedAt, 
      chief_complaint AS chiefComplaint, 
      notes 
    FROM encounters 
    WHERE patient_id = ?
  `,
    )
    .all(id);

  response.json(encounters);
});

app.post("/api/patients/:id/encounters", (req, res) => {
  try {
    const { id } = req.params;
    const { startedAt, chiefComplaint, notes } = req.body;

    const regexDataTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

    if (!startedAt || !regexDataTime.test(startedAt)) {
      return res.status(400).json({
        error:
          "O campo startedAt é obrigatório e deve estar no formato AAAA-MM-DDTHH:MM",
      });
    }

    const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id);

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    if (!chiefComplaint || chiefComplaint.trim() === "") {
      return res
        .status(400)
        .json({ error: "O campo queixa principal é obrigatório" });
    }

    const stmt = db.prepare(
      `INSERT INTO encounters(patient_id, started_at, chief_complaint, notes) VALUES (?,?,?,?)`,
    );

    const resultado = stmt.run(id, startedAt, startedAt, notes);

    return res.status(201).json({
      id: resultado.lastInsertRowid,
      patientId: Number(id),
      startedAt,
      chiefComplaint,
      notes,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Mini-Prontuario no ar em http://localhost:${PORT}`);
});
