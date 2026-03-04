import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Custom plugin to prevent Vite from processing Vercel serverless functions
function excludeApiPlugin() {
  return {
    name: 'exclude-api-serverless',
    configureServer(server: any) {
      // Intercept /api/ requests BEFORE Vite tries to transform them
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/')) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'API routes are only available in production (Vercel).'
          }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    // Intercept /api/ before other plugins process them
    excludeApiPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

