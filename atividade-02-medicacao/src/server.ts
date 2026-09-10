/**
 * ============================================================
 * Painel de Medicacao - Servidor HTTP
 * ============================================================
 * Isto e um "Hello World": so a rota de saude e o servidor
 * estatico. As quatro rotas da atividade (listar, criar, obter
 * um, remover) ainda nao existem — sao o que voce vai construir.
 */
import express from "express";
import { db } from "./database";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// PASSO 1 — GET /api/medications
//   db.prepare("SELECT ... FROM medication_orders").all()
//   Nao esqueca de traduzir snake_case -> camelCase antes de responder.
// ============================================================
type medicationRow = {
  id: number;
  patient_name: string;
  medication_name: string;
  dosage: string;
  route: string;
  scheduled_at: string;
  notes: string;
};

function toMedicationJson(row: medicationRow) {
  return {
    id: row.id,
    patientName: row.patient_name,
    medicationName: row.medication_name,
    dosage: row.dosage,
    route: row.route,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
  };
}

app.get("/api/medications", (request, response) => {
  const patientName =
    typeof request.query.patientName === "string"
      ? request.query.patientName.trim()
      : "";

  let rows: medicationRow[];
  if (patientName) {
    rows = db
      .prepare(
        `SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes
         FROM medication_orders
         WHERE patient_name LIKE ?
         ORDER BY scheduled_at ASC`
      )
      .all(`%${patientName}%`) as medicationRow[];
  } else {
    rows = db
      .prepare(
        `SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes
         FROM medication_orders
         ORDER BY scheduled_at ASC`
      )
      .all() as medicationRow[];
  }

  response.status(200).json(rows.map(toMedicationJson));
});

// ============================================================
// PASSO 3 — POST /api/medications
//   valide patientName, medicationName, dosage, route, scheduledAt
//   INSERT parametrizado -> responda 201 com o registro criado
// ============================================================
app.post("/api/medications", (request, response) => {
  const { patientName, medicationName, dosage, route, scheduledAt, notes } = request.body;

  if (!patientName || !medicationName || !dosage || !route || !scheduledAt) {
    return response.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
  }


  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!isoDateTimeRegex.test(scheduledAt)) {
    return response.status(400).json({ error: "Horário previsto deve estar no formato AAAA-MM-DDTHH:MM." });
  }

  const stmt = db.prepare(`
    INSERT INTO medication_orders (patient_name, medication_name, dosage, route, scheduled_at, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    patientName.trim(),
    medicationName.trim(),
    dosage.trim(),
    route,
    scheduledAt,
    notes ? notes.trim() : null
  );


  const newRow = db
    .prepare("SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes FROM medication_orders WHERE id = ?")
    .get(result.lastInsertRowid) as medicationRow;

  return response.status(201).json(toMedicationJson(newRow));
});

// ============================================================
// PASSO 4 — GET /api/medications/:id
//   db.prepare("SELECT ... WHERE id = ?").get(id)
//   undefined -> 404
// ============================================================
app.get("/api/medications/:id", (request, response) => {
  const id = Number(request.params.id);
  const row = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes FROM medication_orders WHERE id = ?`
    )
    .get(id) as medicationRow | undefined;
  if (!row) {
    return response.status(404).json({ error: "Prescrição não encontrada." });
  }
  return response.status(200).json(toMedicationJson(row));
});
// ============================================================
// PASSO 5 — DELETE /api/medications/:id
//   db.prepare("DELETE FROM medication_orders WHERE id = ?").run(id)
//   responda 204, sem corpo
// ============================================================
app.delete("/api/medications/:id", (request, response) => {
  const id = Number(request.params.id);
  const result = db.prepare("DELETE FROM medication_orders WHERE id = ?").run(id);
  if (result.changes === 0) {
    return response.status(404).json({ error: "Prescrição não encontrada." });
  }
  // 204: Sucesso sem corpo
  return response.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Painel de Medicacao no ar em http://localhost:${PORT}`);
});
