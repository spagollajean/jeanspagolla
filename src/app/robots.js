export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/painel'],
    },
    sitemap: 'https://www.jeanspagolla.com.br/sitemap.xml',
  };
}
