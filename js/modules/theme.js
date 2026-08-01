import { getPublicTheme } from "../services/portfolio-api.js";

const ROOT = document.documentElement;

const FONT_STACKS = {
    Inter: '"Inter", Arial, Helvetica, sans-serif',
    Manrope: '"Manrope", "Inter", Arial, sans-serif',
    Poppins: '"Poppins", "Inter", Arial, sans-serif',
    "Space Grotesk": '"Space Grotesk", "Inter", Arial, sans-serif',
    Georgia: 'Georgia, "Times New Roman", serif'
};

const RADIUS = {
    square: { sm: "0.25rem", md: "0.4rem", lg: "0.55rem", xl: "0.75rem" },
    rounded: { sm: "0.5rem", md: "0.875rem", lg: "1.25rem", xl: "1.75rem" },
    pill: { sm: "1rem", md: "1.5rem", lg: "2rem", xl: "2.5rem" }
};

const SHADOWS = {
    none: { sm: "none", md: "none", primary: "none" },
    soft: {
        sm: "0 10px 30px rgba(0, 0, 0, 0.18)",
        md: "0 20px 50px rgba(0, 0, 0, 0.28)",
        primary: "0 0 40px color-mix(in srgb, var(--color-primary) 20%, transparent)"
    },
    medium: {
        sm: "0 14px 36px rgba(0, 0, 0, 0.26)",
        md: "0 28px 70px rgba(0, 0, 0, 0.38)",
        primary: "0 0 55px color-mix(in srgb, var(--color-primary) 28%, transparent)"
    }
};

function hexToRgba(hex, alpha) {
    const normalized = String(hex || "").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(59, 130, 246, ${alpha})`;
    const value = Number.parseInt(normalized, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getSectionElement(id) {
    if (id === "curriculo") {
        const resume = document.querySelector("main .resume");
        if (resume && !resume.id) resume.id = "curriculo";
        return resume;
    }
    return document.getElementById(id);
}

function applySectionStyles(sectionStyles = {}) {
    Object.entries(sectionStyles).forEach(([sectionId, style]) => {
        const section = getSectionElement(sectionId);
        if (!section) return;

        section.dataset.customSectionStyle = "true";
        section.style.setProperty("--section-custom-text", style.textColor || "inherit");
        section.style.backgroundColor = style.backgroundColor || "";
        section.style.backgroundImage = style.backgroundImage
            ? `linear-gradient(rgba(0,0,0,${Number(style.backgroundOverlay || 0) / 100}), rgba(0,0,0,${Number(style.backgroundOverlay || 0) / 100})), url("${style.backgroundImage}")`
            : "";
        section.style.backgroundSize = style.backgroundImage ? "cover" : "";
        section.style.backgroundPosition = style.backgroundImage ? "center" : "";
        section.style.paddingTop = Number(style.paddingTop) ? `${style.paddingTop}px` : "";
        section.style.paddingBottom = Number(style.paddingBottom) ? `${style.paddingBottom}px` : "";
        section.style.marginTop = Number(style.marginTop) ? `${style.marginTop}px` : "";
        section.style.marginBottom = Number(style.marginBottom) ? `${style.marginBottom}px` : "";
        section.style.border = Number(style.borderWidth)
            ? `${style.borderWidth}px solid ${style.borderColor || "var(--color-border)"}`
            : "";
        section.style.borderRadius = Number(style.borderRadius)
            ? `${style.borderRadius}px`
            : "";
    });
}

function applyTheme(theme) {
    if (!theme) return;

    const values = {
        "--color-background": theme.background_color,
        "--color-surface": theme.surface_color,
        "--color-card": theme.card_color,
        "--color-border": theme.border_color,
        "--color-primary": theme.primary_color,
        "--color-primary-hover": theme.primary_hover_color,
        "--color-primary-soft": hexToRgba(theme.primary_color, 0.14),
        "--color-title": theme.title_color,
        "--color-text": theme.text_color,
        "--color-muted": theme.muted_color,
        "--font-primary": FONT_STACKS[theme.font_family] || FONT_STACKS.Inter
    };

    Object.entries(values).forEach(([property, value]) => {
        if (value) ROOT.style.setProperty(property, value);
    });

    const radius = RADIUS[theme.border_radius] || RADIUS.rounded;
    ROOT.style.setProperty("--border-radius-sm", radius.sm);
    ROOT.style.setProperty("--border-radius-md", radius.md);
    ROOT.style.setProperty("--border-radius-lg", radius.lg);
    ROOT.style.setProperty("--border-radius-xl", radius.xl);

    const shadows = SHADOWS[theme.shadow_style] || SHADOWS.soft;
    ROOT.style.setProperty("--shadow-sm", shadows.sm);
    ROOT.style.setProperty("--shadow-md", shadows.md);
    ROOT.style.setProperty("--shadow-primary", shadows.primary);

    ROOT.dataset.portfolioTheme = theme.preset || "custom";
    ROOT.classList.toggle("theme-motion-disabled", theme.motion_enabled === false);
    applySectionStyles(theme.settings?.sectionStyles || {});
}

async function loadTheme() {
    try {
        const theme = await getPublicTheme();
        applyTheme(theme);
    } catch (error) {
        console.warn("Não foi possível carregar o tema público. O tema padrão foi mantido.", error);
    }
}

loadTheme();
