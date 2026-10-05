/**
 * ============================================================
 * ORQUESTRAÇÃO
 * ------------------------------------------------------------
 * Este arquivo é o maestro. Ele não guarda estado e não desenha
 * nada sozinho. Ele apenas:
 *
 *   1. liga eventos do usuário às AÇÕES do estado
 *   2. manda a tela ser redesenhada quando o estado muda
 *   3. dispara a carga inicial dos dados
 *
 * O fluxo é sempre o mesmo, e sempre em um sentido só:
 *
 *   evento  ->  ação  ->  estado  ->  render  ->  tela
 *
 * Nunca o contrário. A tela nunca é a fonte da verdade.
 * ============================================================
 */
import { listPatients, createPatient, getPatient, getEncounters, createEncounter } from "./api.js";
import { subscribe, getState, setPatients, setSearchTerm, setOnlyActive, setError, setSelectedPatient, clearSelectedPatient, addEncounter} from "./state.js";
import { renderPatientList, renderCounter, renderLoading, renderError, renderPatientDetailHeader, renderEncounterList } from "./render.js";

/* --- Os elementos que existem na página. Buscamos UMA vez. --- */
const searchInput = document.querySelector("#search-input");
const onlyActiveInput = document.querySelector("#only-active-input");
const patientListElement = document.querySelector("#patient-list");
const resultCounterElement = document.querySelector("#result-counter");
const patientForm = document.getElementById("patient-form");

//elementos para controle de tela e atendimentos:
const patientsView = document.querySelector("#patients-view");
const encountersView = document.querySelector("#encounters-view");
const btnBack = document.querySelector("#btn-back");
const patientDetailHeader = document.querySelector("#patient-detail-header");
const encounterListElement = document.querySelector("#encounter-list");
const encounterForm = document.querySelector("#encounter-form");
const encounterErrorElement = document.querySelector("#encounter-error");

/**
 * A ÚNICA função que desenha a tela inteira.
 * Ela é chamada toda vez que o estado muda — e apenas por isso.
 */
function renderApp(state) {
  // Se houver um paciente selecionado, mostramos a tela de atendimentos
  if (state.selectedPatient) {
    patientsView.classList.add("d-none");
    encountersView.classList.remove("d-none");

    renderPatientDetailHeader(state.selectedPatient, patientDetailHeader);
    renderEncounterList(state.encounters, encounterListElement);
    return;
  }
  // Caso contrário, mostramos a lista de pacientes
  patientsView.classList.remove("d-none");
  encountersView.classList.add("d-none");

  if (state.errorMessage) {
    renderError(state.errorMessage, patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  if (state.isLoading) {
    renderLoading(patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  renderPatientList(state.visiblePatients, state.searchTerm, patientListElement);
  renderCounter(state.visiblePatients.length, state.patients.length, resultCounterElement);
}


/* --- Eventos do usuário viram AÇÕES, nunca alterações de DOM --- */
searchInput.addEventListener("input", (event) => {
  setSearchTerm(event.target.value);
});

onlyActiveInput.addEventListener("change", (event) => {
  setOnlyActive(event.target.checked);
});

if (patientForm) {
  patientForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const patientData = {
      name: document.getElementById("name").value,
      birthDate: document.getElementById("birthDate").value,
      nationalId: document.getElementById("nationalId").value
    };

    try {
      await createPatient(patientData);

      patientForm.reset();

      const updatedPatients = await listPatients();
      setPatients(updatedPatients);

      alert("Paciente cadastrado com sucesso!");

    } catch (error) {
      alert("Erro: " + error.message);
    }
  });
}

if (encounterForm) {
  encounterForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Esconde mensagem de erro anterior
    encounterErrorElement.classList.add("d-none");
    encounterErrorElement.textContent = "";

    const state = getState();
    if (!state.selectedPatient) return;

    const encounterData = {
      startedAt: document.querySelector("#encounter-startedAt").value,
      chiefComplaint: document.querySelector("#encounter-complaint").value,
      notes: document.querySelector("#encounter-notes").value,
    };

    try {
      // Chama api.js (nenhum fetch feito aqui!)
      const novoAtendimento = await createEncounter(state.selectedPatient.id, encounterData);

      // Limpa os campos do formulário
      encounterForm.reset();

      // Atualiza o estado. Como usamos notify(), o render.js vai redesenhar a lista na hora!
      addEncounter(novoAtendimento);

    } catch (error) {
      // Mostra amigavelmente o erro vindo do backend
      encounterErrorElement.textContent = error.message;
      encounterErrorElement.classList.remove("d-none");
    }
  });
}



/* --- Sempre que o estado mudar, a tela é redesenhada --- */
subscribe(renderApp);
/* Clique no botão "Ver Atendimentos" via delegação de eventos */
patientListElement.addEventListener("click", async (event) => {
  const target = event.target.closest(".btn-detalhes");
  if (!target) return;

  const patientId = target.dataset.id;

  try {
    // Busca os dados do paciente e seus atendimentos via api.js
    const [patient, encounters] = await Promise.all([
      getPatient(patientId),
      getEncounters(patientId),
    ]);

    setSelectedPatient(patient, encounters);

  } catch (error) {
    alert("Erro ao abrir atendimentos: " + error.message);
    return;
  }
});

/* Clique no botão "Voltar" */
btnBack.addEventListener("click", () => {
  clearSelectedPatient();
});

/* --- Carga inicial --- */
async function start() {
  renderApp(getState());

  try {
    const patients = await listPatients();
    setPatients(patients);
  } catch (error) {
    setError(error.message);
  }
}

start();
