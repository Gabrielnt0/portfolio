import { getPublicBuilderSettings } from "../services/portfolio-api.js";

const DEFAULT_SETTINGS = Object.freeze({
    preset: "modern",
    sections: [
        { id: "inicio", label: "Hero", enabled: true },
        { id: "sobre", label: "Sobre", enabled: true },
        { id: "trajetoria", label: "Experiências", enabled: true },
        { id: "formacao", label: "Formação", enabled: true },
        { id: "competencias", label: "Habilidades", enabled: true },
        { id: "projetos", label: "Projetos", enabled: true },
        { id: "curriculo", label: "Currículo", enabled: true },
        { id: "contato", label: "Contato", enabled: true }
    ],
    hero_layout: "split",
    show_hero_avatar: true,
    show_resume_button: true,
    show_contact_button: true,
    show_social_links: true,
    card_style: "rounded",
    button_style: "rounded",
    navbar_style: "blur",
    container_width: "wide",
    section_spacing: "comfortable",
    content_alignment: "left",
    projects_columns: 3,
    projects_per_page: 6,
    show_project_filters: true,
    show_project_technologies: true,
    show_project_client: true,
    show_project_date: true,
    skills_layout: "cards",
    group_skills_by_category: true,
    show_footer_social_links: true,
    show_back_to_top: true,
    footer_text: ""
});

const SECTION_IDS = DEFAULT_SETTINGS.sections.map((item) => item.id);

function normalizeSettings(value = {}) {
    return {
        ...DEFAULT_SETTINGS,
        ...value,
        sections: normalizeSections(value.sections)
    };
}

function normalizeSections(value) {
    if (!Array.isArray(value)) {
        return DEFAULT_SETTINGS.sections.map((item) => ({ ...item }));
    }

    const known = new Map(value.map((item) => [item?.id, item]));
    const ordered = value
        .filter((item) => SECTION_IDS.includes(item?.id))
        .map((item) => ({
            id: item.id,
            label:
                DEFAULT_SETTINGS.sections.find((fallback) => fallback.id === item.id)
                    ?.label || item.id,
            enabled: item.enabled !== false
        }));

    for (const fallback of DEFAULT_SETTINGS.sections) {
        if (!known.has(fallback.id)) ordered.push({ ...fallback });
    }

    return ordered;
}

function getSectionElement(id) {
    if (id === "curriculo") {
        const resume = document.querySelector("main .resume");
        if (resume && !resume.id) resume.id = "curriculo";
        return resume;
    }

    return document.getElementById(id);
}

function setElementVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach((element) => {
        element.hidden = !visible;
        element.setAttribute("aria-hidden", String(!visible));
    });
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

function replaceBuilderClass(prefix, value) {
    const body = document.body;
    [...body.classList]
        .filter((className) => className.startsWith(prefix))
        .forEach((className) => body.classList.remove(className));

    body.classList.add(`${prefix}${value}`);
}

function applyBuilderClasses(settings) {
    replaceBuilderClass("builder-preset-", settings.preset || "modern");
    replaceBuilderClass("builder-hero-", settings.hero_layout || "split");
    replaceBuilderClass("builder-cards-", settings.card_style || "rounded");
    replaceBuilderClass("builder-buttons-", settings.button_style || "rounded");
    replaceBuilderClass("builder-navbar-", settings.navbar_style || "blur");
    replaceBuilderClass("builder-container-", settings.container_width || "wide");
    replaceBuilderClass(
        "builder-spacing-",
        settings.section_spacing || "comfortable"
    );
    replaceBuilderClass(
        "builder-alignment-",
        settings.content_alignment || "left"
    );
    replaceBuilderClass(
        "builder-project-columns-",
        String(settings.projects_columns || 3)
    );
    replaceBuilderClass(
        "builder-skills-",
        settings.skills_layout || "cards"
    );

    document.documentElement.dataset.builderReady = "true";
}

function applyHeroSettings(settings) {
    setElementVisibility(".hero-visual", settings.show_hero_avatar !== false);
    setElementVisibility("#profile-resume", settings.show_resume_button !== false);
    setElementVisibility(".social-links", settings.show_social_links !== false);

    const contactButton = document.querySelector('.hero-actions a[href="#contato"]');
    if (contactButton) {
        contactButton.hidden = settings.show_contact_button === false;
    }

    // O layout atual usa "Ver projetos" como ação secundária. Quando o botão
    // de contato estiver habilitado, ele passa a apontar para Contato.
    const secondaryButton = document.querySelector(
        ".hero-actions .button-secondary"
    );
    if (secondaryButton && settings.show_contact_button !== false) {
        secondaryButton.href = "#contato";
        secondaryButton.textContent = "Entrar em contato";
    }
}

function applyFooterSettings(settings) {
    const footer = document.querySelector(".footer");
    if (!footer) return;

    const copyright = footer.querySelector(".footer-container > p");
    if (copyright && settings.footer_text?.trim()) {
        copyright.textContent = settings.footer_text.trim();
    }

    setElementVisibility(
        ".footer .back-to-top, .scroll-top-button",
        settings.show_back_to_top !== false
    );

    footer.dataset.showSocialLinks = String(
        settings.show_footer_social_links !== false
    );
}

function applyProjectSettings(settings) {
    const grid = document.querySelector("#projects-grid");
    const filters = document.querySelector("#project-filters");

    if (grid) {
        grid.style.setProperty(
            "--builder-project-columns",
            String(settings.projects_columns || 3)
        );
    }

    if (filters && settings.show_project_filters === false) {
        filters.hidden = true;
        filters.dataset.builderDisabled = "true";
    }
}

function applySettings(settings) {
    window.__portfolioBuilderSettings = settings;

    applyBuilderClasses(settings);
    applySectionStructure(settings.sections);
    applyHeroSettings(settings);
    applyFooterSettings(settings);
    applyProjectSettings(settings);

    window.dispatchEvent(
        new CustomEvent("portfolio:builder-ready", { detail: settings })
    );
}

async function initializeBuilder() {
    try {
        const settings = normalizeSettings(await getPublicBuilderSettings());
        applySettings(settings);
    } catch (error) {
        console.warn(
            "Portfolio Site Builder: usando configuração estrutural padrão.",
            error
        );
        applySettings(normalizeSettings());
    }
}

initializeBuilder();
