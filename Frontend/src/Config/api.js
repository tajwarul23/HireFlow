// Backend address. Vite reads it from .env.development during `npm run dev`
// and from .env.production during `npm run build` (Vercel).
export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("VITE_API_URL is not set. Check Frontend/.env.development and .env.production.");
}
