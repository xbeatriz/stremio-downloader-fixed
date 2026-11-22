const express = require('express')
const cors = require('cors')
const getPort = require('get-port')
const path = require('path')
const proxy = require('./proxy')
const api = require('./api')
const downloadDir = require('./downloadDir')
const tokenApi = require('./tokenDir')
const addonApi = require('./addon')

async function init(cb) {
  const router = express()
  router.use(cors())
  proxy.createProxyServer(router)
  router.use('/assets', express.static(path.join(__dirname, '..', 'assets')))
  router.use('/downloader', express.static(path.join(__dirname, '..', 'downloader')))
  router.use('/api', api.router)

  const token = tokenApi.get()
  router.use('/files-' + token, express.static(downloadDir.get()))
  router.use('/addon-' + token, addonApi.handler)

  const preferredPort = Number(process.env.STREMIO_DOWNLOADER_PORT) || 8189
  const serverPort = await getPort({ port: preferredPort })
  const server = router.listen(serverPort, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + serverPort
    proxy.setEndpoint(url)
    api.setEndpoint(url)
    addonApi.setEndpoint(url + '/files-' + token)
    proxy.addProxy('https://app.strem.io/shell-v4.4/#/')

    console.log('Stremio Downloader server: ' + url + '/downloader/')
    if (serverPort !== preferredPort) {
      console.warn('Port ' + preferredPort + ' in use; using ' + serverPort)
    }
    cb(url)
  })
  server.on('error', err => console.error('Local server failed:', err))
}

module.exports = init
