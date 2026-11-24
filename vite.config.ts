import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {execSync} from 'child_process';
import {VitePWA} from 'vite-plugin-pwa';

function buildVersion(): string {
  const cf = process.env.CF_PAGES_COMMIT_SHA;
  if (cf) return cf.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

/** Dev/preview builds get a distinct grey/red/white icon and app name. */
function isDevIconBuild(): boolean {
  if (process.env.WB_DEV_ICON === '1') return true;
  const branch = process.env.CF_PAGES_BRANCH;
  return Boolean(branch && branch !== 'main');
}

const DEV_THEME = '#4b5563';

function devIconHtml(): Plugin {
  return {
    name: 'dev-icon-html',
    transformIndexHtml(html) {
      if (!isDevIconBuild()) return html;
      return html
        .replaceAll('apple-touch-icon.png', 'apple-touch-icon-dev.png')
        .replace(
          'name="apple-mobile-web-app-title" content="Word Blitz"',
          'name="apple-mobile-web-app-title" content="Word Blitz DEV"',
        )
        .replace(
          'name="theme-color" content="#020617"',
          `name="theme-color" content="${DEV_THEME}"`,
        );
    },
  };
}

function pwaOptions() {
  const dev = isDevIconBuild();
  const iconDir = dev ? 'icons-dev' : 'icons';
  return {
    registerType: 'prompt' as const,
    includeAssets: [
      'favicon.ico',
      'favicon-32.png',
      dev ? 'apple-touch-icon-dev.png' : 'apple-touch-icon.png',
      `${iconDir}/icon-192.png`,
      `${iconDir}/icon-512.png`,
      `${iconDir}/icon-512-maskable.png`,
    ],
    manifest: {
      ...(dev ? {id: './?dev'} : {}),
      name: dev ? 'Word Blitz DEV' : 'Word Blitz Classic',
      short_name: dev ? 'Word Blitz DEV' : 'Word Blitz',
      description:
        'Fast-paced hexagonal falling-letter word puzzle game. Spell words to clear hexagonal tiles before the stack reaches the top.',
      start_url: './',
      scope: './',
      // standalone so the nav bar can come back with the keyboard; src/utils/immersive.ts
      // hides it with the Fullscreen API the rest of the time.
      display: 'standalone' as const,
      orientation: 'portrait' as const,
      background_color: '#020617',
      theme_color: dev ? DEV_THEME : '#020617',
      lang: 'en',
      categories: ['games', 'education'],
      icons: [
        {
          src: `${iconDir}/icon-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any' as const,
        },
        {
          src: `${iconDir}/icon-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any' as const,
        },
        {
          src: `${iconDir}/icon-512-maskable.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable' as const,
        },
      ],
    },
  };
}

/** Write version.json at build time so the installed app can compare versions over the network. */
function emitVersionJson(version: string): Plugin {
  return {
    name: 'emit-version-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({version}),
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      emitVersionJson(buildVersion()),
      devIconHtml(),
      VitePWA({
        ...pwaOptions(),
        workbox: {
          cleanupOutdatedCaches: true,
          // Dictionary (words.json) is bundled into the JS build and precached with it.
          // version.json must stay uncached so the app can see a new build over the network.
          // index.html is omitted: Cloudflare Pages 308s /index.html to /, which makes
          // precache install fail and silently drops the update.
          // Word mp3s are runtime-cached (CacheFirst, 'word-audio-v4') so a new SW stays
          // small and can install quickly; first offline play of an unheard word needs a network fetch.
          // Cache name is versioned so a voice/asset regen is fetched fresh after update.
          globIgnores: ['**/version.json', '**/index.html', '**/*.mp3'],
          globPatterns: [
            '**/*.{js,css,ico,png,svg,webmanifest,json,woff,woff2,ttf,webp}',
          ],
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /\/version\.json(\?.*)?$/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\/audio\/.*\.mp3(\?.*)?$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'word-audio-v4',
                expiration: {
                  maxEntries: 400,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {statuses: [0, 200]},
              },
            },
            {
              urlPattern: ({request}) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
                cacheableResponse: {statuses: [0, 200]},
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {statuses: [0, 200]},
              },
            },
          ],
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion()),
      // Tip jar: off on live (main) until James says so; on for dev/preview builds.
      __SHOW_TIPS__: JSON.stringify(isDevIconBuild()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
