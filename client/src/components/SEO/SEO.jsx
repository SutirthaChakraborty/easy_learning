import { useEffect } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.learnigo.eu").replace(/\/$/, "");
const DEFAULT_TITLE = "Learningo | Gamified Learning for Children Who Learn Differently";
const DEFAULT_DESCRIPTION = "Learningo is an AI-based, gamified learning platform for children who learn differently, with accessible reading, writing, listening, speaking, maths and science practice.";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";

function upsertMeta(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function SEO({
  title,
  description,
  path = "/",
  type = "website",
  structuredData,
  noIndex = false,
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : DEFAULT_ROBOTS);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    let script = document.head.querySelector("script[data-learningo-schema]");
    if (noIndex) {
      script?.remove();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.dataset.learningoSchema = "true";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData || {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url: canonicalUrl,
        isPartOf: { "@type": "WebSite", name: "Learningo", url: SITE_URL },
      });
    }

    return () => {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector("script[data-learningo-schema]")?.remove();
      document.title = DEFAULT_TITLE;
      upsertMeta("name", "description", DEFAULT_DESCRIPTION);
      upsertMeta("name", "robots", DEFAULT_ROBOTS);
      upsertMeta("property", "og:title", DEFAULT_TITLE);
      upsertMeta("property", "og:description", DEFAULT_DESCRIPTION);
      upsertMeta("name", "twitter:title", DEFAULT_TITLE);
      upsertMeta("name", "twitter:description", DEFAULT_DESCRIPTION);
    };
  }, [description, path, structuredData, title, type, noIndex]);

  return null;
}

export { SITE_URL };