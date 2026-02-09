/**
 * 圖片代理 API
 * 解決 cpm2.bes.com.tw 跨站 cookie 驗證導致前端無法載入圖片的問題
 *
 * 使用方式：
 * 1. 在瀏覽器登入 cpm2.bes.com.tw
 * 2. 開啟 DevTools → Application → Cookies → cpm2.bes.com.tw
 * 3. 複製 "Week" cookie 的值
 * 4. 在 .env 中設定：CPM2_COOKIE=Week=<複製的值>
 *
 * 注意：cpm2 伺服器即使成功回傳圖片也會帶 302 + location:/login，
 *       需透過 content-type 判斷是否為圖片，而非僅看 status code
 */

const CPM2_BASE = 'https://cpm2.bes.com.tw'
const FILE_URL = `${CPM2_BASE}/Week/File/GetWkFile`
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET(request, { params }) {
  const { fileId } = await params

  if (!fileId || isNaN(fileId)) {
    return new Response('無效的 fileId', { status: 400 })
  }

  const cookie = process.env.CPM2_COOKIE
  if (!cookie) {
    return Response.json(
      {
        error: '未設定 CPM2_COOKIE',
        hint: '請在 .env 中設定 CPM2_COOKIE=Week=<你的cookie值>',
      },
      { status: 503 }
    )
  }

  try {
    const targetUrl = `${FILE_URL}?fileId=${fileId}`

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': UA,
        Cookie: cookie,
      },
      redirect: 'manual',
    })

    const contentType = response.headers.get('content-type') || ''
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10)

    // cpm2 伺服器的特殊行為：即使有圖片資料也回傳 302
    // 判斷方式：看 content-type 是否為圖片/檔案且有實際內容
    const hasFileContent =
      contentLength > 0 &&
      (contentType.startsWith('image/') ||
        contentType.startsWith('application/pdf') ||
        contentType.startsWith('application/octet-stream') ||
        contentType.startsWith('application/msword') ||
        contentType.startsWith('application/vnd.'))

    if (hasFileContent) {
      const buffer = await response.arrayBuffer()

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(buffer.byteLength),
          // 快取 7 天
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        },
      })
    }

    // 真正的認證失敗（沒有檔案內容）
    if (response.status === 401 || response.status === 302) {
      return Response.json(
        {
          error: 'CPM2 Cookie 已過期或無效',
          hint: '請重新登入 cpm2.bes.com.tw 並更新 .env 中的 CPM2_COOKIE',
        },
        { status: 502 }
      )
    }

    if (!response.ok) {
      return new Response(`上游伺服器錯誤: ${response.status}`, { status: response.status })
    }

    // 其他非檔案類型的成功回應
    const buffer = await response.arrayBuffer()
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': contentType },
    })
  } catch (error) {
    console.error(`[file-proxy] 代理失敗 fileId=${fileId}:`, error)
    return new Response('代理請求失敗', { status: 500 })
  }
}
