export default function sitemap() {
  const base = 'https://www.jeanspagolla.com.br';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/checkout`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/termos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/exclusao-de-dados`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
