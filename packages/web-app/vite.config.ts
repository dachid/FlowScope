import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()] as any,
  build: {
    rollupOptions: {
      // Fix for plugin compatibility
      external: [],
    },
  },
})
