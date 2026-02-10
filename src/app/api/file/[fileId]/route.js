/**
 * 圖片代理 API — 直接從 NAS 讀取檔案
 *
 * 跨平台支援：
 *   Windows（開發機）: .env 設 NAS_FILE_PATH=\\nas109\ENG_Public\ERP_prj\week_temp
 *                       會自動用 CPM2_USERNAME/CPM2_PASSWORD 做 net use 連線
 *   Linux（正式機）:   先掛載 NAS，再設 NAS_FILE_PATH=/mnt/nas_eng/ERP_prj/week_temp
 */

import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import db from '@/lib/db'

const NAS_FILE_PATH = process.env.NAS_FILE_PATH || '\\\\nas109\\ENG_Public\\ERP_prj\\week_temp'
const IS_WINDOWS = os.platform() === 'win32'

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

// ── Windows NAS 連線管理 ──
let nasConnected = false

function ensureNasConnection() {
  // Linux 不需要 net use，靠 OS 掛載
  if (!IS_WINDOWS) return
  if (nasConnected) return

  const username = process.env.CPM2_USERNAME
  const password = process.env.CPM2_PASSWORD
  if (!username || !password) {
    throw new Error('未設定 CPM2_USERNAME 或 CPM2_PASSWORD')
  }

  const { spawnSync } = require('child_process')
  // 從 NAS_FILE_PATH 取得 share 路徑（例如 \\nas109\ENG_Public）
  const parts = NAS_FILE_PATH.replace(/^\\\\/, '').split('\\')
  const nasShare = `\\\\${parts[0]}\\${parts[1]}`

  function run(args) {
    return spawnSync('net', args, { stdio: 'pipe', windowsHide: true, shell: false })
  }

  function tryConnect() {
    const r = run(['use', nasShare, `/user:${username}`, password])
    if (r.status !== 0) {
      throw new Error(r.stderr?.toString('utf8')?.trim() || `exit code ${r.status}`)
    }
  }

  // 先刪除 server 上的既有連線（解決 error 1219）
  function clearConnections() {
    const list = run(['use'])
    const output = list.stdout?.toString('utf8') || ''
    const serverName = parts[0] // e.g. "nas109"
    const re = new RegExp(`(\\\\\\\\${serverName}\\\\\\S+)`, 'gi')
    let match
    while ((match = re.exec(output)) !== null) {
      console.log(`[file-proxy] 刪除既有連線: ${match[1]}`)
      run(['use', match[1], '/delete', '/y'])
    }
  }

  try {
    tryConnect()
    nasConnected = true
    console.log('[file-proxy] NAS 連線成功')
  } catch (_) {
    console.log('[file-proxy] NAS 首次連線失敗，清除既有連線後重試...')
    clearConnections()
    try {
      tryConnect()
      nasConnected = true
      console.log('[file-proxy] NAS 重新連線成功')
    } catch (err) {
      console.error(`[file-proxy] NAS 連線失敗: ${err.message}`)
      throw new Error(`NAS 連線失敗: ${err.message}`)
    }
  }
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

    // 將路徑分隔符統一為當前 OS 格式
    const filePath = (f.FILE_PATH || '').trim().replace(/[/\\]+/g, path.sep).replace(/^[/\\]+|[/\\]+$/g, '')
    const fileName = (f.FILE_NAME || '').trim()

    if (!filePath || !fileName) {
      return new Response('檔案路徑不完整', { status: 404 })
    }

    // Windows 需要先建立 NAS 連線
    ensureNasConnection()

    const fullPath = path.join(NAS_FILE_PATH, filePath, fileName)
    const buffer = await fs.readFile(fullPath)

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
    // NAS 斷線時重試一次（僅 Windows）
    if (IS_WINDOWS && nasConnected && error.code === 'UNKNOWN') {
      nasConnected = false
    }
    console.error(`[file-proxy] fileId=${fileId} 失敗:`, error.message)
    return new Response(`檔案讀取失敗: ${error.message}`, { status: 500 })
  }
}
