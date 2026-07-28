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

async function requestRpc(functionName, payload = {}) {
    if (!hasValidConfiguration()) {
        throw new Error("Supabase ainda não foi configurado no portfólio.");
    }

    const baseUrl = portfolioConfig.supabaseUrl.replace(/\/$/, "");
    const response = await fetch(
        `${baseUrl}/rest/v1/rpc/${functionName}`,
        {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify(payload)
        }
    );

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
        profile: content?.profile ?? null,
        projects: Array.isArray(content?.projects) ? content.projects : [],
        education: Array.isArray(content?.education) ? content.education : [],
        meta: content?.meta ?? {}
    };
}

/**
 * Carrega todo o conteúdo público em uma única requisição.
 * O mesmo Promise é compartilhado entre Perfil, Projetos e Formação.
 */
export function getPortfolioContent({ forceRefresh = false } = {}) {
    if (!portfolioContentPromise || forceRefresh) {
        portfolioContentPromise = requestRpc("get_public_portfolio_content")
            .then(normalizeContent)
            .catch((error) => {
                portfolioContentPromise = null;
                throw error;
            });
    }

    return portfolioContentPromise;
}

export async function getPublicProfile() {
    const content = await getPortfolioContent();
    return content.profile;
}

export async function getPublishedProjects() {
    const content = await getPortfolioContent();
    return content.projects;
}

export async function getPublishedEducation() {
    const content = await getPortfolioContent();
    return content.education;
}
