import { portfolioConfig } from "../config/portfolio-config.js";

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
        Accept: "application/json"
    };
}

async function request(path, searchParams = {}) {
    if (!hasValidConfiguration()) {
        throw new Error("Supabase ainda não foi configurado no portfólio.");
    }

    const baseUrl = portfolioConfig.supabaseUrl.replace(/\/$/, "");
    const url = new URL(`${baseUrl}/rest/v1/${path}`);

    Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        method: "GET",
        headers: buildHeaders()
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            `Erro ao carregar conteúdo público (${response.status}): ${message}`
        );
    }

    return response.json();
}

export async function getPublishedEducation() {
    const filters = {
        select: [
            "id",
            "institution",
            "course",
            "degree",
            "field_of_study",
            "location",
            "description",
            "start_date",
            "end_date",
            "is_current",
            "is_featured",
            "certificate_url",
            "display_order"
        ].join(","),

        order: "is_featured.desc,display_order.asc,start_date.desc"
    };

    return request("public_portfolio_education", filters);
}