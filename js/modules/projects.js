import { getPublishedProjects } from "../services/portfolio-api.js";

const projectsGrid = document.querySelector("#projects-grid");
const projectFilters = document.querySelector("#project-filters");
const projectFeedback = document.querySelector("#projects-feedback");

let publishedProjects = [];
let selectedCategory = "Todos";

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

function normalizeUrl(url) {
    if (!url) return "";
    try {
        const parsedUrl = new URL(url, window.location.href);
        return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.href : "";
    } catch {
        return "";
    }
}

function slugify(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getProjectSlug(project) {
    return project.slug || slugify(project.title) || project.id;
}

function getProjectSlides(project) {
    const candidates = [];
    if (project.image_url) {
        candidates.push({ image_url: project.image_url, alt_text: `Capa do projeto ${project.title || ""}` });
    }
    if (Array.isArray(project.slides)) candidates.push(...project.slides);
    if (Array.isArray(project.project_slides)) candidates.push(...project.project_slides);

    const seen = new Set();
    return candidates
        .map((slide, index) => ({
            image_url: slide?.image_url || slide?.url || slide?.src || "",
            alt_text: slide?.alt_text || slide?.alt || `Slide ${index + 1} do projeto ${project.title || ""}`,
            sort_order: Number.isFinite(Number(slide?.sort_order)) ? Number(slide.sort_order) : index
        }))
        .filter((slide) => slide.image_url)
        .sort((a, b) => a.sort_order - b.sort_order)
        .filter((slide) => {
            if (seen.has(slide.image_url)) return false;
            seen.add(slide.image_url);
            return true;
        });
}

function createProjectLink(url, label) {
    const safeUrl = normalizeUrl(url);
    if (!safeUrl) return null;
    const link = createElement("a", "project-link", label);
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
}

function createCarousel(project) {
    const slides = getProjectSlides(project);
    if (!slides.length) return null;

    const carousel = createElement("div", "project-carousel");
    carousel.tabIndex = 0;
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-label", `Galeria do projeto ${project.title || ""}`);

    const viewport = createElement("div", "project-carousel-viewport");
    const track = createElement("div", "project-carousel-track");
    viewport.appendChild(track);
    carousel.appendChild(viewport);

    slides.forEach((slide, index) => {
        const frame = createElement("div", "project-carousel-slide");
        frame.setAttribute("aria-hidden", index === 0 ? "false" : "true");
        const image = createElement("img", "project-image");
        image.src = slide.image_url;
        image.alt = slide.alt_text;
        image.loading = index === 0 ? "eager" : "lazy";
        image.decoding = "async";
        frame.appendChild(image);
        track.appendChild(frame);
    });

    if (slides.length === 1) return carousel;

    let currentIndex = 0;
    let autoplayId = null;
    let pointerStartX = null;

    const previous = createElement("button", "project-carousel-button project-carousel-previous", "‹");
    const next = createElement("button", "project-carousel-button project-carousel-next", "›");
    previous.type = next.type = "button";
    previous.setAttribute("aria-label", "Slide anterior");
    next.setAttribute("aria-label", "Próximo slide");

    const dots = createElement("div", "project-carousel-dots");
    const dotButtons = slides.map((_, index) => {
        const dot = createElement("button", "project-carousel-dot");
        dot.type = "button";
        dot.setAttribute("aria-label", `Ir para o slide ${index + 1}`);
        dot.addEventListener("click", () => goTo(index, true));
        dots.appendChild(dot);
        return dot;
    });

    function render() {
        track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
        [...track.children].forEach((slide, index) => {
            slide.setAttribute("aria-hidden", index === currentIndex ? "false" : "true");
        });
        dotButtons.forEach((dot, index) => {
            dot.classList.toggle("is-active", index === currentIndex);
            dot.setAttribute("aria-current", index === currentIndex ? "true" : "false");
        });
    }

    function goTo(index, userInitiated = false) {
        currentIndex = (index + slides.length) % slides.length;
        render();
        if (userInitiated) restartAutoplay();
    }

    function stopAutoplay() {
        if (autoplayId) window.clearInterval(autoplayId);
        autoplayId = null;
    }

    function startAutoplay() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        stopAutoplay();
        autoplayId = window.setInterval(() => goTo(currentIndex + 1), 5000);
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    previous.addEventListener("click", () => goTo(currentIndex - 1, true));
    next.addEventListener("click", () => goTo(currentIndex + 1, true));
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);
    carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") goTo(currentIndex - 1, true);
        if (event.key === "ArrowRight") goTo(currentIndex + 1, true);
    });
    viewport.addEventListener("pointerdown", (event) => {
        pointerStartX = event.clientX;
        viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener("pointerup", (event) => {
        if (pointerStartX === null) return;
        const distance = event.clientX - pointerStartX;
        pointerStartX = null;
        if (Math.abs(distance) < 45) return;
        goTo(currentIndex + (distance < 0 ? 1 : -1), true);
    });

    carousel.append(previous, next, dots);
    render();
    startAutoplay();
    return carousel;
}

function createProjectCard(project) {
    const card = createElement("article", "project-card");
    if (project.featured) card.classList.add("project-card-featured");

    const carousel = createCarousel(project);
    if (carousel) {
        card.appendChild(carousel);
    } else {
        const placeholder = createElement("div", "project-placeholder");
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.appendChild(createElement("span", "", project.title?.charAt(0) || "+"));
        card.appendChild(placeholder);
    }

    const content = createElement("div", "project-content");
    content.append(
        createElement("span", "project-status", project.featured ? "Projeto em destaque" : "Projeto publicado"),
        createElement("h3", "", project.title || "Projeto sem título")
    );

    if (project.category) content.appendChild(createElement("p", "project-technologies", project.category));
    if (project.description) content.appendChild(createElement("p", "project-description", project.description));

    const links = createElement("div", "project-links");
    const detailsLink = createElement("a", "project-link project-details-link", "Ver detalhes");
    detailsLink.href = `./project.html?slug=${encodeURIComponent(getProjectSlug(project))}`;
    const demoLink = createProjectLink(project.demo_url, "Abrir projeto");
    const githubLink = createProjectLink(project.github_url, "Ver código");
    links.appendChild(detailsLink);
    if (demoLink) links.appendChild(demoLink);
    if (githubLink) links.appendChild(githubLink);
    content.appendChild(links);

    card.appendChild(content);
    return card;
}

function renderProjects() {
    if (!projectsGrid) return;
    const filteredProjects = selectedCategory === "Todos"
        ? publishedProjects
        : publishedProjects.filter((project) => project.category === selectedCategory);

    projectsGrid.replaceChildren();
    if (!filteredProjects.length) {
        const emptyCard = createElement("article", "project-card project-card-placeholder project-empty-state");
        const placeholder = createElement("div", "project-placeholder");
        placeholder.appendChild(createElement("span", "", "+"));
        const content = createElement("div", "project-content");
        content.append(
            createElement("span", "project-status", "Em breve"),
            createElement("h3", "", "Novos projetos"),
            createElement("p", "project-description", "Nenhum projeto publicado foi encontrado nesta categoria.")
        );
        emptyCard.append(placeholder, content);
        projectsGrid.appendChild(emptyCard);
    } else {
        filteredProjects.forEach((project) => projectsGrid.appendChild(createProjectCard(project)));
    }
    projectFeedback?.setAttribute("hidden", "");
}

function renderFilters() {
    if (!projectFilters) return;
    const categories = ["Todos", ...new Set(publishedProjects.map((project) => project.category).filter(Boolean))];
    projectFilters.replaceChildren();
    categories.forEach((category) => {
        const button = createElement("button", "project-filter", category);
        button.type = "button";
        button.classList.toggle("is-active", category === selectedCategory);
        button.setAttribute("aria-pressed", category === selectedCategory ? "true" : "false");
        button.addEventListener("click", () => {
            selectedCategory = category;
            renderFilters();
            renderProjects();
        });
        projectFilters.appendChild(button);
    });
    projectFilters.hidden = categories.length <= 2;
}

async function loadProjects() {
    if (!projectsGrid) return;
    try {
        publishedProjects = await getPublishedProjects();
        renderFilters();
        renderProjects();
    } catch (error) {
        console.error("Não foi possível carregar os projetos publicados:", error);
        projectsGrid.replaceChildren();
        const errorCard = createElement("article", "project-card project-card-placeholder project-empty-state");
        const content = createElement("div", "project-content");
        content.append(
            createElement("span", "project-status", "Conteúdo indisponível"),
            createElement("h3", "", "Projetos temporariamente indisponíveis"),
            createElement("p", "project-description", "Não foi possível carregar os projetos agora. Tente novamente mais tarde.")
        );
        errorCard.appendChild(content);
        projectsGrid.appendChild(errorCard);
        if (projectFeedback) {
            projectFeedback.textContent = "Falha ao sincronizar com o CMS.";
            projectFeedback.removeAttribute("hidden");
        }
    }
}

loadProjects();
