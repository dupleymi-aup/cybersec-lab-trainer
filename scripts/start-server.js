/**
 * Start Next.js production server (standalone output).
 * Uses PORT from environment (Amvera) or finds an available port.
 */
const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.close();
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  const port = process.env.PORT || await findAvailablePort(parseInt(process.argv[2]) || 3000);
  const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
  const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
  });
  child.on('close', (code) => process.exit(code));
}

main();
