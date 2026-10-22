import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  // Fixed, because the backend only accepts the dashboard from this origin in dev (CORS, application-dev.yml).
  server: { port: 5174, strictPort: true },
})
