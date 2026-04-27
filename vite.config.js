import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import path from 'path'

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true, // Útil si los cambios no se reflejan en sistemas de archivos en red o WSL
    },
    host: true, // Permite acceso externo si es necesario
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  }
})
