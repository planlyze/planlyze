import { useEffect } from 'react';

export default function SEOSchema({ faqs, lang }) {
  useEffect(() => {
    // Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Planlyze AI",
      "url": "https://planlyze.ai",
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919d7be088a309080879f3d/1d57ae70b_Main_logo-01.png",
      "description": "AI-powered business strategy generator for tech startups with focus on Syrian market data",
      "sameAs": [
        "https://twitter.com/planlyze",
        "https://linkedin.com/company/planlyze"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@planlyze.ai",
        "contactType": "customer service"
      }
    };

    // FAQ Schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    // Software Application Schema
    const softwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Planlyze AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "90",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150"
      }
    };

    // Add schemas to head
    const addSchema = (schema, id) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    addSchema(organizationSchema, 'organization-schema');
    addSchema(faqSchema, 'faq-schema');
    addSchema(softwareSchema, 'software-schema');

    return () => {
      ['organization-schema', 'faq-schema', 'software-schema'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [faqs, lang]);

  return null;
}
