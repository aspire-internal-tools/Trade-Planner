import fs from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Resolve the true long-form path. The launch config starts the dev server
// through the Windows 8.3 short path (the folder name contains spaces), and
// vite's file resolution breaks when root is a short path.
const appRoot = fs.realpathSync.native(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig(() => ({
  root: appRoot,
  // Azure Static Web Apps serves this app from the root. A future subpath
  // deployment can override the base without changing source code.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
}))
