/**
 * ============================================================
 * RENDERIZAÇÃO
 * ------------------------------------------------------------
 * Este arquivo desenha o estado na tela. E só isso.
 *
 * REGRA DE OURO: aqui não se DECIDE nada.
 * Não se filtra, não se ordena, não se calcula regra de negócio.
 * Ele recebe o que deve aparecer e coloca na tela.
 *
 * Um bom `render` é burro de propósito. Toda a inteligência
 * mora no estado.
 * ============================================================
 */

/* ------------------------------------------------------------
   SEGURANÇA - por que escapar o texto?
   ------------------------------------------------------------
   Vamos montar HTML com `innerHTML`. Se o nome de um paciente
   fosse `<img src=x onerror="alert(1)">`, o navegador executaria
   esse código. Isso se chama XSS.
   Escapar significa: transformar caractere de marcação em texto.
   Voltaremos a isso com calma em OWASP Top 10.
   ------------------------------------------------------------ */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** 1991-03-14  ->  14/03/1991 */
function formatDate(isoDate) {
  if(!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** Monta o HTML de UM cartão de paciente. */
function patientCardTemplate(patient) {
  const cardModifier = patient.active ? "" : " patient-card--inactive";
  const badgeModifier = patient.active ? "status-badge--active" : "status-badge--inactive";
  const badgeLabel = patient.active ? "Ativo" : "Inativo";

  return `
    <li class="patient-card${cardModifier}">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <h2 class="patient-card__name">${escapeHtml(patient.name)}</h2>
        <span class="status-badge ${badgeModifier}">${badgeLabel}</span>
      </div>
      <p class="patient-card__meta">
        Nascimento: ${formatDate(patient.birthDate)}
      </p>
      <p class="patient-card__meta patient-card__id">
        CNS ${escapeHtml(patient.nationalId)} . #${patient.id}
      </p>
      <div class="mt-3">
      <button class="btn-detalhes" data-id="${patient.id}">
        Ver Atendimentos
      </button>
    </div>
    </li>
  `;
}

/** Tela de "nada encontrado". */
function emptyStateTemplate(searchTerm) {
  const complement = searchTerm
    ? `Nenhum paciente corresponde a “${escapeHtml(searchTerm)}”.`
    : "Nenhum paciente cadastrado ainda.";

  return `
    <li>
      <div class="empty-state">
        <p class="empty-state__title">Nada por aqui</p>
        <p class="m-0">${complement}</p>
      </div>
    </li>
  `;
}

export function renderPatientList(patients, searchTerm, container) {
  if (patients.length === 0) {
    container.innerHTML = emptyStateTemplate(searchTerm);
    return;
  }
  container.innerHTML = patients.map(patientCardTemplate).join('');
}

/** Atualiza o contador de resultados. */
export function renderCounter(visibleCount, totalCount, container) {
  container.textContent =
    visibleCount === totalCount
      ? `${totalCount} paciente(s) no prontuário`
      : `${visibleCount} de ${totalCount} paciente(s)`;
}

/** Mensagem enquanto os dados não chegaram. */
export function renderLoading(container) {
  container.innerHTML = `
    <li>
      <div class="empty-state">
        <p class="empty-state__title">Carregando…</p>
        <p class="m-0">Buscando os pacientes.</p>
      </div>
    </li>
  `;
}

/** Mensagem quando a comunicação falhou. */
export function renderError(message, container) {
  container.innerHTML = `
    <li>
      <div class="empty-state">
        <p class="empty-state__title">Algo deu errado</p>
        <p class="m-0">${escapeHtml(message)}</p>
      </div>
    </li>
  `;
}

/** Formata ISO datetime (AAAA-MM-DDTHH:MM) para formato amigável */
function formatDateTime(isoString) {
  if (!isoString) return "";
  const [datePart, timePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year} às ${timePart}`;
}

export function renderPatientDetailHeader(patient, container) {
  container.innerHTML = `
    <div class="patient-card">
      <h2 class="patient-card__name mb-1">${escapeHtml(patient.name)}</h2>
      <p class="patient-card__meta mb-1">
        <strong>Nascimento:</strong> ${formatDate(patient.birthDate)} | 
        <strong>Documento:</strong> ${escapeHtml(patient.nationalId)}
      </p>
      <span class="status-badge ${patient.active ? "status-badge--active" : "status-badge--inactive"}">
        ${patient.active ? "Paciente Ativo" : "Paciente Inativo"}
      </span>
    </div>
  `;
}

function encounterItemTemplate(encounter) {
  return `
    <li class="encounter-item card mb-3 p-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <time class="encounter-item__date text-muted small">
          ${formatDateTime(encounter.startedAt)}
        </time>
        <span class="badge bg-light text-dark">#${encounter.id}</span>
      </div>
      <h3 class="encounter-item__title h6 mb-2">
        <strong>Queixa:</strong> ${escapeHtml(encounter.chiefComplaint)}
      </h3>
      ${encounter.notes
      ? `<p class="encounter-item__notes text-secondary mb-0 small"><strong>Conduta:</strong> ${escapeHtml(encounter.notes)}</p>`
      : ""
    }
    </li>
  `;
}

export function renderEncounterList(encounters, container) {
  if (!encounters || encounters.length === 0) {
    container.innerHTML = `
      <li>
        <div class="empty-state">
          <p class="empty-state__title">Sem atendimentos</p>
          <p class="m-0">Este paciente ainda não possui atendimentos registrados.</p>
        </div>
      </li>
    `;
    return;
  }
  container.innerHTML = encounters.map(encounterItemTemplate).join("");
}
