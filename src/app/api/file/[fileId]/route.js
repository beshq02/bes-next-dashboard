/**
 * 圖片代理 API
 * 解決 cpm2.bes.com.tw 跨站 cookie 驗證導致前端無法載入圖片的問題
 *
 * 支援兩種認證方式（按優先順序）：
 * 1. 自動登入：設定 CPM2_USERNAME + CPM2_PASSWORD，系統會自動登入取得 cookie
 * 2. 手動 cookie：設定 CPM2_COOKIE=Week=<cookie值>
 *
 * 注意：cpm2 伺服器即使成功回傳圖片也會帶 302 + location:/login，
 *       需透過 content-type 判斷是否為圖片，而非僅看 status code
 */

const CPM2_BASE = 'https://cpm2.bes.com.tw'
const FILE_URL = `${CPM2_BASE}/Week/File/GetWkFile`
const LOGIN_URL = `${CPM2_BASE}/Account/Login`
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// 記憶體中快取 cookie，避免每次請求都重新登入
let cachedCookie = null
let cookieExpiry = 0

/**
 * 自動登入 cpm2 取得 cookie
 */
async function loginAndGetCookie() {
  const username = process.env.CPM2_USERNAME
  const password = process.env.CPM2_PASSWORD

  if (!username || !password) return null

  try {
    // 先取得登入頁面的 anti-forgery token
    const loginPageRes = await fetch(LOGIN_URL, {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
    })

    const loginPageCookies = loginPageRes.headers.getSetCookie?.() || []
    const loginPageHtml = await loginPageRes.text()

    // 取得 anti-forgery token
    const tokenMatch = loginPageHtml.match(
      /name="__RequestVerificationToken"[^>]*value="([^"]+)"/
    )
    const antiForgeryToken = tokenMatch ? tokenMatch[1] : ''

    // 組合登入頁的 cookie
    const pageCookieStr = loginPageCookies
      .map(c => c.split(';')[0])
      .join('; ')

    // POST 登入
    const formData = new URLSearchParams()
    formData.append('Account', username)
    formData.append('Password', password)
    if (antiForgeryToken) {
      formData.append('__RequestVerificationToken', antiForgeryToken)
    }

    const loginRes = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: pageCookieStr,
      },
      body: formData.toString(),
      redirect: 'manual',
    })

    // 從 Set-Cookie 取得認證 cookie
    const setCookies = loginRes.headers.getSetCookie?.() || []
    const weekCookie = setCookies.find(c => c.startsWith('Week='))

    if (weekCookie) {
      const cookieValue = weekCookie.split(';')[0]
      // 快取 cookie，有效期設為 4 小時
      cachedCookie = cookieValue
      cookieExpiry = Date.now() + 4 * 60 * 60 * 1000
      console.log('[file-proxy] 自動登入成功，已取得新 cookie')
      return cookieValue
    }

    console.error('[file-proxy] 自動登入失敗：未取得 Week cookie')
    return null
  } catch (error) {
    console.error('[file-proxy] 自動登入失敗:', error.message)
    return null
  }
}

/**
 * 取得有效的 cookie
 */
async function getValidCookie() {
  // 如果快取的 cookie 還沒過期，直接用
  if (cachedCookie && Date.now() < cookieExpiry) {
    return cachedCookie
  }

  // 嘗試自動登入
  const newCookie = await loginAndGetCookie()
  if (newCookie) return newCookie

  // 回退到 .env 中的靜態 cookie
  return process.env.CPM2_COOKIE || null
}

/**
 * 判斷 content-type 是否為檔案類型
 */
function isFileContentType(contentType) {
  return (
    contentType.startsWith('image/') ||
    contentType.startsWith('application/pdf') ||
    contentType.startsWith('application/octet-stream') ||
    contentType.startsWith('application/msword') ||
    contentType.startsWith('application/vnd.')
  )
}

/**
 * 用指定 cookie 取得檔案
 */
async function fetchFile(fileId, cookie) {
  const targetUrl = `${FILE_URL}?fileId=${fileId}`

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': UA,
      Cookie: cookie,
    },
    redirect: 'manual',
  })

  const contentType = response.headers.get('content-type') || ''

  // 判斷是否為檔案內容：以 content-type 為主要依據，不再單純依賴 content-length
  if (isFileContentType(contentType)) {
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 0) {
      return { success: true, buffer, contentType }
    }
  }

  // content-type 不是檔案類型，可能是認證失敗（回傳了 HTML 登入頁面）
  return { success: false, status: response.status, contentType }
}

export async function GET(request, { params }) {
  const { fileId } = await params

  if (!fileId || isNaN(fileId)) {
    return new Response('無效的 fileId', { status: 400 })
  }

  const cookie = await getValidCookie()
  if (!cookie) {
    return Response.json(
      {
        error: '無法取得 CPM2 認證',
        hint: '請設定 CPM2_USERNAME + CPM2_PASSWORD 或 CPM2_COOKIE',
      },
      { status: 503 }
    )
  }

  try {
    // 第一次嘗試
    let result = await fetchFile(fileId, cookie)

    // 如果失敗，嘗試重新登入後再試一次
    if (!result.success && process.env.CPM2_USERNAME && process.env.CPM2_PASSWORD) {
      cachedCookie = null
      cookieExpiry = 0
      const newCookie = await loginAndGetCookie()
      if (newCookie) {
        result = await fetchFile(fileId, newCookie)
      }
    }

    if (result.success) {
      return new Response(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Content-Length': String(result.buffer.byteLength),
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        },
      })
    }

    return Response.json(
      {
        error: 'CPM2 Cookie 已過期或無效',
        hint: '請重新登入 cpm2.bes.com.tw 並更新 .env 中的 CPM2_COOKIE，或設定 CPM2_USERNAME + CPM2_PASSWORD 進行自動登入',
      },
      { status: 502 }
    )
  } catch (error) {
    console.error(`[file-proxy] 代理失敗 fileId=${fileId}:`, error)
    return new Response('代理請求失敗', { status: 500 })
  }
}
