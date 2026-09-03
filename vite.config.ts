import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command, mode }) => {
  const isKeyConfigured = Boolean(process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 0);
  console.log(`[MatrixLab Build] Gemini API key configured: ${isKeyConfigured ? 'YES' : 'NO'}`);

  return {
    base: '/matrixlab/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
