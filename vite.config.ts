import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
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
});