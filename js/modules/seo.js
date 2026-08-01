import { getPublicSeo } from "../services/portfolio-api.js";

function setMeta(selector, attribute, value) {
    if (!value) return;
    let element = document.head.querySelector(selector);
    if (!element) {
        element = document.createElement("meta");
        const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
        if (!match) return;
        element.setAttribute(match[1], match[2]);
        document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
}

function setLink(rel, href) {
    if (!href) return;
    let element = document.head.querySelector(`link[rel="${rel}"]`);
    if (!element) {
        element = document.createElement("link");
        element.rel = rel;
        document.head.appendChild(element);
    }
    element.href = href;
}

function hasStaticTracking(type, id) {
    return Boolean(
        document.querySelector(
            `[data-portfolio-${type}="${CSS.escape(id)}"]`
        )
    );
}

function injectGoogleAnalytics(measurementId) {
    const id = String(measurementId || "").trim().toUpperCase();
    if (!/^G-[A-Z0-9]+$/.test(id)) return;
    if (hasStaticTracking("ga", id)) return;
    if (document.querySelector(`[data-portfolio-ga="${id}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.dataset.portfolioGa = id;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    window.gtag("js", new Date());
    window.gtag("config", id);
}

function injectGoogleTagManager(containerId) {
    const id = String(containerId || "").trim().toUpperCase();
    if (!/^GTM-[A-Z0-9]+$/.test(id)) return;
    if (hasStaticTracking("gtm", id)) return;
    if (document.querySelector(`[data-portfolio-gtm="${id}"]`)) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    script.dataset.portfolioGtm = id;
    document.head.appendChild(script);
}

function renderSeo(seo) {
    if (!seo) return;
    if (seo.seo_title) document.title = seo.seo_title;

    setMeta('meta[name="description"]', "content", seo.seo_description);
    setMeta('meta[name="keywords"]', "content", seo.keywords);
    setMeta('meta[name="robots"]', "content", seo.robots);
    setMeta('meta[property="og:title"]', "content", seo.og_title || seo.seo_title);
    setMeta('meta[property="og:description"]', "content", seo.og_description || seo.seo_description);
    setMeta('meta[property="og:image"]', "content", seo.og_image);
    setMeta('meta[property="og:url"]', "content", seo.canonical_url);
    setMeta('meta[property="og:site_name"]', "content", seo.site_name);
    setMeta('meta[name="twitter:card"]', "content", seo.twitter_card);
    setMeta('meta[name="twitter:title"]', "content", seo.twitter_title || seo.og_title || seo.seo_title);
    setMeta('meta[name="twitter:description"]', "content", seo.twitter_description || seo.og_description || seo.seo_description);
    setMeta('meta[name="twitter:image"]', "content", seo.twitter_image || seo.og_image);
    setMeta('meta[name="google-site-verification"]', "content", seo.google_search_console);
    setMeta('meta[name="msvalidate.01"]', "content", seo.bing_webmaster);

    setLink("canonical", seo.canonical_url);
    if (seo.favicon_url) {
        setLink("icon", seo.favicon_url);
        setLink("shortcut icon", seo.favicon_url);
    }

    const gtmId = String(seo.google_tag_manager || "").trim();

    if (gtmId) {
        injectGoogleTagManager(gtmId);
    } else {
        injectGoogleAnalytics(seo.google_analytics);
    }
}

getPublicSeo()
    .then(renderSeo)
    .catch((error) => console.warn("Não foi possível carregar o SEO pelo CMS.", error));
