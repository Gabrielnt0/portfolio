import { getPublicBuilderSettings } from "../services/portfolio-api.js";

const DEFAULT_SECTION_IDS = [
    "inicio", "sobre", "trajetoria", "competencias",
    "projetos", "formacao", "curriculo", "contato"
];

function getSectionElement(id) {
    if (id === "curriculo") {
        const resume = document.querySelector("main .resume");
        if (resume) resume.id = "curriculo";
        return resume;
    }
    return document.getElementById(id);
}

function normalizeSections(value) {
    if (!Array.isArray(value)) {
        return DEFAULT_SECTION_IDS.map((id) => ({ id, enabled: true }));
    }
    const known = new Map(value.map((item) => [item?.id, item]));
    const ordered = value
        .filter((item) => DEFAULT_SECTION_IDS.includes(item?.id))
        .map((item) => ({ id: item.id, enabled: item.enabled !== false }));
    DEFAULT_SECTION_IDS.forEach((id) => {
        if (!known.has(id)) ordered.push({ id, enabled: true });
    });
    return ordered;
}

function applySectionStructure(sections) {
    const main = document.querySelector("main");
    if (!main) return;

    sections.forEach(({ id, enabled }) => {
        const element = getSectionElement(id);
        if (!element) return;
        element.hidden = !enabled;
        element.dataset.builderVisible = String(enabled);
        main.appendChild(element);

        document.querySelectorAll(`a[href="#${id}"]`).forEach((link) => {
            link.hidden = !enabled;
            link.setAttribute("aria-hidden", String(!enabled));
        });
    });
}

function applyBuilderClasses(settings) {
    const root = document.documentElement;
    const body = document.body;
    [
        "builder-hero-split", "builder-hero-centered", "builder-hero-fullscreen",
        "builder-cards-flat", "builder-cards-rounded", "builder-cards-glass", "builder-cards-outline",
        "builder-buttons-square", "builder-buttons-rounded", "builder-buttons-pill", "builder-buttons-outline",
        "builder-navbar-solid", "builder-navbar-transparent", "builder-navbar-blur",
        "builder-container-compact", "builder-container-wide", "builder-container-full"
    ].forEach((className) => body.classList.remove(className));

    body.classList.add(`builder-hero-${settings.hero_layout || "split"}`);
    body.classList.add(`builder-cards-${settings.card_style || "rounded"}`);
    body.classList.add(`builder-buttons-${settings.button_style || "rounded"}`);
    body.classList.add(`builder-navbar-${settings.navbar_style || "solid"}`);
    body.classList.add(`builder-container-${settings.container_width || "wide"}`);
    root.dataset.builderReady = "true";
}

async function initializeBuilder() {
    try {
        const settings = await getPublicBuilderSettings();
        applyBuilderClasses(settings || {});
        applySectionStructure(normalizeSections(settings?.sections));
        window.dispatchEvent(new CustomEvent("onront:builder-ready", { detail: settings }));
    } catch (error) {
        console.warn("ONRONT Site Builder: usando estrutura padrão.", error);
        applySectionStructure(normalizeSections(null));
    }
}

initializeBuilder();
