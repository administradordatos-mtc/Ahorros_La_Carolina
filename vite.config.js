import { defineConfig } from 'vite';
import { resolve } from 'path';

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
