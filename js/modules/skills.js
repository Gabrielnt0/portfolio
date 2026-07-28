import { getPublishedSkills } from "../services/portfolio-api.js";

const skillsGrid = document.querySelector("#skills-grid");

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

function groupSkills(items) {
    return items.reduce((groups, item) => {
        const category = item.category?.trim() || "Outras competências";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(item);
        return groups;
    }, new Map());
}

function createSkillCard(category, items) {
    const card = createElement("article", "skill-card reveal is-visible");
    const icon = createElement("span", "skill-icon", items.find((item) => item.icon)?.icon || "✦");
    icon.setAttribute("aria-hidden", "true");
    card.append(icon, createElement("h3", "", category));

    const list = createElement("ul", "skill-list");
    items.forEach((item) => {
        const level = Number(item.level);
        const suffix = level > 0 ? ` — ${level}%` : "";
        const entry = createElement("li", "", `${item.name}${suffix}`);
        if (item.description) entry.title = item.description;
        list.appendChild(entry);
    });
    card.appendChild(list);
    return card;
}

async function loadSkills() {
    if (!skillsGrid) return;
    try {
        const items = await getPublishedSkills();
        if (!items.length) return;
        const groups = groupSkills(items);
        skillsGrid.replaceChildren(
            ...Array.from(groups, ([category, skills]) => createSkillCard(category, skills))
        );
    } catch (error) {
        console.warn("Não foi possível carregar as habilidades pelo CMS.", error);
    }
}

loadSkills();
