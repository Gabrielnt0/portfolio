import { getPublicProfile } from "../services/portfolio-api.js";

function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value !== undefined && value !== null && value !== "") {
        element.textContent = value;
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

    try {
        const url = new URL(value, window.location.href);
        if (!["http:", "https:"].includes(url.protocol)) return;
        element.href = url.href;
        element.hidden = false;
    } catch {
        // Mantém o conteúdo estático quando a URL não é válida.
    }
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
