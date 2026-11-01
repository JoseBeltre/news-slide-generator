import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['tests/unit/**/*.test.ts'],
            environment: 'node',
            // Zona horaria de la iglesia: detecta fechas 'YYYY-MM-DD' leídas como UTC (un día menos en RD).
            env: { TZ: 'America/Santo_Domingo' },
          },
        },
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['tests/browser/**/*.test.ts'],
            setupFiles: ['tests/browser/setup.ts'],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({ contextOptions: { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' } }),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
