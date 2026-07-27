import { getPublishedEducation } from "../services/portfolio-api.js";

const educationGrid = document.querySelector("#education-grid");

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMonthYear(dateValue) {
    if (!dateValue) return "";

    return new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(`${dateValue}T00:00:00Z`));
}

function buildPeriod(item) {
    const start = formatMonthYear(item.start_date);
    const end = item.is_current
        ? "Atualmente"
        : formatMonthYear(item.end_date);

    if (start && end) return `${start} — ${end}`;
    return start || end;
}

function buildSubtitle(item) {
    return [item.institution, item.location]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" • ");
}

function createEducationCard(item) {
    const title = item.degree || item.field_of_study || "Formação";
    const field = item.degree && item.field_of_study
        ? `<p>${escapeHtml(item.field_of_study)}</p>`
        : "";
    const subtitle = buildSubtitle(item);
    const period = buildPeriod(item);
    const description = item.description
        ? `<p>${escapeHtml(item.description)}</p>`
        : "";
    const credential = item.credential_url
        ? `
            <a
                href="${escapeHtml(item.credential_url)}"
                class="education-link"
                target="_blank"
                rel="noopener noreferrer"
            >
                Ver certificado
            </a>
        `
        : "";

    return `
        <article class="education-card">
            <span class="education-icon" aria-hidden="true">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m2 10 10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 2 9 2 12 0v-5"></path>
                    <path d="M22 10v6"></path>
                </svg>
            </span>

            <div>
                <span class="education-type">
                    ${item.featured ? "Formação em destaque" : "Formação acadêmica"}
                </span>

                <h3>${escapeHtml(title)}</h3>
                ${field}
                ${subtitle ? `<p><strong>${subtitle}</strong></p>` : ""}
                ${period ? `<p>${escapeHtml(period)}</p>` : ""}
                ${description}
                ${credential}
            </div>
        </article>
    `;
}

async function loadEducation() {
    if (!educationGrid) return;

    try {
        const educationItems = await getPublishedEducation();

        // A estrutura estática atual permanece como fallback enquanto não houver
        // registros publicados ou enquanto a configuração ainda não estiver pronta.
        if (!Array.isArray(educationItems) || educationItems.length === 0) {
            return;
        }

        educationGrid.innerHTML = educationItems
            .map(createEducationCard)
            .join("");

        educationGrid
            .querySelectorAll(".education-card")
            .forEach((card) => {
                card.classList.add("reveal", "is-visible");
            });
    } catch (error) {
        console.warn(
            "Não foi possível carregar a formação pelo CMS. O conteúdo estático foi mantido.",
            error
        );
    }
}

loadEducation();
