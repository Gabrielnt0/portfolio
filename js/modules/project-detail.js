import { getPublishedProjects } from "../services/portfolio-api.js";

const root = document.querySelector("#project-detail");
const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = new Date().getFullYear();

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

function slugify(value = "") {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function projectSlug(project) {
    return project.slug || slugify(project.title) || String(project.id || "");
}

function normalizeUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
}

function getSlides(project) {
    const raw = [];
    if (project.image_url) raw.push({ image_url: project.image_url, alt_text: `Capa do projeto ${project.title || ""}` });
    if (Array.isArray(project.slides)) raw.push(...project.slides);
    if (Array.isArray(project.project_slides)) raw.push(...project.project_slides);
    const seen = new Set();
    return raw.map((item, index) => ({
        image_url: item?.image_url || item?.url || item?.src || "",
        alt_text: item?.alt_text || item?.alt || `Slide ${index + 1} do projeto ${project.title || ""}`,
        sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item.sort_order) : index
    })).filter((item) => item.image_url).sort((a,b) => a.sort_order - b.sort_order).filter((item) => {
        if (seen.has(item.image_url)) return false;
        seen.add(item.image_url); return true;
    });
}

function setMeta(selector, attribute, value) {
    if (!value) return;
    let node = document.head.querySelector(selector);
    if (!node) {
        node = document.createElement("meta");
        const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
        if (!match) return;
        node.setAttribute(match[1], match[2]);
        document.head.appendChild(node);
    }
    node.setAttribute(attribute, value);
}

function applySeo(project) {
    const title = `${project.title || "Projeto"} | Portfólio`;
    const description = project.description || `Conheça o projeto ${project.title || ""}.`;
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:image"]', "content", project.image_url);
    setMeta('meta[property="og:url"]', "content", window.location.href);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", project.image_url);
}

function createGallery(project) {
    const slides = getSlides(project);
    if (!slides.length) return null;

    const gallery = createElement("section", "project-detail-gallery");
    const viewport = createElement("div", "project-detail-gallery-viewport");
    const track = createElement("div", "project-detail-gallery-track");
    viewport.appendChild(track);
    gallery.appendChild(viewport);

    slides.forEach((slide, index) => {
        const figure = createElement("figure", "project-detail-slide");
        const image = createElement("img", "project-detail-image");
        image.src = slide.image_url;
        image.alt = slide.alt_text;
        image.loading = index === 0 ? "eager" : "lazy";
        image.decoding = "async";
        figure.appendChild(image);
        track.appendChild(figure);
    });

    if (slides.length === 1) return gallery;

    let index = 0;
    let startX = null;
    const previous = createElement("button", "project-detail-gallery-button previous", "‹");
    const next = createElement("button", "project-detail-gallery-button next", "›");
    previous.type = next.type = "button";
    previous.setAttribute("aria-label", "Imagem anterior");
    next.setAttribute("aria-label", "Próxima imagem");
    const counter = createElement("span", "project-detail-gallery-counter");
    const dots = createElement("div", "project-detail-gallery-dots");
    const dotButtons = slides.map((_, dotIndex) => {
        const dot = createElement("button", "project-detail-gallery-dot");
        dot.type = "button";
        dot.setAttribute("aria-label", `Ver imagem ${dotIndex + 1}`);
        dot.addEventListener("click", () => goTo(dotIndex));
        dots.appendChild(dot); return dot;
    });

    function render() {
        track.style.transform = `translate3d(-${index * 100}%,0,0)`;
        counter.textContent = `${index + 1} / ${slides.length}`;
        dotButtons.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
    }
    function goTo(nextIndex) { index = (nextIndex + slides.length) % slides.length; render(); }
    previous.addEventListener("click", () => goTo(index - 1));
    next.addEventListener("click", () => goTo(index + 1));
    gallery.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") goTo(index - 1);
        if (event.key === "ArrowRight") goTo(index + 1);
    });
    gallery.tabIndex = 0;
    viewport.addEventListener("pointerdown", (event) => { startX = event.clientX; });
    viewport.addEventListener("pointerup", (event) => {
        if (startX === null) return;
        const distance = event.clientX - startX; startX = null;
        if (Math.abs(distance) >= 50) goTo(index + (distance < 0 ? 1 : -1));
    });

    gallery.append(previous, next, counter, dots);
    render();
    return gallery;
}

function createAction(url, text, secondary = false) {
    const safeUrl = normalizeUrl(url);
    if (!safeUrl) return null;
    const link = createElement("a", `button ${secondary ? "button-secondary" : "button-primary"}`, text);
    link.href = safeUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
    return link;
}

function renderProject(project, projects) {
    applySeo(project);
    root.replaceChildren();

    const hero = createElement("section", "section project-detail-hero");
    const heroContainer = createElement("div", "container project-detail-hero-grid");
    const intro = createElement("div", "project-detail-intro");
    intro.append(
        createElement("p", "project-detail-kicker", project.featured ? "Projeto em destaque" : (project.category || "Projeto")),
        createElement("h1", "", project.title || "Projeto sem título")
    );
    if (project.description) intro.appendChild(createElement("p", "project-detail-lead", project.description));
    const actions = createElement("div", "project-detail-actions");
    const demo = createAction(project.demo_url, "Abrir projeto");
    const github = createAction(project.github_url, "Ver código", true);
    if (demo) actions.appendChild(demo);
    if (github) actions.appendChild(github);
    if (actions.childElementCount) intro.appendChild(actions);
    heroContainer.appendChild(intro);
    hero.appendChild(heroContainer);
    root.appendChild(hero);

    const gallery = createGallery(project);
    if (gallery) {
        const gallerySection = createElement("section", "section project-detail-gallery-section");
        const container = createElement("div", "container");
        container.appendChild(gallery); gallerySection.appendChild(container); root.appendChild(gallerySection);
    }

    const information = createElement("section", "section project-detail-content-section");
    const infoContainer = createElement("div", "container project-detail-content-grid");
    const article = createElement("article", "project-detail-article");
    article.appendChild(createElement("p", "project-detail-kicker", "Sobre o projeto"));
    article.appendChild(createElement("h2", "", "Visão geral"));
    article.appendChild(createElement("p", "", project.long_description || project.description || "Mais informações sobre este projeto serão adicionadas em breve."));
    const aside = createElement("aside", "project-detail-meta");
    aside.appendChild(createElement("h2", "", "Informações"));
    [["Categoria", project.category], ["Tecnologias", project.technologies], ["Cliente", project.client], ["Data", project.project_date || project.date]].forEach(([label, value]) => {
        if (!value) return;
        const row = createElement("div", "project-detail-meta-row");
        row.append(createElement("span", "", label), createElement("strong", "", Array.isArray(value) ? value.join(", ") : value));
        aside.appendChild(row);
    });
    infoContainer.append(article, aside); information.appendChild(infoContainer); root.appendChild(information);

    const currentIndex = projects.findIndex((item) => String(item.id) === String(project.id));
    const previousProject = projects[(currentIndex - 1 + projects.length) % projects.length];
    const nextProject = projects[(currentIndex + 1) % projects.length];
    if (projects.length > 1) {
        const navigation = createElement("nav", "section project-detail-navigation");
        const navContainer = createElement("div", "container project-detail-navigation-grid");
        [[previousProject, "← Projeto anterior"], [nextProject, "Próximo projeto →"]].forEach(([item, label]) => {
            const link = createElement("a", "project-detail-navigation-card");
            link.href = `./project.html?slug=${encodeURIComponent(projectSlug(item))}`;
            link.append(createElement("span", "", label), createElement("strong", "", item.title || "Projeto"));
            navContainer.appendChild(link);
        });
        navigation.appendChild(navContainer); root.appendChild(navigation);
    }
}

function renderError() {
    root.replaceChildren();
    const section = createElement("section", "section project-detail-error");
    const container = createElement("div", "container");
    container.append(
        createElement("p", "project-detail-kicker", "Projeto não encontrado"),
        createElement("h1", "", "Não foi possível abrir este projeto."),
        createElement("p", "project-detail-lead", "O link pode estar incorreto ou o projeto não está mais publicado.")
    );
    const link = createElement("a", "button button-primary", "Voltar aos projetos");
    link.href = "./index.html#projetos"; container.appendChild(link); section.appendChild(container); root.appendChild(section);
}

async function initialize() {
    try {
        const requestedSlug = new URLSearchParams(window.location.search).get("slug");
        const projects = await getPublishedProjects();
        const project = projects.find((item) => projectSlug(item) === requestedSlug || String(item.id) === requestedSlug);
        if (!project) return renderError();
        renderProject(project, projects);
    } catch (error) {
        console.error("Não foi possível carregar a página do projeto:", error);
        renderError();
    }
}

initialize();
