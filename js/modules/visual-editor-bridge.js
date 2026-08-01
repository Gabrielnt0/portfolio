const SOURCE = "portfolio-cms-visual-editor";
const types = {
    ping: "PREVIEW_PING",
    ready: "PREVIEW_READY",
    applySettings: "APPLY_BUILDER_SETTINGS",
    applyProfile: "APPLY_PROFILE_DRAFT",
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
let parentOrigin = "*";

function isEditorMode() {
    return new URLSearchParams(window.location.search).get("visualEditor") === "1";
}

function post(type, payload = {}) {
    window.parent?.postMessage(
        { source: SOURCE, type, payload },
        parentOrigin
    );
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
    window.requestAnimationFrame(updateOverlay);

    if (notifyParent) {
        post(types.sectionSelected, { sectionId });
    }
}

function applyTemporarySettings(settings = {}) {
    window.__portfolioBuilderSettings = settings;

    window.dispatchEvent(
        new CustomEvent("portfolio:builder-ready", { detail: settings })
    );

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

function setDraftText(selector, value) {
    const element = document.querySelector(selector);
    if (!element) return;

    element.textContent = value || "";
}

function setDraftLink(selector, value, prefix = "") {
    const element = document.querySelector(selector);
    if (!element) return;

    const normalized = String(value || "").trim();

    if (!normalized) {
        element.removeAttribute("href");
        element.hidden = true;
        return;
    }

    element.href = prefix ? `${prefix}${normalized}` : normalized;
    element.hidden = false;
}

function applyProfileDraft(profile = {}) {
    setDraftText("#profile-name", profile.fullName);
    setDraftText("#profile-title", profile.professionalTitle);
    setDraftText("#profile-short-bio", profile.shortBio);
    setDraftText("#profile-location", profile.location);
    setDraftText(
        "#profile-availability",
        profile.availableForWork
            ? "Disponível para oportunidades e projetos"
            : "Indisponível para novos trabalhos no momento"
    );

    const bio = document.querySelector("#profile-bio");
    if (bio) {
        const paragraphs = String(profile.bio || "")
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

        bio.replaceChildren(
            ...paragraphs.map((text) => {
                const paragraph = document.createElement("p");
                paragraph.textContent = text;
                return paragraph;
            })
        );
    }

    setDraftLink("#profile-github", profile.githubUrl);
    setDraftLink("#profile-linkedin", profile.linkedinUrl);
    setDraftLink("#profile-instagram", profile.instagramUrl);
    setDraftLink("#profile-youtube", profile.youtubeUrl);
    setDraftLink("#profile-twitter", profile.twitterUrl);
    setDraftLink("#profile-website", profile.websiteUrl);
    setDraftLink("#profile-resume", profile.resumeUrl);
    setDraftLink("#profile-email-link", profile.email, "mailto:");
    setDraftLink("#profile-phone-link", profile.phone, "tel:");
    setDraftLink("#profile-linkedin-contact", profile.linkedinUrl);
    setDraftLink("#profile-github-contact", profile.githubUrl);
    setDraftLink("#profile-youtube-contact", profile.youtubeUrl);

    setDraftText("#profile-email-text", profile.email);
    setDraftText("#profile-phone-text", profile.phone);
    setDraftText("#profile-linkedin-name", profile.fullName);
    setDraftText("#profile-github-name", profile.fullName);
    setDraftText("#profile-footer-name", profile.fullName);
    setDraftText(
        "#profile-footer-logo",
        String(profile.fullName || "").split(" ")[0]
    );

    const avatar = document.querySelector("#profile-avatar");
    if (avatar && profile.avatarUrl) {
        avatar.src = profile.avatarUrl;
        avatar.alt = `Foto profissional de ${profile.fullName || "perfil"}`;
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

            const interactive = event.target.closest(
                "a, button, input, select, textarea"
            );

            event.preventDefault();
            event.stopPropagation();

            selectSection(sectionId, true);
            interactive?.blur?.();
        },
        true
    );

    window.addEventListener("message", (event) => {
        if (event.source !== window.parent) return;
        if (event.data?.source !== SOURCE) return;

        parentOrigin = event.origin || "*";

        const { type, payload = {} } = event.data;

        if (type === types.ping) {
            post(types.ready);
        }

        if (type === types.applySettings) {
            applyTemporarySettings(payload.settings);
        }

        if (type === types.applyProfile) {
            applyProfileDraft(payload.profile);
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

    window.setTimeout(() => post(types.ready), 50);
}

initialize();
