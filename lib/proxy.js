const httpProxy = require('http-proxy')
const fs = require('fs')
const path = require('path')
const pUrl = require('url')

const defaultAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const proxies = {}
let endpoint

const injectedBody = fs.readFileSync(path.join(__dirname, 'inject.html'), 'utf8')
const injectedHead = fs.readFileSync(path.join(__dirname, 'injectHead.html'), 'utf8')

function directoryOf(value) {
  const i = value.lastIndexOf('/')
  return i < 0 ? '/' : value.slice(0, i + 1)
}

function injectHtml(html) {
  if (html.includes('</body>')) html = html.replace('</body>', injectedBody + '</body>')
  else if (html.includes('</html>')) html = html.replace('</html>', injectedBody + '</html>')
  else html += injectedBody
  if (html.includes('<head>')) html = html.replace('<head>', '<head>' + injectedHead)
  return html
}

module.exports = {
  setEndpoint: url => { endpoint = url },
  getEndpoint: () => endpoint,
  addProxy: (url, opts) => {
    const parsed = pUrl.parse(url)
    const host = parsed.host
    const pathname = parsed.pathname || '/'
    const result = endpoint + '/web/' + host + (parsed.path || '')

    if (process.send) {
      process.send({ proxy: true, url, opts })
      return result
    }

    if (!proxies[host]) {
      proxies[host] = { protocol: parsed.protocol, host, opts, paths: {} }
    }
    proxies[host].paths[pathname] = opts
    if (!proxies[host].paths[directoryOf(pathname)]) {
      proxies[host].paths[directoryOf(pathname)] = opts
    }
    return result
  },
  createProxyServer: router => {
    const proxy = httpProxy.createProxyServer({ selfHandleResponse: true, changeOrigin: true })
    proxy.on('error', (err, req, res) => {
      console.error('Stremio proxy error:', err.message)
      if (res && !res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
      if (res && !res.writableEnded) res.end('Could not load the Stremio website: ' + err.message)
    })

    proxy.on('proxyRes', (upstream, req, res) => {
      const headers = Object.assign({}, upstream.headers)
      const contentType = headers['content-type'] || ''
      const html = /text\/html/i.test(contentType)
      const css = req.url.includes('/blob.css')
      const chunks = []
      upstream.on('data', chunk => chunks.push(chunk))
      upstream.on('error', err => {
        console.error('Stremio response error:', err.message)
        if (!res.writableEnded) res.end()
      })
      upstream.on('end', () => {
        if (res.writableEnded) return
        let body = Buffer.concat(chunks)
        if (html) body = Buffer.from(injectHtml(body.toString('utf8')), 'utf8')
        else if (css) {
          const value = body.toString('utf8')
            // Preserve the original quote style. Mixing quotes here can make
            // the browser discard a large portion of the stylesheet.
            .replace(/url\(\s*(["']?)fonts\//g, (match, quote) =>
              'url(' + quote + endpoint + '/assets/fonts/')
          body = Buffer.from(value, 'utf8')
        }

        delete headers['transfer-encoding']
        delete headers['content-encoding']
        delete headers['content-security-policy']
        delete headers['content-security-policy-report-only']
        headers['content-length'] = String(body.length)
        headers['cache-control'] = 'no-store'
        headers['access-control-allow-origin'] = '*'
        res.writeHead(upstream.statusCode || 200, headers)
        res.end(body)
      })
    })

    router.all('/web/*', (req, res) => {
      const parts = req.url.split('/')
      const host = parts[2]
      const config = proxies[host]
      if (!config) {
        res.status(404).send('Unknown proxy host')
        return
      }
      req.url = '/' + parts.slice(3).join('/')
      const options = config.paths[req.url] || config.paths[directoryOf(req.url)] || config.opts || {}
      req.headers.host = host
      req.headers['user-agent'] = defaultAgent
      req.headers['accept-encoding'] = 'identity'
      if (options.headers) Object.assign(req.headers, options.headers)
      proxy.web(req, res, { target: config.protocol + '//' + host, changeOrigin: true })
    })
  }
}
