'use client';

import { useEffect } from 'react';

export default function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'json-ld';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.getElementById('json-ld')?.remove();
    };
  }, [data]);

  return null;
}
