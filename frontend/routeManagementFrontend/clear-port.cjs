#!/usr/bin/env node

const { execSync } = require('child_process');

const PORT = 3001;

try {
  // Kill process on port 3001 if it exists
  const cmd = process.platform === 'win32' 
    ? `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`
    : `lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs -r kill -9`;
  
  try {
    execSync(cmd, { stdio: 'inherit', shell: true });
  } catch (e) {
    // Port might not be in use, that's okay
  }
  
  // Wait a moment for port to be freed
  setTimeout(() => {
    execSync('npx vite', { stdio: 'inherit' });
  }, 500);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
