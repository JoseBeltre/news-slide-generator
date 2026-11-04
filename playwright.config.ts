import { defineConfig, devices } from '@playwright/test'

// Dos servidores: el build de producción (E2E offline, 4173) y `pnpm dev` para la galería de slides (5174),
// que solo existe en desarrollo.
export default defineConfig({
  testDir: 'tests/e2e',
  // Capturas base de la galería solo locales (en .gitignore): si faltan, se crean en la primera corrida.
  updateSnapshots: 'missing',
  projects: [
    {
      name: 'chromium',
      testIgnore: /galeria\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173' },
    },
    {
      name: 'galeria',
      testMatch: /galeria\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174', viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: [
    {
      command: 'pnpm build && pnpm preview',
      // E2E sin nube aunque haya .env.local: las variables del proceso ganan a los archivos .env.
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev --port 5174 --strictPort',
      url: 'http://localhost:5174/galeria.html',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
