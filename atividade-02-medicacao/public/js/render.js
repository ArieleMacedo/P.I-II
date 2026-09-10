/**
 * ============================================================
 * RENDERIZAÇÃO
 * ------------------------------------------------------------
 * Desenha o estado na tela. Não decide nada. Mesmo padrão do
 * Mini-Prontuário.
 * ============================================================
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateTime(isoDateTime) {
  const [datePart, timePart] = isoDateTime.split("T");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year} às ${timePart}`;
}

function medicationCardTemplate(med) {
  return `
    <li class="medication-card" data-medication-id="${med.id}" role="button" tabindex="0">
      <h2 class="medication-card__name">${escapeHtml(med.medicationName)} — ${escapeHtml(med.dosage)}</h2>
      <p class="medication-card__meta">${escapeHtml(med.patientName)}</p>
      <p class="medication-card__meta">${escapeHtml(med.route)} · ${formatDateTime(med.scheduledAt)}</p>
    </li>
  `;
}

function emptyStateTemplate() {
  return `
    <li>
      <div class="empty-state">
        <p class="empty-state__title">Nada por aqui</p>
        <p class="m-0">Nenhuma prescrição cadastrada ainda.</p>
      </div>
    </li>
  `;
}

// ============================================================
// PASSO 2 — implemente renderMedicationList(medications, container)
//   vazio -> emptyStateTemplate(); senão -> map + join('') com medicationCardTemplate
// ============================================================
export function renderMedicationList(medications, container) {
  if (medications.length === 0) {
    container.innerHTML = emptyStateTemplate();
    return;
  }
  container.innerHTML = medications
    .map(medicationCardTemplate)
    .join('')
}

export function renderCounter(count, container) {
  container.textContent = `${count} prescrição(ões) no painel`;
}

export function renderLoading(container) {
  container.innerHTML = `<li><div class="empty-state"><p class="empty-state__title">Carregando…</p></div></li>`;
}

export function renderError(message, container) {
  container.innerHTML = `<li><div class="empty-state"><p class="empty-state__title">Algo deu errado</p><p class="m-0">${escapeHtml(message)}</p></div></li>`;
}

// ============================================================
// PASSO 4 — implemente renderDetail(state, container)
//   sem selectedMedication -> container.hidden = true; container.innerHTML = ""
//   com selectedMedication -> desenhe nome, paciente, dosagem, via, horário,
//   observações (se houver) e um botão <button id="remove-button">Suspender</button>
//   dica: veja o padrão renderDetail do Mini-Prontuário (gabarito da Atividade 01)
// ============================================================
export function renderDetail(state, container) {
  if (state.detailErrorMessage) {
    container.hidden = false;
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <p class="text-danger m-0">${escapeHtml(state.detailErrorMessage)}</p>
        <button id="close-button" class="btn btn-outline-secondary btn-sm" type="button">Fechar</button>
      </div>
    `;
    return;
  }
  const med = state.selectedMedication;
  if (!med) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h2 class="h4 mb-1">${escapeHtml(med.medicationName)} — ${escapeHtml(med.dosage)}</h2>
        <p class="text-muted mb-0">Paciente: <strong>${escapeHtml(med.patientName)}</strong></p>
      </div>
      <div class="d-flex gap-2">
        <button id="close-button" class="btn btn-outline-secondary btn-sm" type="button">Fechar</button>
        <button id="remove-button" class="btn btn-outline-danger btn-sm" data-medication-id="${med.id}">
          Suspender
        </button>
      </div>
    </div>
    <div class="mb-2">
      <strong>Via:</strong> ${escapeHtml(med.route)}
    </div>
    <div class="mb-2">
      <strong>Horário previsto:</strong> ${formatDateTime(med.scheduledAt)}
    </div>
    ${
      med.notes
        ? `<div class="mb-2"><strong>Observações:</strong> ${escapeHtml(med.notes)}</div>`
        : ""
    }
  `;
}