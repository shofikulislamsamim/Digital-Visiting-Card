import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          business: path.resolve(__dirname, 'business.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    plugins: [
      {
        name: 'kds-static-multi-page-plugin',
        closeBundle() {
          const copyDir = (srcDir: string, destDir: string) => {
            if (!fs.existsSync(srcDir)) return;
            fs.mkdirSync(destDir, { recursive: true });
            const entries = fs.readdirSync(srcDir, { withFileTypes: true });
            for (const entry of entries) {
              const srcPath = path.join(srcDir, entry.name);
              const destPath = path.join(destDir, entry.name);
              if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
              } else {
                fs.copyFileSync(srcPath, destPath);
              }
            }
          };

          // 1. Ensure js files are copied to dist/js
          copyDir(path.resolve(__dirname, 'js'), path.resolve(__dirname, 'dist/js'));

          // 2. Ensure raw assets are copied to dist/assets
          copyDir(path.resolve(__dirname, 'assets'), path.resolve(__dirname, 'dist/assets'));

          // 3. Ensure clean directory route redirects for /admin and /business in published static environments
          const distDir = path.resolve(__dirname, 'dist');
          const adminDir = path.join(distDir, 'admin');
          fs.mkdirSync(adminDir, { recursive: true });
          fs.writeFileSync(
            path.join(adminDir, 'index.html'),
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=../admin.html">
  <title>Redirecting to Admin Portal...</title>
  <script>window.location.replace("../admin.html");</script>
</head>
<body style="background:#0b0f19;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Loading Admin Portal... <a href="../admin.html" style="color:#38bdf8;">Click here if not redirected</a>.</p>
</body>
</html>`
          );

          const businessDir = path.join(distDir, 'business');
          fs.mkdirSync(businessDir, { recursive: true });
          fs.writeFileSync(
            path.join(businessDir, 'index.html'),
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=../business.html">
  <title>Redirecting to Business Profile...</title>
  <script>window.location.replace("../business.html");</script>
</head>
<body style="background:#0b0f19;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Loading Business Profile... <a href="../business.html" style="color:#38bdf8;">Click here if not redirected</a>.</p>
</body>
</html>`
          );
        },
      },
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
