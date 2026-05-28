/**
 * Auto-start script: Detects database type from DATABASE_URL and starts required services.
 * Supports: PostgreSQL, MySQL, MSSQL, ClickHouse, Oracle
 * Usage: node scripts/auto-start.js [port]
 */
const net = require('net');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('⚠ Warning: .env file not found', 'yellow');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

// Detect database type from DATABASE_URL
function detectDatabaseType(databaseUrl) {
  if (!databaseUrl) {
    return { type: 'none', host: 'localhost', port: null, name: null };
  }
  
  const patterns = {
    postgresql: /^postgresql:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    postgres: /^postgres:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    mysql: /^mysql:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    mssql: /^mssql:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    sqlserver: /^sqlserver:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    clickhouse: /^clickhouse:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    oracle: /^oracle:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
    oracledb: /^oracledb:\/\/(?:(\w+):(\w+)@)?([^:]+):(\d+)\/(\w+)/,
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const match = databaseUrl.match(pattern);
    if (match) {
      const normalizedType = type === 'postgres' ? 'postgresql' : 
                            type === 'sqlserver' ? 'mssql' : 
                            type === 'oracledb' ? 'oracle' : type;
      return {
        type: normalizedType,
        user: match[1] || 'root',
        password: match[2] || '',
        host: match[3] || 'localhost',
        port: parseInt(match[4]),
        name: match[5],
        url: databaseUrl,
      };
    }
  }
  
  return { type: 'unknown', url: databaseUrl };
}

// Get default ports for each database type
const defaultPorts = {
  postgresql: 5432,
  mysql: 3306,
  mssql: 1433,
  clickhouse: 8123,
  oracle: 1521,
};

// Get Docker image for database type
const dockerImages = {
  postgresql: 'postgres:16-alpine',
  mysql: 'mysql:8.0',
  mssql: 'mcr.microsoft.com/mssql/server:2022-latest',
  clickhouse: 'clickhouse/clickhouse-server:latest',
  oracle: 'gvenzl/oracle-xe:21-slim',
};

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Find available port starting from startPort
function findAvailablePort(startPort = 3000, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attempt) => {
      if (attempt > maxAttempts) {
        reject(new Error(`Could not find available port after ${maxAttempts} attempts`));
        return;
      }
      
      const server = net.createServer();
      server.listen(port, '0.0.0.0', () => {
        const { port: foundPort } = server.address();
        // Double-check: try to connect to ensure port is really free
        const tester = net.createConnection({ port: foundPort, host: '127.0.0.1' }, () => {
          tester.destroy();
          server.close(() => {
            // Wait a bit for port to fully free
            setTimeout(() => resolve(foundPort), 100);
          });
        });
        tester.on('error', () => {
          // Port is free (connection refused means no one is listening)
          server.close(() => resolve(foundPort));
        });
        tester.setTimeout(500, () => {
          tester.destroy();
          server.close(() => resolve(foundPort));
        });
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          server.close();
          log(`  Port ${port} is in use, trying ${port + 1}...`, 'yellow');
          tryPort(port + 1, attempt + 1);
        } else {
          reject(err);
        }
      });
    };
    
    tryPort(startPort, 1);
  });
}

// Check if Docker is running
function isDockerRunning() {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'docker info' : 'docker info';
    const child = spawn(cmd, [], { shell: true, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => (output += data));
    child.stderr.on('data', (data) => (output += data));
    child.on('close', (code) => resolve(code === 0));
  });
}

// Start database in Docker
async function startDatabaseInDocker(dbConfig) {
  const { type, host, port, name, user, password } = dbConfig;
  
  log(`\n📦 Database: ${type.toUpperCase()}`, 'cyan');
  log(`   Host: ${host}:${port}`, 'cyan');
  log(`   Database: ${name}`, 'cyan');
  
  // Check if database is already running
  const portAvailable = await isPortAvailable(port);
  
  if (!portAvailable) {
    log(`✓ Database appears to be running on port ${port}`, 'green');
    return true;
  }
  
  log(`\n⚠ Database not detected on port ${port}`, 'yellow');
  
  // Check Docker
  const dockerRunning = await isDockerRunning();
  if (!dockerRunning) {
    log('✗ Docker is not running. Please start Docker Desktop.', 'red');
    return false;
  }
  
  const startDocker = await ask(`\nStart ${type} in Docker container? (y/n): `);
  if (startDocker.toLowerCase() !== 'y') {
    log('Skipping database startup. Please start it manually.', 'yellow');
    return false;
  }
  
  const imageName = dockerImages[type];
  const containerName = `cybersec-${type}`;
  
  log(`\n🚀 Starting ${imageName}...`, 'blue');
  
  let dockerArgs = [];
  let envVars = [];
  
  switch (type) {
    case 'postgresql':
      envVars = ['POSTGRES_PASSWORD=' + (password || 'postgres'), 
                 'POSTGRES_DB=' + name];
      break;
    case 'mysql':
      envVars = ['MYSQL_ROOT_PASSWORD=' + (password || 'mysql'), 
                 'MYSQL_DATABASE=' + name];
      break;
    case 'mssql':
      envVars = ['ACCEPT_EULA=Y', 
                 'SA_PASSWORD=' + (password || 'YourStrong@Passw0rd')];
      break;
    case 'clickhouse':
      envVars = ['CLICKHOUSE_DB=' + name,
                 'CLICKHOUSE_USER=' + (user || 'default'),
                 'CLICKHOUSE_PASSWORD=' + (password || ''),
                 'CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1'];
      break;
    case 'oracle':
      envVars = ['ORACLE_PASSWORD=' + (password || 'oracle'),
                 'APP_USER=' + (user || 'cybersec'),
                 'APP_USER_PASSWORD=' + (password || 'oracle')];
      break;
  }
  
  dockerArgs = [
    'run', '-d', '--name', containerName,
    '-p', `${port}:${port}`,
    ...envVars.flatMap(e => ['-e', e]),
    imageName,
  ];
  
  return new Promise((resolve) => {
    const docker = spawn('docker', dockerArgs, { shell: true, stdio: 'inherit' });
    docker.on('close', (code) => {
      if (code === 0) {
        log(`✓ ${type} container started successfully!`, 'green');
        log(`   Container: ${containerName}`, 'green');
        log(`   Port: ${port}`, 'green');
        resolve(true);
      } else {
        log(`✗ Failed to start ${type} container`, 'red');
        resolve(false);
      }
    });
  });
}

// Run Prisma migrations
function runPrismaMigrations() {
  return new Promise((resolve) => {
    log('\n🔧 Running Prisma migrations...', 'blue');
    
    const prisma = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      shell: true,
      stdio: 'inherit',
    });
    
    prisma.on('close', (code) => {
      if (code === 0) {
        log('✓ Database schema pushed successfully', 'green');
        resolve(true);
      } else {
        log('⚠ Prisma db push failed, trying migrate...', 'yellow');
        const migrate = spawn('npx', ['prisma', 'migrate', 'dev', '--skip-generate'], {
          shell: true,
          stdio: 'inherit',
        });
        migrate.on('close', (migrateCode) => {
          if (migrateCode === 0) {
            log('✓ Migrations applied successfully', 'green');
            resolve(true);
          } else {
            log('✗ Migration failed. Please run manually: npx prisma migrate dev', 'red');
            resolve(false);
          }
        });
      }
    });
  });
}

// Start Next.js dev server
function startNextServer(port) {
  log(`\n🌐 Starting Next.js dev server on port ${port}...`, 'blue');
  
  const next = spawn('npx', ['next', 'dev', '-p', String(port)], {
    shell: true,
    stdio: 'inherit',
  });
  
  next.on('close', (code) => {
    if (code !== 0) {
      log(`\n✗ Next.js server exited with code ${code}`, 'red');
    }
    process.exit(code);
  });
  
  return next;
}

// Main function
async function main() {
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('  CyberSec Lab Trainer - Auto Start', 'cyan');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  try {
    // Load environment
    const env = loadEnv();
    const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;
    
    // Detect database type
    const dbConfig = detectDatabaseType(databaseUrl);
    
    if (dbConfig.type === 'none' || dbConfig.type === 'unknown') {
      log('⚠ No valid DATABASE_URL found', 'yellow');
      if (dbConfig.url) {
        log(`  URL: ${dbConfig.url}`, 'yellow');
      }
      const continueAnyway = await ask('Continue without database? (y/n): ');
      if (continueAnyway.toLowerCase() !== 'y') {
        process.exit(0);
      }
    } else {
      log(`✓ Detected database type: ${dbConfig.type.toUpperCase()}`, 'green');
    }
    
    // Find available port for Next.js FIRST (before long-running operations)
    const requestedPort = parseInt(process.argv[2]) || 3000;
    const port = await findAvailablePort(requestedPort);
    
    if (port !== requestedPort) {
      log(`\n⚠ Port ${requestedPort} is in use, using port ${port} instead`, 'yellow');
    } else {
      log(`\n✓ Port ${port} is available`, 'green');
    }
    
    // Start database if needed
    if (dbConfig.type !== 'none' && dbConfig.type !== 'unknown') {
      const dbStarted = await startDatabaseInDocker(dbConfig);
      
      if (dbStarted) {
        // Run migrations
        await runPrismaMigrations();
      }
    }
    
    // Start Next.js
    startNextServer(port);
    
    log(`\n✓ Server will be available at: http://localhost:${port}`, 'green');
    log(`   API Docs: http://localhost:${port}/api/docs\n`, 'green');
    
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n👋 Shutting down...', 'yellow');
  process.exit(0);
});

main();
