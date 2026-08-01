import { getPublicProfile } from "../services/portfolio-api.js";

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined && value !== null && value !== "") {
        element.textContent = value;
    }
}

function normalizePublicUrl(value) {
    if (!value) return "";

    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function setLink(selector, value, { mailto = false, tel = false } = {}) {
    const element = document.querySelector(selector);
    if (!element || !value) return;

    if (mailto) {
        element.href = `mailto:${value}`;
        element.hidden = false;
        return;
    }

    if (tel) {
        element.href = `tel:${String(value).replace(/[^\d+]/g, "")}`;
        element.hidden = false;
        return;
    }

    const safeUrl = normalizePublicUrl(value);
    if (!safeUrl) return;

    element.href = safeUrl;
    element.hidden = false;
}

function setVisibility(selector, visible) {
    const element = document.querySelector(selector);
    if (element) element.hidden = !visible;
}

function renderBio(value) {
    const container = document.querySelector("#profile-bio");
    if (!container || !value) return;

    const paragraphs = String(value)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    if (!paragraphs.length) return;

    container.replaceChildren(
        ...paragraphs.map((text) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = text;
            return paragraph;
        })
    );
}

function ensureFooterSocials() {
    const footerContainer = document.querySelector(".footer-container");
    if (!footerContainer) return null;

    let container = document.querySelector("#profile-footer-socials");
    if (container) return container;

    container = document.createElement("nav");
    container.id = "profile-footer-socials";
    container.className = "footer-socials";
    container.setAttribute("aria-label", "Redes sociais no rodapé");

    const backToTop = footerContainer.querySelector(".back-to-top");
    footerContainer.insertBefore(container, backToTop || null);

    return container;
}

function renderFooterSocials(profile) {
    const container = ensureFooterSocials();
    if (!container) return;

    const links = [
        ["GitHub", profile.github_url],
        ["LinkedIn", profile.linkedin_url],
        ["Instagram", profile.instagram_url],
        ["YouTube", profile.youtube_url],
        ["X", profile.twitter_url],
        ["Site", profile.website_url],
    ]
        .map(([label, value]) => [label, normalizePublicUrl(value)])
        .filter(([, value]) => value);

    container.replaceChildren(
        ...links.map(([label, href]) => {
            const link = document.createElement("a");
            link.href = href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = label;
            return link;
        })
    );

    const builderSettings = window.__portfolioBuilderSettings || {};
    container.hidden =
        builderSettings.show_footer_social_links === false || !links.length;
}

function renderProfile(profile) {
    setText("#profile-name", profile.full_name);
    setText("#profile-title", profile.professional_title);
    setText("#profile-short-bio", profile.short_bio);
    setText("#profile-location", profile.location);
    setText("#profile-availability", profile.available_for_work
        ? "Disponível para oportunidades e projetos"
        : "Indisponível para novos trabalhos no momento");
    renderBio(profile.bio);

    setLink("#profile-github", profile.github_url);
    setLink("#profile-linkedin", profile.linkedin_url);
    setLink("#profile-instagram", profile.instagram_url);
    setLink("#profile-youtube", profile.youtube_url);
    setLink("#profile-twitter", profile.twitter_url);
    setLink("#profile-website", profile.website_url);
    setLink("#profile-resume", profile.resume_url);

    setLink("#profile-email-link", profile.email, { mailto: true });
    setText("#profile-email-text", profile.email);

    setLink("#profile-phone-link", profile.phone, { tel: true });
    setText("#profile-phone-text", profile.phone);

    setLink("#profile-linkedin-contact", profile.linkedin_url);
    setText("#profile-linkedin-name", profile.full_name);

    setLink("#profile-github-contact", profile.github_url);
    setText("#profile-github-name", profile.full_name);

    setLink("#profile-youtube-contact", profile.youtube_url);

    setText("#profile-footer-name", profile.full_name);
    setText("#profile-footer-logo", profile.full_name?.split(" ")[0]);

    setVisibility("#profile-email-link", Boolean(profile.email));
    setVisibility("#profile-phone-link", Boolean(profile.phone));

    const avatar = document.querySelector("#profile-avatar");
    if (avatar && profile.avatar_url) {
        avatar.src = profile.avatar_url;
        avatar.alt = `Foto profissional de ${profile.full_name || "perfil"}`;
    }

    renderFooterSocials(profile);

    if (profile.full_name) {
        document.title = `${profile.full_name} | Portfólio`;
    }

    const description = document.querySelector('meta[name="description"]');
    if (description && (profile.short_bio || profile.bio)) {
        description.content = profile.short_bio || profile.bio.slice(0, 160);
    }
}

async function loadProfile() {
    try {
        const profile = await getPublicProfile();
        if (!profile) return;
        renderProfile(profile);
    } catch (error) {
        console.warn(
            "Não foi possível carregar o perfil pelo CMS. O conteúdo estático foi mantido.",
            error
        );
    }
}

loadProfile();
