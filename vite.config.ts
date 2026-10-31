import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Framework code changes rarely — keep it in its own long-cacheable chunk.
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/, priority: 20 },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 15 },
            // Generative engine is shared by landing demo, darkroom, album and detail.
            { name: 'engine', test: /src[\\/]engine[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
