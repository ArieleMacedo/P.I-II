/**
 * ============================================================
 * CAMADA DE COMUNICAÇÃO
 * ------------------------------------------------------------
 * Este é o ÚNICO arquivo do frontend autorizado a chamar `fetch`.
 *
 * Por quê? Porque no dia em que a URL mudar, o servidor exigir
 * um cabeçalho de autenticação, ou o formato do erro mudar, você
 * quer abrir UM arquivo — não caçar `fetch` espalhado em cinco.
 *
 * Ninguém aqui fora precisa saber que existe HTTP. Quem chama
 * `listPatients()` recebe uma lista de pacientes. Ponto.
 * ============================================================
 */

/**
 * A fonte dos dados.
 *
 * ENCONTRO 1: apontamos para um arquivo JSON estático.
 * ENCONTRO 2: trocaremos por "/api/patients" — e nada mais no
 * frontend vai precisar mudar. Guarde essa promessa.
 */

export async function listPatients() {
  const response = await fetch(`/api/patients`);

  if (!response.ok) {
    throw new Error(`Não foi possível carregar os pacientes (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Busca um paciente específico.
 * @param {number} id
 */
export async function getPatient(id) {
  const response = await fetch(`/api/patients/${id}`);

  if (response.status === 404) {
    throw new Error("Paciente não encontrado.");
  }
  if (!response.ok) {
    throw new Error(`Falha ao buscar o paciente (HTTP ${response.status})`);
  }

  return response.json();
}

/* ============================================================
   TODO API-1 (Encontro 2, Prática 2)
   Implemente `createPatient(patient)`.

   Precisa de três coisas que o GET não precisava:
     1. method: "POST"
     2. headers: { "Content-Type": "application/json" }
     3. body: JSON.stringify(patient)

   E o tratamento de erro é diferente: quando o servidor devolve
   400, ele manda junto uma mensagem útil no corpo. Leia essa
   mensagem e repasse para quem chamou, em vez de inventar um
   texto genérico.
   ============================================================ */

export async function createPatient(patient) {
  try {
    const response = await fetch(`/api/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patient)
    });
    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(errorData.error || 'Erro ao cadastrar paciente');
    }
    const createdPatient = await response.json();
    return createdPatient;
  } catch (error) {
    throw error;
  }
}

export async function getEncounters(id) {
  const response = await fetch(`/api/patients/${id}/encounters`);

  if (response.status === 404) {
    throw new Error("Paciente não encontrado.");
  }
  if (!response.ok) {
    throw new Error(`Falha ao buscar o paciente (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Registra um novo atendimento para o paciente.
 * Se o backend devolver erro (status 400 ou 404), captura a mensagem do JSON.
 */
export async function createEncounter(patientId, encounterData) {
  const response = await fetch(`/api/patients/${patientId}/encounters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(encounterData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Erro ao registrar atendimento (HTTP ${response.status})`);
  }

  return response.json();
}
