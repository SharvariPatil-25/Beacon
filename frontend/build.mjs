// Bundles src/ with esbuild and inlines JS + CSS into one self-contained dist/index.html.
// Usage: `npm run build`  |  `npm run dev` (rebuilds on change and serves on http://localhost:5173)
import { build, context } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { createServer } from 'node:http'

const serve = process.argv.includes('--serve')
const opts = {
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: !serve,
  write: false,
  outdir: 'dist',
  jsx: 'automatic',
  loader: { '.css': 'css', '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"' },
  target: ['es2020'],
  logLevel: 'info'
}

function emit(result) {
  let js = '', css = ''
  for (const f of result.outputFiles) {
    if (f.path.endsWith('.js')) js = f.text
    if (f.path.endsWith('.css')) css = f.text
  }
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Beacon — Illuminate every decision</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>`
  if (!existsSync('dist')) mkdirSync('dist')
  writeFileSync('dist/index.html', html)
  console.log(`dist/index.html written (${(html.length / 1024).toFixed(0)} KB)`)
}

if (!serve) {
  emit(await build(opts))
} else {
  const ctx = await context({
    ...opts,
    plugins: [{ name: 'emit', setup(b) { b.onEnd((r) => r.outputFiles && emit(r)) } }]
  })
  await ctx.watch()
  createServer((_, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(readFileSync('dist/index.html'))
  }).listen(5173, () => console.log('Beacon dev server: http://localhost:5173'))
}
