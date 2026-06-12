import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        expenses: resolve(__dirname, 'expenses.html'),
        goals: resolve(__dirname, 'goals.html'),
        reports: resolve(__dirname, 'reports.html'),
      },
    },
  },
});
