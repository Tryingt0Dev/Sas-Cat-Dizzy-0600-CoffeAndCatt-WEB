const { execSync } = require('child_process');
const fs = require('fs');

function removeFile(p) {
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Removed', p);
    } else {
      console.log('Not found:', p);
    }
  } catch (e) {
    console.error('Failed to remove', p, e.message);
  }
}

function removeDir(p) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log('Removed directory', p);
    } else {
      console.log('Not found:', p);
    }
  } catch (e) {
    console.error('Failed to remove directory', p, e.message);
  }
}

if (process.platform === 'win32') {
  try {
    // Try to find PID using port 3000
    const out = execSync('netstat -ano -p tcp').toString();
    const lines = out.split(/\r?\n/);
    const port = '0.0.0.0:3000';
    const matching = lines.filter(l => l.includes(':3000'));
    const pids = new Set();
    matching.forEach(l => {
      const parts = l.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      const n = Number(pid);
      if (pid && !isNaN(n) && n > 10) pids.add(String(n));
    });
    if (pids.size) {
      for (const pid of pids) {
        try {
          console.log('Killing PID', pid);
          execSync(`taskkill /PID ${pid} /F`);
        } catch (e) {
          console.error('Failed to kill', pid, e.message);
        }
      }
    } else {
      console.log('No user process found on port 3000');
    }
  } catch (e) {
    console.error('Error while checking netstat:', e.message);
  }
}

// Remove .next and prisma client file
removeDir('.next');
removeFile('node_modules/.prisma/client/query_engine-windows.dll.node');
removeFile('node_modules/.prisma/client/query_engine-windows.dll.node.node');
removeFile('node_modules/.prisma/client/query_engine');

console.log('Cleanup complete.');
