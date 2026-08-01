import { portfolioConfig } from "../config/portfolio-config.js";

let portfolioContentPromise = null;

function hasValidConfiguration() {
    return (
        portfolioConfig.supabaseUrl &&
        portfolioConfig.supabaseAnonKey &&
        !portfolioConfig.supabaseUrl.startsWith("COLE_AQUI") &&
        !portfolioConfig.supabaseAnonKey.startsWith("COLE_AQUI")
    );
}

function buildHeaders() {
    return {
        apikey: portfolioConfig.supabaseAnonKey,
        Authorization: `Bearer ${portfolioConfig.supabaseAnonKey}`,
        Accept: "application/json",
        "Content-Type": "application/json"
    };
}

function buildPortfolioPayload() {
    const payload = {};

    if (portfolioConfig.workspaceSlug?.trim()) {
        payload.requested_workspace_slug = portfolioConfig.workspaceSlug.trim();
    }

    if (portfolioConfig.ownerUserId?.trim()) {
        payload.requested_owner_user_id = portfolioConfig.ownerUserId.trim();
    }

    return payload;
}

function buildPersonalSettingsPayload() {
    const ownerUserId = portfolioConfig.ownerUserId?.trim();

    return ownerUserId
        ? { requested_owner_user_id: ownerUserId }
        : {};
}

async function requestRpc(functionName, payload = {}) {
    if (!hasValidConfiguration()) {
        throw new Error("Supabase ainda não foi configurado no portfólio.");
    }

    const baseUrl = portfolioConfig.supabaseUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${functionName}`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `Erro ao carregar conteúdo público (${response.status}): ${message}`
        );
    }

    return response.json();
}

function normalizeContent(content) {
    return {
        workspace: content?.workspace ?? null,
        profile: content?.profile ?? null,
        projects: Array.isArray(content?.projects) ? content.projects : [],
        education: Array.isArray(content?.education) ? content.education : [],
        experiences: Array.isArray(content?.experiences) ? content.experiences : [],
        skills: Array.isArray(content?.skills) ? content.skills : [],
        seo: content?.seo ?? null,
        theme: content?.theme ?? null,
        settings: content?.settings ?? null,
        meta: content?.meta ?? {}
    };
}

/** Carrega todo o conteúdo público em uma única requisição compartilhada. */
export function getPortfolioContent({ forceRefresh = false } = {}) {
    if (!portfolioContentPromise || forceRefresh) {
        portfolioContentPromise = requestRpc(
            "get_public_portfolio_content",
            buildPortfolioPayload()
        )
            .then(normalizeContent)
            .catch((error) => {
                portfolioContentPromise = null;
                throw error;
            });
    }

    return portfolioContentPromise;
}

export async function getPublicProfile() {
    return (await getPortfolioContent()).profile;
}

export async function getPublishedProjects() {
    return (await getPortfolioContent()).projects;
}

export async function getPublishedEducation() {
    return (await getPortfolioContent()).education;
}

export async function getPublishedExperiences() {
    return (await getPortfolioContent()).experiences;
}

export async function getPublishedSkills() {
    return (await getPortfolioContent()).skills;
}

export async function getPublicSeo() {
    return (await getPortfolioContent()).seo;
}

/** Carrega o tema público associado ao mesmo workspace do portfólio. */
export async function getPublicTheme() {
    return requestRpc("get_public_portfolio_theme", buildPersonalSettingsPayload());
}

/** Carrega a estrutura pública do Site Builder para o mesmo workspace. */
export async function getPublicBuilderSettings() {
    return requestRpc("get_public_portfolio_builder", buildPersonalSettingsPayload());
}
