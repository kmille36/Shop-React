// Starts the Node DB server and the Vite dev server together.
// Usage: node scripts/dev-all.js
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const isWin = process.platform === 'win32'
const kill = (c) => (isWin ? spawn('taskkill', ['/pid', String(c.pid), '/T', '/F']) : process.kill(c.pid, 'SIGTERM'))

const server = spawn(process.execPath, ['server/index.js'], { cwd: root, stdio: 'inherit' })
const vite = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], { cwd: root, stdio: 'inherit', shell: isWin })

let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  kill(server); kill(vite)
  setTimeout(() => process.exit(0), 1000)
}
server.on('exit', stop)
vite.on('exit', stop)
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
