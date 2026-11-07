const backend = new URL(process.env.RENDER_API_ORIGIN);

if (backend.protocol !== "https:" || !backend.hostname.endsWith(".onrender.com") ||
    backend.username || backend.password || backend.href !== backend.origin + "/") {
  throw new Error("RENDER_API_ORIGIN debe ser el origen HTTPS del backend en Render.");
}

export const config = {
  framework: "angular",
  installCommand: "npx --yes npm@11.21.1 ci",
  buildCommand: "npm run build",
  outputDirectory: "dist/storefront/browser",
  rewrites: [
    { source: "/api/:path*", destination: backend.origin + "/api/:path*" },
    { source: "/:path*", destination: "/index.html" }
  ]
};
