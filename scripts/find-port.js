const net = require('net');
const { spawn } = require('child_process');

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
  const arg = process.argv[2];
  const startPort = arg === '--port' ? parseInt(process.argv[3]) : parseInt(arg) || 3000;
  const port = await findAvailablePort(startPort);
  console.log(`\n Starting Next.js on port ${port}...\n`);
const nextBin = require('path').join(__dirname, '..', 'node_modules', '.bin', 'next.cmd');
const child = spawn(nextBin, ['dev', '-p', String(port)], { stdio: 'inherit', shell: true });
  child.on('close', (code) => process.exit(code));
}

main();
