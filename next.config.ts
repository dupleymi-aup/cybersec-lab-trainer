import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const baseConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [];
  },
  async headers() {
    // Единая свободная политика для всех окружений:
    // ничего не блокируем — скрипты/стили из любых источников,
    // встраивание в iframe (LMS), формы на внешние URL (OIDC).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:",
      "style-src 'self' 'unsafe-inline' https: http: data:",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https: http:",
      "connect-src 'self' https: http: wss: ws: data: blob:",
      "media-src 'self' data: blob: https: http:",
      "object-src 'self'",
      "frame-src 'self' https: http:",
      "base-uri 'self'",
      "form-action *",
      "frame-ancestors *",
      "worker-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: `${csp}; report-uri /api/csp-report`,
          },
        ],
      },
    ];
  },
};

const nextConfig = {...baseConfig};
export default withNextIntl(nextConfig);
