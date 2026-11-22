'use strict'
const fs = require('fs')
const childProcess = require('child_process')

// Metadata is read from local files only. ffprobe must be installed on PATH
// or supplied through FFPROBE_PATH.
const cache = new Map()
const RETRY_MS = 30000
const READY_BYTES = 1024 * 1024
let running = false

function executable() {
  return process.env.FFPROBE_PATH || 'ffprobe'
}

function normalizeStream(stream) {
  const tags = stream.tags || {}
  const disposition = stream.disposition || {}
  return {
    index: stream.index,
    codec: stream.codec_name || null,
    language: tags.language || null,
    title: tags.title || null,
    channels: stream.channels || null,
    channelLayout: stream.channel_layout || null,
    default: disposition.default === 1
  }
}

function inspect(filePath, done) {
  childProcess.execFile(executable(), [
    '-v', 'error', '-show_entries',
    'stream=index,codec_type,codec_name,width,height,channels,channel_layout:stream_tags=language,title:stream_disposition=default',
    '-of', 'json', filePath
  ], { timeout: 12000, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout) => {
    if (error) return done(error)
    try {
      const streams = JSON.parse(stdout).streams || []
      done(null, {
        video: streams.filter(s => s.codec_type === 'video').map(s => ({
          codec: s.codec_name || null, width: s.width || null, height: s.height || null
        })),
        audio: streams.filter(s => s.codec_type === 'audio').map(normalizeStream),
        subtitles: streams.filter(s => s.codec_type === 'subtitle').map(normalizeStream)
      })
    } catch (err) { done(err) }
  })
}

function metadataFor(file) {
  if (!file || !file.filePath) return { status: 'unavailable' }
  const key = file.filePath
  let stats
  try { stats = fs.statSync(key) }
  catch (e) { return { status: 'waiting' } }
  const complete = !!file.finished
  const previous = cache.get(key)
  if (previous && previous.status === 'ready' && (complete || !file.isHls)) {
    return { status: 'ready', ...previous.data }
  }
  if (stats.size < READY_BYTES && !complete) return { status: 'waiting' }
  if (!previous || (Date.now() - previous.checkedAt > RETRY_MS) ||
    (complete && previous.status !== 'ready' && !previous.finalAttempt)) {
    if (!running) {
      running = true
      cache.set(key, { status: 'checking', checkedAt: Date.now(), finalAttempt: complete })
      inspect(key, (err, data) => {
        running = false
        if (err) {
          const missing = err.code === 'ENOENT'
          cache.set(key, {
            status: missing ? 'missing-tool' : (complete ? 'unavailable' : 'waiting'),
            checkedAt: Date.now(), finalAttempt: complete
          })
        } else {
          cache.set(key, { status: 'ready', checkedAt: Date.now(), data, finalAttempt: complete })
        }
      })
    }
  }
  const current = cache.get(key)
  return current && current.status === 'ready'
    ? { status: 'ready', ...current.data }
    : { status: current ? current.status : 'waiting' }
}

function forget(filePath) { cache.delete(filePath) }

module.exports = { metadataFor, forget }
