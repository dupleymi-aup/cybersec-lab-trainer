/**
 * Find an available port and start Next.js production server on it.
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
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

const startPort = parseInt(process.argv[2]) || 3000;
const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');

findAvailablePort(startPort).then((port) => {
  console.log(`\n Starting Next.js production server on port ${port}...\n`);

  const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
  });

  child.on('close', (code) => process.exit(code));
});
