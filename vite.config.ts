import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Sous-dossier de publication, ex. `/trombine/` pour GitHub Pages
const base = process.env.BASE_PATH ?? '/'

const config = defineConfig({
  base,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    // Tout se passe dans le navigateur : la page est prérendue en HTML statique
    tanstackStart({ prerender: { enabled: true } }),
    viteReact(),
  ],
})

export default config
