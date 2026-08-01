const SOURCE = "portfolio-cms-visual-editor";
const types = {
    ready: "PREVIEW_READY",
    applySettings: "APPLY_BUILDER_SETTINGS",
    selectSection: "SELECT_SECTION",
    scrollToSection: "SCROLL_TO_SECTION",
    sectionSelected: "SECTION_SELECTED",
};

const SECTION_IDS = [
    "inicio",
    "sobre",
    "trajetoria",
    "formacao",
    "competencias",
    "projetos",
    "curriculo",
    "contato"
];

let selectedSectionId = null;
let selectionOverlay = null;

function isEditorMode() {
    return new URLSearchParams(window.location.search).get("visualEditor") === "1";
}

function post(type, payload = {}) {
    window.parent?.postMessage({ source: SOURCE, type, payload }, "*");
}

function getSection(id) {
    if (id === "curriculo") {
        const section = document.querySelector("main .resume");
        if (section && !section.id) section.id = "curriculo";
        return section;
    }

    return document.getElementById(id);
}

function ensureOverlay() {
    if (selectionOverlay) return selectionOverlay;

    selectionOverlay = document.createElement("div");
    selectionOverlay.id = "portfolio-visual-editor-selection";
    selectionOverlay.innerHTML = `
        <span id="portfolio-visual-editor-label"></span>
    `;
    document.body.appendChild(selectionOverlay);

    return selectionOverlay;
}

function updateOverlay() {
    if (!selectedSectionId) return;

    const section = getSection(selectedSectionId);
    const overlay = ensureOverlay();

    if (!section || section.hidden) {
        overlay.hidden = true;
        return;
    }

    const rectangle = section.getBoundingClientRect();

    overlay.hidden = false;
    overlay.style.left = `${rectangle.left + window.scrollX}px`;
    overlay.style.top = `${rectangle.top + window.scrollY}px`;
    overlay.style.width = `${rectangle.width}px`;
    overlay.style.height = `${rectangle.height}px`;

    const label = overlay.querySelector("#portfolio-visual-editor-label");
    if (label) label.textContent = selectedSectionId;
}

function selectSection(sectionId, notifyParent = false) {
    if (!SECTION_IDS.includes(sectionId)) return;

    selectedSectionId = sectionId;
    updateOverlay();

    if (notifyParent) {
        post(types.sectionSelected, { sectionId });
    }
}

function applyTemporarySettings(settings = {}) {
    window.__portfolioBuilderSettings = settings;

    window.dispatchEvent(
        new CustomEvent("portfolio:builder-ready", { detail: settings })
    );

    // builder.js aplica essas opções. O dispatch também atualiza projetos e skills.
    const sections = Array.isArray(settings.sections) ? settings.sections : [];
    const main = document.querySelector("main");

    if (main) {
        sections.forEach(({ id, enabled }) => {
            const section = getSection(id);
            if (!section) return;

            section.hidden = enabled === false;
            main.appendChild(section);

            document.querySelectorAll(`a[href="#${id}"]`).forEach((link) => {
                link.hidden = enabled === false;
            });
        });
    }

    window.requestAnimationFrame(updateOverlay);
}

function identifySectionFromTarget(target) {
    const section = target.closest("main > section, main .resume");
    if (!section) return null;

    if (section.classList.contains("resume")) return "curriculo";
    return SECTION_IDS.includes(section.id) ? section.id : null;
}

function initialize() {
    if (!isEditorMode() || window.parent === window) return;

    document.documentElement.classList.add("portfolio-visual-editor-mode");

    document.addEventListener(
        "click",
        (event) => {
            const sectionId = identifySectionFromTarget(event.target);
            if (!sectionId) return;

            const interactive = event.target.closest("a, button, input, select, textarea");

            event.preventDefault();
            event.stopPropagation();

            selectSection(sectionId, true);

            if (interactive) interactive.blur?.();
        },
        true
    );

    window.addEventListener("message", (event) => {
        if (event.data?.source !== SOURCE) return;

        const { type, payload = {} } = event.data;

        if (type === types.applySettings) {
            applyTemporarySettings(payload.settings);
        }

        if (type === types.selectSection) {
            selectSection(payload.sectionId);
        }

        if (type === types.scrollToSection) {
            const section = getSection(payload.sectionId);
            selectSection(payload.sectionId);
            section?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    window.addEventListener("resize", updateOverlay, { passive: true });
    window.addEventListener("scroll", updateOverlay, { passive: true });

    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(updateOverlay);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "class", "style"]
    });

    post(types.ready);
}

initialize();
