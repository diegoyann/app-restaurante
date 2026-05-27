import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const workspaceRoot = resolve(__dirname, '../../..')
const sharedRoot = resolve(workspaceRoot, 'shared')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': sharedRoot,
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    fs: {
      allow: [workspaceRoot],
    },
  },
})
