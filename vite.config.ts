import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/ag-grid')) return 'ag-grid'
          if (id.includes('node_modules/vue')) return 'vue'
        },
      },
    },
  },
})