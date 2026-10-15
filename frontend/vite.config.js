import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 5174 and 3001 (not 5173 and 3000) so this can run at the same time as the task board.
    // strictPort: if 5174 is taken, stop with an error instead of quietly picking another port.
    port: 5174,
    strictPort: true,
    host: true, // also listen on your Wi-Fi address, so you can open the app on your phone
    // The page asks Vite for /graphql, and Vite passes it on to the NestJS API.
    // Page and API then share one address: no CORS, and it works from the phone too.
    proxy: {
      '/graphql': 'http://localhost:3001',
    },
  },
})
