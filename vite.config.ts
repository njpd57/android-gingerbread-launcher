import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// which build is running, for the "Acerca de" dialog: the commit, whether there were uncommitted
// changes, and when it was built
function buildInfo()
{
    const git = (cmd: string) =>
    {
        try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); }
        catch { return ''; }
    };
    return {
        commit: git('rev-parse --short HEAD') || 'desconocido',
        dirty: git('status --porcelain --untracked-files=no') !== '',
        date: new Date().toISOString(),
    };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo()),
  },
  plugins: [
    vue({
      script: {
        defineModel: true
      }
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/assets/styles/shared/vars.scss" as *;
        `
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      },
      preserveSymlinks: true,
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
