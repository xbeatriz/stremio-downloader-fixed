'use strict'
const $ = id => document.getElementById(id)
const state = { files: [], search: '', filter: 'all', busy: false }
const dialog = $('dialog')
if (window.dialogPolyfill && !dialog.showModal) window.dialogPolyfill.registerDialog(dialog)

function formatBytes(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return n.toFixed(0) + ' B'
  const units = ['KB','MB','GB','TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)) - 1)
  return (n / Math.pow(1024, i + 1)).toFixed(i >= 2 ? 2 : 1) + ' ' + units[i]
}
function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'A calcular…'
  if (seconds < 60) return Math.ceil(seconds) + ' s restantes'
  if (seconds < 3600) return Math.ceil(seconds / 60) + ' min restantes'
  return Math.floor(seconds / 3600) + ' h ' + Math.ceil(seconds % 3600 / 60) + ' min restantes'
}
function isActive(file) { return !file.finished && !file.stopped && !file.error }
function el(tag, cls, text) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}
function button(label, title, callback) {
  const e = el('button','icon-button',label)
  e.type='button'
  e.title=title
  e.setAttribute('aria-label',title)
  e.addEventListener('click',callback)
  return e
}
function notice(message) {
  const n=$('notification')
  n.textContent=message
  n.hidden=false
}
async function api(method, params={}) {
  const q=new URLSearchParams({method,...params})
  const response=await fetch('/api?'+q.toString(),{cache:'no-store'})
  if (!response.ok) throw new Error('HTTP '+response.status)
  return response.text()
}
async function action(method,file) {
  try {
    await api(method,file ? {url:file.url,filename:file.filename}: {})
    if (method === 'remove-download' || method === 'stop-download' || method === 'restart-download') await refresh()
    if (dialog.open) dialog.close()
  } catch(e) { notice('Não foi possível executar a ação: '+e.message) }
}
function modal(title, entries) {
  $('dialog-title').textContent=title
  const body=$('dialog-body')
  body.replaceChildren()
  entries.forEach(item=>{
    const b=el('button','button',item.label)
    b.type='button'
    b.addEventListener('click',()=>action(item.method,item.file))
    body.appendChild(b)
  })
  const close=el('button','button button-quiet','Fechar')
  close.addEventListener('click',()=>dialog.close())
  body.appendChild(close)
  if (!dialog.open) dialog.showModal()
}
function options() {
  modal('Definições',[
    {label:'Abrir pasta de downloads',method:'open-folder'},
    {label:'Alterar pasta de downloads',method:'change-folder'},
    {label:'Instalar como addon no Stremio',method:'install-addon'}
  ])
}
function fileOptions(file) {
  modal('Opções do ficheiro',[
    {label:'Abrir localização do ficheiro',method:'open-location',file},
    {label:'Reproduzir vídeo',method:'play-video',file}
  ])
}
function card(file) {
  const active=isActive(file)
  const card=el('article','download-card')
  const extension=(file.filename||'').split('.').pop().slice(0,4).toUpperCase() || 'FILE'
  card.appendChild(el('div','file-icon',extension))
  const main=el('div','file-main')
  const head=el('div','file-head')
  const title=el('div','filename',file.filename || 'Sem nome')
  const status=file.error?'Erro':file.stopped?'Parado':file.finished?'Concluído':'A transferir'
  const pill=el('span','pill'+(file.finished?' finished':file.error||file.stopped?' error':''),status)
  head.append(title,pill)
  main.append(head)
  const size=Number(file.total)>0?formatBytes(file.downloadedBytes)+' / '+formatBytes(file.total):formatBytes(file.downloadedBytes)+' transferidos'
  main.append(el('div','file-sub',size))
  const track=el('div','progress-track')
  const bar=el('div','progress-bar')
  const progress=typeof file.progress==='number' && Number.isFinite(file.progress)?Math.min(100,Math.max(0,file.progress)):null
  bar.style.width=(file.finished?100:progress===null?0:progress)+'%'
  track.append(bar);main.append(track)
  const line=el('div','progress-data')
  line.append(el('span','',file.finished?'100% concluído':progress===null?'Progresso indisponível':progress+'% concluído'))
  let details=file.finished?'Transferência terminada'
    :active && file.isHls?'A processar stream HLS'
    :active?(formatBytes(file.speedBytesPerSecond)+'/s · '+formatEta(file.etaSeconds))
    :file.error?'Não foi possível concluir':'Transferência interrompida'
  line.append(el('b','',details))
  main.append(line)
  card.append(main)
  const actions=el('div','card-actions')
  if(file.finished) actions.append(button('▶','Abrir opções de reprodução',()=>fileOptions(file)))
  else if(file.stopped||file.error) actions.append(button('↻','Reiniciar download',()=>action('restart-download',file)))
  else actions.append(button('■','Parar download',()=>action('stop-download',file)))
  actions.append(button('×','Eliminar download',()=>{if(window.confirm('Eliminar esta transferência e o ficheiro associado?'))action('remove-download',file)}))
  card.append(actions)
  return card
}
function render() {
  const files=state.files
  const active=files.filter(isActive)
  $('stat-active').textContent=String(active.length)
  $('stat-completed').textContent=String(files.filter(f=>f.finished).length)
  $('stat-speed').textContent=formatBytes(active.reduce((s,f)=>s+(Number(f.speedBytesPerSecond)||0),0))+'/s'
  $('total-count').textContent=String(files.length)
  const filtered=files.filter(file=>{
    const match=(file.filename||'').toLowerCase().includes(state.search)
    const pass=state.filter==='all'||state.filter==='active'&&isActive(file)||state.filter==='finished'&&file.finished||state.filter==='other'&&(file.error||file.stopped)
    return match&&pass
  })
  const list=$('downloads-list')
  const fragment=document.createDocumentFragment()
  filtered.forEach(file=>fragment.append(card(file)))
  list.replaceChildren(fragment)
  $('no-downloads').hidden=filtered.length!==0
  const empty=$('no-downloads')
  empty.querySelector('h3').textContent=files.length?'Nenhuma transferência encontrada':'Nenhuma transferência por aqui'
  empty.querySelector('p').textContent=files.length?'Experimenta alterar a pesquisa ou o filtro.':'Abre o Stremio e seleciona uma fonte de vídeo para começar.'
}
async function refresh() {
  if(state.busy)return
  state.busy=true
  try {
    const value=await api('files')
    const files=JSON.parse(value)
    if(!Array.isArray(files))throw new Error('Resposta inesperada')
    state.files=files
    $('notification').hidden=true
    render()
  } catch(e) {notice('Erro ao obter transferências: '+e.message)}
  finally {state.busy=false}
}
$('query').addEventListener('input',event=>{state.search=event.target.value.toLowerCase().trim();render()})
$('filter').addEventListener('change',event=>{state.filter=event.target.value;render()})
$('open-folder').addEventListener('click',()=>action('open-folder'))
$('sidebar-folder').addEventListener('click',()=>action('open-folder'))
$('open-settings').addEventListener('click',options)
$('sidebar-settings').addEventListener('click',options)
$('load-stremio').addEventListener('click',()=>action('load-stremio'))
$('dialog-close').addEventListener('click',()=>dialog.close())
refresh()
setInterval(refresh,2000)
