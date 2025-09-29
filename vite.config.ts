import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => {
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';

  if (isGitHubPages) {
    // Build for GitHub Pages demo
    return {
      base: '/browser-vad/',
      build: {
        outDir: 'dist',
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html')
          }
        }
      },
      plugins: [
        viteStaticCopy({
          targets: [
            {
              src: 'public/models/*',
              dest: 'models'
            },
            {
              src: 'node_modules/onnxruntime-web/dist/*.wasm',
              dest: 'onnx'
            }
          ]
        })
      ],
      worker: {
        format: 'es'
      },
      optimizeDeps: {
        exclude: ['onnxruntime-web']
      }
    };
  }

  // Default library build
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'BrowserVAD',
        fileName: (format) => `browser-vad.${format}.js`,
        formats: ['es', 'umd']
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {}
        }
      }
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'public/models/*',
            dest: 'models'
          },
          {
            src: 'node_modules/onnxruntime-web/dist/*.wasm',
            dest: 'onnx'
          }
        ]
      })
    ],
    worker: {
      format: 'es'
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web']
    }
  };
});