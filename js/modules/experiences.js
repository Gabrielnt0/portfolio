import { getPublishedExperiences } from "../services/portfolio-api.js";

const timeline = document.querySelector("#experiences-timeline");

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

function formatMonthYear(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(`${value}T00:00:00Z`));
}

function buildPeriod(item) {
    const start = formatMonthYear(item.start_date);
    const end = item.is_current ? "Atual" : formatMonthYear(item.end_date);
    return [start, end].filter(Boolean).join(" — ");
}

function safeUrl(value) {
    if (!value) return "";
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function createExperienceItem(item) {
    const article = createElement("article", "timeline-item reveal is-visible");
    article.appendChild(createElement("div", "timeline-marker"));

    const content = createElement("div", "timeline-content");
    const period = buildPeriod(item);
    if (period) content.appendChild(createElement("span", "timeline-year", period));

    const title = createElement("h3", "", item.position || "Experiência profissional");
    content.appendChild(title);

    const companyParts = [item.company, item.employment_type, item.location].filter(Boolean);
    if (companyParts.length) {
        const company = createElement("p", "experience-company", companyParts.join(" • "));
        const companyUrl = safeUrl(item.company_url);
        if (companyUrl) {
            const link = createElement("a", "", companyParts.join(" • "));
            link.href = companyUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            company.replaceChildren(link);
        }
        content.appendChild(company);
    }

    if (item.description) content.appendChild(createElement("p", "", item.description));

    if (Array.isArray(item.technologies) && item.technologies.length) {
        const list = createElement("ul", "experience-technologies");
        item.technologies.filter(Boolean).forEach((technology) => {
            list.appendChild(createElement("li", "", technology));
        });
        content.appendChild(list);
    }

    article.appendChild(content);
    return article;
}

async function loadExperiences() {
    if (!timeline) return;
    try {
        const items = await getPublishedExperiences();
        if (!items.length) return;
        timeline.replaceChildren(...items.map(createExperienceItem));
    } catch (error) {
        console.warn("Não foi possível carregar as experiências pelo CMS.", error);
    }
}

loadExperiences();
