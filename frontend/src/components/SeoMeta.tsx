// frontend/src/components/SeoMeta.tsx

import { Helmet } from 'react-helmet-async';

type SeoProps = {
  title: string;
  description?: string;
  canonical?: string;
  jsonLd?: Record<string, any>;
};

export const SeoMeta = ({ title, description, canonical, jsonLd }: SeoProps) => (
  <Helmet>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {canonical && <link rel="canonical" href={canonical} />}
    
    {/* Open Graph */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description || ''} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical || window.location.href} />
    
    {/* JSON-LD */}
    {jsonLd && (
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    )}
  </Helmet>
);