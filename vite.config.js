import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let branchName = 'development';
try {
  branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (e) {
  console.warn('Error al obtener la rama git:', e.message);
}

export default defineConfig({
  define: {
    __GIT_BRANCH__: JSON.stringify(branchName),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        reports: resolve(__dirname, 'reports.html'),
        users: resolve(__dirname, 'users.html'),
        initiatives: resolve(__dirname, 'initiatives.html'),
        kpis: resolve(__dirname, 'kpis.html'),
        execution: resolve(__dirname, 'execution.html'),
      },
    },
  },
});
