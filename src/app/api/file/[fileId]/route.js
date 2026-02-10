/**
 * 圖片代理 API — 直接從 NAS 讀取檔案
 * 根據 fileId 查詢 FR_WK_FILE 取得檔案路徑，再從 NAS 讀取並回傳
 * NAS 連線使用 .env 的 CPM2_USERNAME / CPM2_PASSWORD 認證
 */

import { promises as fs } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import db from '@/lib/db'

const NAS_SHARE = '\\\\nas109\\ENG_Public'
const NAS_BASE = '\\\\nas109\\ENG_Public\\ERP_prj\\week_temp'

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

let nasConnected = false

/**
 * 確保 NAS 連線已建立（只需連一次，之後重用）
 */
function ensureNasConnection() {
  if (nasConnected) return

  const username = process.env.CPM2_USERNAME
  const password = process.env.CPM2_PASSWORD

  if (!username || !password) {
    throw new Error('未設定 CPM2_USERNAME 或 CPM2_PASSWORD')
  }

  const { spawnSync } = require('child_process')

  function runCmd(args) {
    return spawnSync('net', args, { stdio: 'pipe', windowsHide: true, shell: false })
  }

  function tryNetUse() {
    const result = runCmd(['use', NAS_SHARE, `/user:${username}`, password])
    if (result.status !== 0) {
      const msg = result.stderr?.toString('utf8')?.trim() || result.stdout?.toString('utf8')?.trim()
      throw new Error(msg || `exit code ${result.status}`)
    }
  }

  // 先刪除所有 nas109 的既有連線（解決 error 1219）
  function clearNasConnections() {
    // 列出所有 net use 連線，找到 nas109 相關的逐一刪除
    const list = runCmd(['use'])
    const output = list.stdout?.toString('utf8') || ''
    const lines = output.split('\n')
    for (const line of lines) {
      const match = line.match(/(\\\\nas109\\\S+)/i)
      if (match) {
        console.log(`[file-proxy] 刪除既有連線: ${match[1]}`)
        runCmd(['use', match[1], '/delete', '/y'])
      }
    }
  }

  try {
    tryNetUse()
    nasConnected = true
    console.log('[file-proxy] NAS 連線成功')
  } catch (error) {
    console.log(`[file-proxy] NAS 首次連線失敗，清除既有連線後重試...`)
    clearNasConnections()

    try {
      tryNetUse()
      nasConnected = true
      console.log('[file-proxy] NAS 重新連線成功')
    } catch (retryError) {
      const msg = retryError.message || ''
      console.error(`[file-proxy] NAS 連線失敗: ${msg}`)
      throw new Error(`NAS 連線失敗: ${msg}`)
    }
  }
}

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

    // 若是純文字內容
    if (f.FILE_TEXT?.trim()) {
      return new Response(f.FILE_TEXT, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const filePath = (f.FILE_PATH || '').trim().replace(/\//g, '\\').replace(/^\\+|\\+$/g, '')
    const fileName = (f.FILE_NAME || '').trim()

    if (!filePath || !fileName) {
      return new Response('檔案路徑不完整', { status: 404 })
    }

    // 建立 NAS 連線（首次呼叫時）
    ensureNasConnection()

    const fullPath = path.join(NAS_BASE, filePath, fileName)
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
    // NAS 斷線時重試一次
    if (nasConnected && error.code === 'UNKNOWN') {
      nasConnected = false
      console.log('[file-proxy] NAS 可能斷線，嘗試重連...')
      try {
        ensureNasConnection()
        const filePath = (await db.query(
          `SELECT TOP 1 FILE_PATH, FILE_NAME FROM FR_WK_FILE WHERE FILE_ID = @fileId`,
          { fileId: parseInt(fileId) }
        ))?.[0]
        if (filePath) {
          const fp = (filePath.FILE_PATH || '').trim().replace(/\//g, '\\').replace(/^\\+|\\+$/g, '')
          const fn = (filePath.FILE_NAME || '').trim()
          const fullPath = path.join(NAS_BASE, fp, fn)
          const buffer = await fs.readFile(fullPath)
          const ext = path.extname(fn).toLowerCase()
          const contentType = EXT_CONTENT_TYPE[ext] || 'application/octet-stream'
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(buffer.byteLength),
              'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
            },
          })
        }
      } catch (_) {}
    }

    console.error(`[file-proxy] fileId=${fileId} 失敗:`, error.message)
    return new Response(`檔案讀取失敗: ${error.message}`, { status: 500 })
  }
}
