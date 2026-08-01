import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const CONFIG_PATH = new URL("js/config/portfolio-config.js", ROOT);
const INDEX_PATH = new URL("index.html", ROOT);

function getConfigValue(source, key) {
  const expression = new RegExp(
    `${key}\\s*:\\s*["']([^"']*)["']`
  );
  return source.match(expression)?.[1]?.trim() || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceMeta(html, attribute, name, value) {
  if (!value) return html;

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta\\s+${attribute}=["']${escapedName}["'][\\s\\S]*?>`,
    "i"
  );
  const element =
    `<meta ${attribute}="${escapeHtml(name)}" ` +
    `content="${escapeHtml(value)}">`;

  if (pattern.test(html)) return html.replace(pattern, element);
  return html.replace("</head>", `    ${element}\n</head>`);
}

function replaceLink(html, rel, href) {
  if (!href) return html;

  const escapedRel = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<link\\s+[^>]*rel=["']${escapedRel}["'][\\s\\S]*?>`,
    "i"
  );
  const element =
    `<link rel="${escapeHtml(rel)}" href="${escapeHtml(href)}">`;

  if (pattern.test(html)) return html.replace(pattern, element);
  return html.replace("</head>", `    ${element}\n</head>`);
}

function replaceManagedBlock(html, start, end, content) {
  const pattern = new RegExp(
    `(${start})[\\s\\S]*?(${end})`,
    "m"
  );

  return html.replace(
    pattern,
    `${start}\n${content.trim()}\n    ${end}`
  );
}

function createTracking(seo) {
  const gtm = String(seo.google_tag_manager || "")
    .trim()
    .toUpperCase();
  const ga = String(
    seo.__analytics_measurement_id || seo.google_analytics || ""
  )
    .trim()
    .toUpperCase();

  if (/^GTM-[A-Z0-9]+$/.test(gtm)) {
    return {
      head: `    <script data-portfolio-gtm="${gtm}">
        (function(w,d,s,l,i){
          w[l]=w[l]||[];
          w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});
          var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!="dataLayer"?"&l="+l:"";
          j.async=true;
          j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;
          f.parentNode.insertBefore(j,f);
        })(window,document,"script","dataLayer","${gtm}");
      </script>`,
      body: `    <noscript>
        <iframe
          data-portfolio-gtm="${gtm}"
          src="https://www.googletagmanager.com/ns.html?id=${gtm}"
          height="0"
          width="0"
          style="display:none;visibility:hidden"
          title="Google Tag Manager"
        ></iframe>
      </noscript>`
    };
  }

  if (/^G-[A-Z0-9]+$/.test(ga)) {
    return {
      head: `    <script
        async
        data-portfolio-ga="${ga}"
        src="https://www.googletagmanager.com/gtag/js?id=${ga}"
      ></script>
      <script data-portfolio-ga="${ga}">
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag("js", new Date());
        gtag("config", "${ga}");
      </script>`,
      body: "    <!-- Google Analytics does not require a noscript iframe. -->"
    };
  }

  return {
    head: "    <!-- No GA/GTM identifier is configured in the CMS. -->",
    body: "    <!-- No tracking fallback is required. -->"
  };
}

async function fetchPublicContent(config) {
  const response = await fetch(
    `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/get_public_portfolio_content`,
    {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requested_owner_user_id: config.ownerUserId || null
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `RPC ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

const configSource = await readFile(CONFIG_PATH, "utf8");
const config = {
  supabaseUrl: getConfigValue(configSource, "supabaseUrl"),
  supabaseAnonKey: getConfigValue(configSource, "supabaseAnonKey"),
  ownerUserId: getConfigValue(configSource, "ownerUserId")
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error("Supabase não está configurado em portfolio-config.js.");
}

const content = await fetchPublicContent(config);

if (!content?.meta?.found || !content?.profile) {
  throw new Error(
    "O perfil público não foi encontrado. Confirme is_public no CMS."
  );
}

const seo = {
  ...(content.seo || {}),
  __analytics_measurement_id:
    content.settings?.google_analytics_enabled
      ? content.settings?.google_analytics_measurement_id
      : ""
};
const profile = content.profile || {};
const canonical =
  seo.canonical_url || "https://gabrielnt0.github.io/portfolio/";
const title =
  seo.seo_title ||
  `${profile.full_name || "Gabriel Andrade"} | Portfólio`;
const description =
  seo.seo_description ||
  profile.short_bio ||
  "Portfólio profissional.";
const ogTitle = seo.og_title || title;
const ogDescription = seo.og_description || description;
const twitterTitle = seo.twitter_title || ogTitle;
const twitterDescription =
  seo.twitter_description || ogDescription;
const ogImage = seo.og_image || seo.twitter_image;
const tracking = createTracking(seo);

let html = await readFile(INDEX_PATH, "utf8");

html = html.replace(
  /<title>[\s\S]*?<\/title>/i,
  `<title>${escapeHtml(title)}</title>`
);

html = replaceMeta(html, "name", "description", description);
html = replaceMeta(html, "name", "author", profile.full_name);
html = replaceMeta(html, "name", "keywords", seo.keywords);
html = replaceMeta(html, "name", "robots", seo.robots || "index, follow");
html = replaceMeta(html, "property", "og:title", ogTitle);
html = replaceMeta(html, "property", "og:description", ogDescription);
html = replaceMeta(html, "property", "og:url", canonical);
html = replaceMeta(
  html,
  "property",
  "og:site_name",
  seo.site_name || profile.full_name
);
html = replaceMeta(html, "property", "og:image", ogImage);
html = replaceMeta(
  html,
  "name",
  "twitter:card",
  seo.twitter_card || "summary_large_image"
);
html = replaceMeta(html, "name", "twitter:title", twitterTitle);
html = replaceMeta(
  html,
  "name",
  "twitter:description",
  twitterDescription
);
html = replaceMeta(
  html,
  "name",
  "twitter:image",
  seo.twitter_image || ogImage
);
html = replaceMeta(
  html,
  "name",
  "google-site-verification",
  seo.google_search_console
);
html = replaceMeta(
  html,
  "name",
  "msvalidate.01",
  seo.bing_webmaster
);
html = replaceLink(html, "canonical", canonical);

if (seo.favicon_url) {
  html = replaceLink(html, "icon", seo.favicon_url);
  html = replaceLink(html, "shortcut icon", seo.favicon_url);
}

html = replaceManagedBlock(
  html,
  "<!-- PORTFOLIO_TRACKING_HEAD_START -->",
  "<!-- PORTFOLIO_TRACKING_HEAD_END -->",
  tracking.head
);
html = replaceManagedBlock(
  html,
  "<!-- PORTFOLIO_TRACKING_BODY_START -->",
  "<!-- PORTFOLIO_TRACKING_BODY_END -->",
  tracking.body
);

await writeFile(INDEX_PATH, html, "utf8");
console.log("SEO estático sincronizado com sucesso.");
