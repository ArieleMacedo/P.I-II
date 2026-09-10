/**
 * ============================================================
 * ORQUESTRAÇÃO
 * ------------------------------------------------------------
 * evento -> ação -> estado -> render -> tela. Sempre nesse sentido.
 * ============================================================
*/
import {
  subscribe,
  getState,
  setMedications,
  setError,
  addMedication,
  selectMedication,
  clearSelection,
  setDetailError,
  removeMedicationFromState,
} from "./state.js";
import {
  renderCounter,
  renderLoading,
  renderError,
  renderMedicationList,
  renderDetail,
} from "./render.js";
import {
  listMedications,
  createMedication,
  getMedication,
  removeMedication,
} from "./api.js";


const medicationListElement = document.querySelector("#medication-list");
const resultCounterElement = document.querySelector("#result-counter");
const detailPanelElement = document.querySelector("#detail-panel");

const patientNameInput = document.querySelector("#patient-name-input");
const medicationNameInput = document.querySelector("#medication-name-input");
const dosageInput = document.querySelector("#dosage-input");
const routeInput = document.querySelector("#route-input");
const scheduledAtInput = document.querySelector("#scheduled-at-input");
const notesInput = document.querySelector("#notes-input");
const saveButton = document.querySelector("#save-button");
const formFeedbackElement = document.querySelector("#form-feedback");

/** A única função que desenha a tela inteira. */
function renderApp(state) {
  if (state.errorMessage) {
    renderError(state.errorMessage, medicationListElement);
    resultCounterElement.textContent = "";
    return;
  }
  if (state.isLoading) {
    renderLoading(medicationListElement);
    resultCounterElement.textContent = "";
    return;
  }

  // PASSO 2: chame renderMedicationList aqui
  renderMedicationList(state.medications, medicationListElement);
  // PASSO 4: chame renderDetail(state, detailPanelElement) aqui
  renderDetail(state, detailPanelElement);

  renderCounter(state.medications.length, resultCounterElement);
}

subscribe(renderApp);

// ============================================================
// PASSO 2 — carga inicial
async function start() {
  renderApp(getState());
  try {
    const medications = await listMedications();
    setMedications(medications);
  } catch (error) {
    setError(error.message);
  }
}
start();
// ============================================================


// ============================================================
// PASSO 3 — clique em "Cadastrar prescrição"
//   ler os inputs, chamar createMedication(), addMedication(),
//   limpar o formulário, mostrar feedback de sucesso/erro
// ============================================================
saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;

  // Limpa feedback anterior
  formFeedbackElement.textContent = "";
  formFeedbackElement.className = "med-form__feedback";

  // 1. Lê os valores dos inputs
  const payload = {
    patientName: patientNameInput.value.trim(),
    medicationName: medicationNameInput.value.trim(),
    dosage: dosageInput.value.trim(),
    route: routeInput.value,
    scheduledAt: scheduledAtInput.value,
    notes: notesInput.value.trim() || null,
  };

  try {
    // 2. Envia para o servidor e recebe o objeto com ID
    const created = await createMedication(payload);
    // 3. Atualiza o estado (a tela atualiza automaticamente via notify)
    addMedication(created);
    // 4. Limpa o formulário
    patientNameInput.value = "";
    medicationNameInput.value = "";
    dosageInput.value = "";
    scheduledAtInput.value = "";
    notesInput.value = "";
    // 5. Exibe mensagem de sucesso
    formFeedbackElement.textContent = "Prescrição cadastrada com sucesso!";
    formFeedbackElement.classList.add("med-form__feedback--success");
  } catch (error) {
    // Exibe mensagem de erro devolvida pelo servidor
    formFeedbackElement.textContent = error.message;
    formFeedbackElement.classList.add("med-form__feedback--error");
  } finally {
    saveButton.disabled = false;
  }
});


// ============================================================
// PASSO 4 — clique num cartão da lista (delegação de evento no <ul>)
//   event.target.closest('[data-medication-id]') -> selectMedication(id)
//   -> buscar o detalhe com getMedication(id) -> tratar 404
// ============================================================

medicationListElement.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-medication-id]");
  if (!card) return;
  const id = Number(card.dataset.medicationId);
  selectMedication(id);
  try {
    await getMedication(id);
  } catch (error) {
    setDetailError(error.message);
  }
});

// ============================================================
// PASSO 4 & 5 — cliques dentro do painel de detalhe (Fechar e Suspender)
//   (delegação de evento no #detail-panel, já que ele é redesenhado)
// ============================================================
detailPanelElement.addEventListener("click", async (event) => {
  // Fechar o painel
  if (event.target.id === "close-button" || event.target.closest("#close-button")) {
    clearSelection();
    return;
  }

  // Suspender prescrição
  const button = event.target.closest("#remove-button");
  if (!button) return;
  const { selectedId } = getState();
  if (!selectedId) return;
  try {
    await removeMedication(selectedId);
    removeMedicationFromState(selectedId);
  } catch (error) {
    setDetailError(error.message);
  }
});
