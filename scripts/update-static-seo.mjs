import { readFile, writeFile } from "node:fs/promises";

const INDEX_PATH = new URL("../index.html", import.meta.url);
const CONFIG_PATH = new URL("../js/config/portfolio-config.js", import.meta.url);
const SEO_START = "<!-- PORTFOLIO_STATIC_SEO_START -->";
const SEO_END = "<!-- PORTFOLIO_STATIC_SEO_END -->";
const NOSCRIPT_START = "<!-- PORTFOLIO_STATIC_GTM_NOSCRIPT_START -->";
const NOSCRIPT_END = "<!-- PORTFOLIO_STATIC_GTM_NOSCRIPT_END -->";

function readConfigValue(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*[\"']([^\"']*)[\"']`));
  return match?.[1]?.trim() || "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function metaName(name, content) {
  return content ? `    <meta name="${name}" content="${escapeHtml(content)}">` : "";
}

function metaProperty(property, content) {
  return content ? `    <meta property="${property}" content="${escapeHtml(content)}">` : "";
}

function replaceMarkedBlock(source, start, end, content) {
  const expression = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!expression.test(source)) {
    throw new Error(`Marcadores não encontrados: ${start}`);
  }
  return source.replace(expression, `${start}\n${content}\n    ${end}`);
}

function validGa(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^G-[A-Z0-9]+$/.test(id) ? id : "";
}

function validGtm(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : "";
}

const configSource = await readFile(CONFIG_PATH, "utf8");
const supabaseUrl = readConfigValue(configSource, "supabaseUrl").replace(/\/$/, "");
const anonKey = readConfigValue(configSource, "supabaseAnonKey");
const ownerUserId = readConfigValue(configSource, "ownerUserId");

if (!supabaseUrl || !anonKey || !ownerUserId) {
  throw new Error("Configuração pública do Supabase incompleta.");
}

const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_portfolio_content`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ requested_owner_user_id: ownerUserId }),
});

if (!response.ok) {
  throw new Error(`RPC pública falhou (${response.status}): ${await response.text()}`);
}

const content = await response.json();
if (!content?.meta?.found || !content?.profile) {
  throw new Error("O perfil está privado ou não foi encontrado. SEO estático não alterado.");
}

const profile = content.profile || {};
const seo = content.seo || {};
const settings = content.settings || {};
const title = seo.seo_title || `${profile.full_name || "Portfólio"} | Portfólio`;
const description = seo.seo_description || profile.short_bio || profile.bio || "Portfólio profissional.";
const canonical = seo.canonical_url || "https://gabrielnt0.github.io/portfolio/";
const siteName = seo.site_name || profile.full_name || "Portfólio";
const ogTitle = seo.og_title || title;
const ogDescription = seo.og_description || description;
const ogImage = seo.og_image || profile.avatar_url || "";
const twitterTitle = seo.twitter_title || ogTitle;
const twitterDescription = seo.twitter_description || ogDescription;
const twitterImage = seo.twitter_image || ogImage;
const gaId = validGa(settings.google_analytics_enabled ? settings.google_analytics_measurement_id : "");
const gtmId = validGtm(seo.google_tag_manager);

const lines = [
  metaName("description", description),
  metaName("author", profile.full_name),
  metaName("keywords", seo.keywords),
  metaName("robots", seo.robots || "index, follow"),
  metaName("google-site-verification", seo.google_search_console),
  metaName("msvalidate.01", seo.bing_webmaster),
  `    <link rel="canonical" href="${escapeHtml(canonical)}">`,
  metaProperty("og:type", "website"),
  metaProperty("og:locale", "pt_BR"),
  metaProperty("og:title", ogTitle),
  metaProperty("og:description", ogDescription),
  metaProperty("og:url", canonical),
  metaProperty("og:site_name", siteName),
  metaProperty("og:image", ogImage),
  metaName("twitter:card", seo.twitter_card || "summary_large_image"),
  metaName("twitter:title", twitterTitle),
  metaName("twitter:description", twitterDescription),
  metaName("twitter:image", twitterImage),
  `    <title>${escapeHtml(title)}</title>`,
].filter(Boolean);

if (gaId && !gtmId) {
  lines.push(
    `    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`,
    "    <script>",
    "      window.dataLayer = window.dataLayer || [];",
    "      function gtag(){dataLayer.push(arguments);}",
    "      gtag('js', new Date());",
    `      gtag('config', '${gaId}');`,
    "    </script>",
  );
}

if (gtmId) {
  lines.push(
    "    <script>",
    "      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':",
    "      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],",
    "      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=",
    `      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);`,
    `      })(window,document,'script','dataLayer','${gtmId}');`,
    "    </script>",
  );
}

let indexSource = await readFile(INDEX_PATH, "utf8");
indexSource = replaceMarkedBlock(indexSource, SEO_START, SEO_END, lines.join("\n"));

const noscript = gtmId
  ? `    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`
  : "";
indexSource = replaceMarkedBlock(indexSource, NOSCRIPT_START, NOSCRIPT_END, noscript);

await writeFile(INDEX_PATH, indexSource, "utf8");
console.log("SEO estático atualizado com sucesso.");
