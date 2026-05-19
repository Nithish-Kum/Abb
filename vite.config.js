import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'scada-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/machines' && req.method === 'GET') {
            const dirPath = path.resolve(__dirname, 'public/machine_configs');
            try {
              if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
              }
              const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(files));
            } catch (err) {
              res.writeHead(500);
              res.end('Error reading machine configs directory: ' + err.message);
            }
          } else if (req.url === '/api/add-machine' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const machine = JSON.parse(body);
                const machineId = machine.machineId;
                if (!machineId) {
                  res.writeHead(400);
                  res.end('Missing machineId');
                  return;
                }
                const dirPath = path.resolve(__dirname, 'public/machine_configs');
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }
                const filePath = path.resolve(dirPath, `${machineId}.json`);
                fs.writeFileSync(filePath, JSON.stringify(machine, null, 2), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.writeHead(500);
                res.end(err.message);
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    watch: {
      ignored: ['**/public/datasets/**']
    }
  }
})
