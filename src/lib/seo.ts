import { getSiteUrl } from './clientEnv';

export interface MetaConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  noindex?: boolean;
}

export function updateMetaTags(config: MetaConfig): void {
  const { title, description, canonicalPath = '', noindex = false } = config;
  
  // 1. Update Title
  const suffix = 'Maa Sita Int Udhyog';
  const fullTitle = title === suffix ? title : `${title} | ${suffix}`;
  document.title = fullTitle;

  // Helper to get or create tag
  const getOrCreateMeta = (attr: string, value: string): HTMLMetaElement => {
    let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    return el;
  };

  // 2. Update Description
  const descMeta = getOrCreateMeta('name', 'description');
  descMeta.content = description;

  // 3. Update Robots/Noindex
  const robotsMeta = getOrCreateMeta('name', 'robots');
  robotsMeta.content = noindex ? 'noindex, nofollow' : 'index, follow';

  // 4. Update Canonical Link
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonicalUrl;

  // 5. Open Graph Metadata
  const ogTitle = getOrCreateMeta('property', 'og:title');
  ogTitle.content = fullTitle;

  const ogDesc = getOrCreateMeta('property', 'og:description');
  ogDesc.content = description;

  const ogUrl = getOrCreateMeta('property', 'og:url');
  ogUrl.content = canonicalUrl;

  const ogType = getOrCreateMeta('property', 'og:type');
  ogType.content = 'website';

  const ogImage = getOrCreateMeta('property', 'og:image');
  ogImage.content = `${siteUrl}/experience/posters/poster-entrance.png`;
}

/**
 * Injects a JSON-LD structured data script into the head.
 */
export function injectStructuredData(data: Record<string, unknown>): void {
  // Clear any existing JSON-LD script
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}
