-- ============================================================
-- Mini-Prontuario - Esquema do banco
-- Vocabulario inspirado em HL7 FHIR (Patient, Encounter)
-- ============================================================

-- A ordem do DROP importa: filho antes do pai (chave estrangeira).
DROP TABLE IF EXISTS encounters;
DROP TABLE IF EXISTS patients;

-- ------------------------------------------------------------
-- patients  ->  o paciente cadastrado no prontuario
-- ------------------------------------------------------------
CREATE TABLE patients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  birth_date  TEXT    NOT NULL, 
  national_id TEXT    NOT NULL UNIQUE,
  active      INTEGER NOT NULL DEFAULT 1   
);

-- ------------------------------------------------------------
-- TODO ATIVIDADE 1 - crie aqui a tabela `encounters`.
-- 
CREATE TABLE encounters(
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id        INTEGER NOT NULL,
  started_at        TEXT    NOT NULL,
  chief_complaint   TEXT    NOT NULL,
  notes             TEXT
);

