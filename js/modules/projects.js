import { getPublishedProjects } from "../services/portfolio-api.js";

const projectsGrid = document.querySelector("#projects-grid");
const projectFilters = document.querySelector("#project-filters");
const projectFeedback = document.querySelector("#projects-feedback");

let publishedProjects = [];
let selectedCategory = "Todos";

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = text;
    }

    return element;
}

function normalizeUrl(url) {
    if (!url) return "";

    try {
        const parsedUrl = new URL(url, window.location.href);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return "";
        }

        return parsedUrl.href;
    } catch {
        return "";
    }
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

function createProjectCard(project) {
    const card = createElement("article", "project-card");

    if (project.featured) {
        card.classList.add("project-card-featured");
    }

    if (project.image_url) {
        const imageWrapper = createElement("div", "project-image-wrapper");
        const image = createElement("img", "project-image");

        image.src = project.image_url;
        image.alt = `Imagem de apresentação do projeto ${project.title}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
            imageWrapper.remove();
        });

        imageWrapper.appendChild(image);
        card.appendChild(imageWrapper);
    } else {
        const placeholder = createElement("div", "project-placeholder");
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.appendChild(createElement("span", "", project.title?.charAt(0) || "+"));
        card.appendChild(placeholder);
    }

    const content = createElement("div", "project-content");
    const status = createElement(
        "span",
        "project-status",
        project.featured ? "Projeto em destaque" : "Projeto publicado"
    );
    const title = createElement("h3", "", project.title || "Projeto sem título");

    content.append(status, title);

    if (project.category) {
        content.appendChild(
            createElement("p", "project-technologies", project.category)
        );
    }

    if (project.description) {
        content.appendChild(
            createElement("p", "project-description", project.description)
        );
    }

    const links = createElement("div", "project-links");
    const demoLink = createProjectLink(project.demo_url, "Ver projeto");
    const githubLink = createProjectLink(project.github_url, "Ver código");

    if (demoLink) links.appendChild(demoLink);
    if (githubLink) links.appendChild(githubLink);

    if (links.childElementCount > 0) {
        content.appendChild(links);
    }

    card.appendChild(content);
    return card;
}

function renderProjects() {
    if (!projectsGrid) return;

    const filteredProjects = selectedCategory === "Todos"
        ? publishedProjects
        : publishedProjects.filter(
            (project) => project.category === selectedCategory
        );

    projectsGrid.replaceChildren();

    if (filteredProjects.length === 0) {
        const emptyCard = createElement(
            "article",
            "project-card project-card-placeholder project-empty-state"
        );
        const placeholder = createElement("div", "project-placeholder");
        placeholder.appendChild(createElement("span", "", "+"));

        const content = createElement("div", "project-content");
        content.append(
            createElement("span", "project-status", "Em breve"),
            createElement("h3", "", "Novos projetos"),
            createElement(
                "p",
                "project-description",
                "Nenhum projeto publicado foi encontrado nesta categoria."
            )
        );

        emptyCard.append(placeholder, content);
        projectsGrid.appendChild(emptyCard);
    } else {
        filteredProjects.forEach((project) => {
            projectsGrid.appendChild(createProjectCard(project));
        });
    }

    projectFeedback?.setAttribute("hidden", "");
}

function renderFilters() {
    if (!projectFilters) return;

    const categories = [
        "Todos",
        ...new Set(
            publishedProjects
                .map((project) => project.category)
                .filter(Boolean)
        )
    ];

    projectFilters.replaceChildren();

    categories.forEach((category) => {
        const button = createElement("button", "project-filter", category);
        button.type = "button";
        button.classList.toggle("is-active", category === selectedCategory);
        button.setAttribute(
            "aria-pressed",
            category === selectedCategory ? "true" : "false"
        );

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
        const errorCard = createElement(
            "article",
            "project-card project-card-placeholder project-empty-state"
        );
        const content = createElement("div", "project-content");
        content.append(
            createElement("span", "project-status", "Conteúdo indisponível"),
            createElement("h3", "", "Projetos temporariamente indisponíveis"),
            createElement(
                "p",
                "project-description",
                "Não foi possível carregar os projetos agora. Tente novamente mais tarde."
            )
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
