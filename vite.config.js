import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Guarantees test anchor slots are always present (safe — site uses mock data only)
  define: {
    'import.meta.env.VITE_TEST_MODE': JSON.stringify('true'),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
