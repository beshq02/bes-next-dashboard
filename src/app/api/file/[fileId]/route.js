/**
 * 圖片代理 API — 直接從 NAS 讀取檔案
 *
 * 跨平台支援：
 *   Windows: net use 連線 NAS → fs.readFile
 *   Linux:   smbclient 直接從 SMB 取檔（需安裝 smbclient: sudo apt install smbclient）
 *
 * .env 設定：CPM2_USERNAME / CPM2_PASSWORD / NAS_FILE_PATH
 */

import { promises as fs } from 'fs'
import { execFileSync, spawnSync } from 'child_process'
import path from 'path'
import os from 'os'
import db from '@/lib/db'

const IS_WINDOWS = os.platform() === 'win32'
const NAS_SERVER = 'nas109'
const NAS_SHARE_NAME = 'ENG_Public'
const NAS_SUB_PATH = 'ERP_prj/week_temp'

// Windows 用的路徑
const NAS_WIN_SHARE = `\\\\${NAS_SERVER}\\${NAS_SHARE_NAME}`
const NAS_WIN_BASE = `\\\\${NAS_SERVER}\\${NAS_SHARE_NAME}\\${NAS_SUB_PATH.replace(/\//g, '\\')}`

// 如有設定 NAS_FILE_PATH 就優先用（支援已掛載的情境）
const NAS_FILE_PATH = process.env.NAS_FILE_PATH || (IS_WINDOWS ? NAS_WIN_BASE : null)

const EXT_CONTENT_TYPE = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// ── Windows: net use 連線管理 ──
let nasConnected = false

function ensureWindowsNas() {
  if (nasConnected) return

  const username = process.env.CPM2_USERNAME
  const password = process.env.CPM2_PASSWORD
  if (!username || !password) throw new Error('未設定 CPM2_USERNAME 或 CPM2_PASSWORD')

  function run(args) {
    return spawnSync('net', args, { stdio: 'pipe', windowsHide: true, shell: false })
  }

  function tryConnect() {
    const r = run(['use', NAS_WIN_SHARE, `/user:${username}`, password])
    if (r.status !== 0) {
      throw new Error(r.stderr?.toString('utf8')?.trim() || `exit code ${r.status}`)
    }
  }

  function clearConnections() {
    const output = run(['use']).stdout?.toString('utf8') || ''
    const re = new RegExp(`(\\\\\\\\${NAS_SERVER}\\\\\\S+)`, 'gi')
    let m
    while ((m = re.exec(output)) !== null) {
      console.log(`[file-proxy] 刪除既有連線: ${m[1]}`)
      run(['use', m[1], '/delete', '/y'])
    }
  }

  try {
    tryConnect()
    nasConnected = true
    console.log('[file-proxy] NAS 連線成功 (Windows net use)')
  } catch (_) {
    console.log('[file-proxy] 首次連線失敗，清除既有連線後重試...')
    clearConnections()
    try {
      tryConnect()
      nasConnected = true
      console.log('[file-proxy] NAS 重新連線成功')
    } catch (err) {
      throw new Error(`NAS 連線失敗: ${err.message}`)
    }
  }
}

// ── Linux: smbclient 取檔 ──
function readFileViaSmbclient(smbRelativePath) {
  const username = process.env.CPM2_USERNAME
  const password = process.env.CPM2_PASSWORD
  if (!username || !password) throw new Error('未設定 CPM2_USERNAME 或 CPM2_PASSWORD')

  // smbclient 路徑用正斜線
  const smbPath = `${NAS_SUB_PATH}/${smbRelativePath}`.replace(/\\/g, '/')
  const tmpFile = path.join(os.tmpdir(), `nas_${Date.now()}_${Math.random().toString(36).slice(2)}`)

  try {
    execFileSync('smbclient', [
      `//${NAS_SERVER}/${NAS_SHARE_NAME}`,
      '-U', `${username}%${password}`,
      '-c', `get "${smbPath}" "${tmpFile}"`,
    ], { stdio: 'pipe' })

    const buffer = require('fs').readFileSync(tmpFile)
    require('fs').unlinkSync(tmpFile)
    return buffer
  } catch (error) {
    try { require('fs').unlinkSync(tmpFile) } catch (_) {}
    const msg = error.stderr?.toString()?.trim() || error.message
    throw new Error(`smbclient 取檔失敗: ${msg}`)
  }
}

// ── 讀取檔案（自動選擇方式） ──
async function readNasFile(filePath, fileName) {
  const relativePath = path.join(filePath, fileName)

  // 方式 1: 有設定 NAS_FILE_PATH（Windows net use 或 Linux 已掛載）
  if (NAS_FILE_PATH) {
    if (IS_WINDOWS) ensureWindowsNas()
    const fullPath = path.join(NAS_FILE_PATH, relativePath)
    return await fs.readFile(fullPath)
  }

  // 方式 2: Linux 用 smbclient 直接取檔
  return readFileViaSmbclient(relativePath)
}

// ── 路由處理 ──
export async function GET(request, { params }) {
  const { fileId } = await params

  if (!fileId || isNaN(fileId)) {
    return new Response('無效的 fileId', { status: 400 })
  }

  try {
    const rows = await db.query(
      `SELECT TOP 1 FILE_PATH, FILE_NAME, FILE_TEXT
       FROM FR_WK_FILE
       WHERE FILE_ID = @fileId`,
      { fileId: parseInt(fileId) }
    )

    const f = rows?.[0]
    if (!f) {
      return new Response('找不到檔案', { status: 404 })
    }

    // 純文字內容直接回傳
    if (f.FILE_TEXT?.trim()) {
      return new Response(f.FILE_TEXT, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // 統一路徑分隔符
    const filePath = (f.FILE_PATH || '').trim().replace(/[/\\]+/g, path.sep).replace(/^[/\\]+|[/\\]+$/g, '')
    const fileName = (f.FILE_NAME || '').trim()

    if (!filePath || !fileName) {
      return new Response('檔案路徑不完整', { status: 404 })
    }

    const buffer = await readNasFile(filePath, fileName)

    const ext = path.extname(fileName).toLowerCase()
    const contentType = EXT_CONTENT_TYPE[ext] || 'application/octet-stream'

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
      },
    })
  } catch (error) {
    if (IS_WINDOWS && nasConnected && error.code === 'UNKNOWN') {
      nasConnected = false
    }
    console.error(`[file-proxy] fileId=${fileId} 失敗:`, error.message)
    return new Response(`檔案讀取失敗: ${error.message}`, { status: 500 })
  }
}
