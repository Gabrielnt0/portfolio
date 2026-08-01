import { getPublishedSkills } from "../services/portfolio-api.js";

const skillsGrid = document.querySelector("#skills-grid");
let publishedSkills = [];
let builderSettings = window.__portfolioBuilderSettings || {};

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
}

function groupSkills(items) {
    return items.reduce((groups, item) => {
        const category =
            item.category?.trim() || "Outras competências";

        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(item);

        return groups;
    }, new Map());
}

function createLevelBar(item) {
    const wrapper = createElement("div", "skill-level-row");
    const header = createElement("div", "skill-level-header");
    const level = Math.max(0, Math.min(100, Number(item.level) || 0));

    header.append(
        createElement("span", "", item.name),
        createElement("span", "", level ? `${level}%` : "")
    );

    const track = createElement("div", "skill-level-track");
    const fill = createElement("span", "skill-level-fill");
    fill.style.width = `${level}%`;
    track.appendChild(fill);

    wrapper.append(header, track);

    if (item.description) wrapper.title = item.description;
    return wrapper;
}

function createGroupedCard(category, items) {
    const card = createElement(
        "article",
        "skill-card reveal is-visible"
    );
    const icon = createElement(
        "span",
        "skill-icon",
        items.find((item) => item.icon)?.icon || "✦"
    );

    icon.setAttribute("aria-hidden", "true");
    card.append(icon, createElement("h3", "", category));

    if (builderSettings.skills_layout === "bars") {
        const levels = createElement("div", "skill-levels");
        items.forEach((item) => levels.appendChild(createLevelBar(item)));
        card.appendChild(levels);
        return card;
    }

    const list = createElement("ul", "skill-list");

    items.forEach((item) => {
        const level = Number(item.level);
        const showLevel =
            builderSettings.skills_layout !== "list" && level > 0;
        const suffix = showLevel ? ` — ${level}%` : "";
        const entry = createElement(
            "li",
            "",
            `${item.name}${suffix}`
        );

        if (item.description) entry.title = item.description;
        list.appendChild(entry);
    });

    card.appendChild(list);
    return card;
}

function createIndividualCard(item) {
    const card = createElement(
        "article",
        "skill-card skill-card-individual reveal is-visible"
    );

    const icon = createElement(
        "span",
        "skill-icon",
        item.icon || "✦"
    );
    icon.setAttribute("aria-hidden", "true");

    card.append(icon, createElement("h3", "", item.name));

    if (item.category) {
        card.appendChild(
            createElement("p", "skill-category", item.category)
        );
    }

    if (builderSettings.skills_layout === "bars") {
        card.appendChild(createLevelBar(item));
    } else if (item.description) {
        card.appendChild(
            createElement("p", "skill-description", item.description)
        );
    }

    return card;
}

function renderSkills() {
    if (!skillsGrid || !publishedSkills.length) return;

    skillsGrid.dataset.layout =
        builderSettings.skills_layout || "cards";

    if (builderSettings.group_skills_by_category === false) {
        skillsGrid.replaceChildren(
            ...publishedSkills.map(createIndividualCard)
        );
        return;
    }

    const groups = groupSkills(publishedSkills);
    skillsGrid.replaceChildren(
        ...Array.from(groups, ([category, skills]) =>
            createGroupedCard(category, skills)
        )
    );
}

window.addEventListener("portfolio:builder-ready", (event) => {
    builderSettings = event.detail || {};
    renderSkills();
});

async function loadSkills() {
    if (!skillsGrid) return;

    try {
        publishedSkills = await getPublishedSkills();
        if (!publishedSkills.length) return;

        builderSettings =
            window.__portfolioBuilderSettings || builderSettings;
        renderSkills();
    } catch (error) {
        console.warn(
            "Não foi possível carregar as habilidades pelo CMS.",
            error
        );
    }
}

loadSkills();
