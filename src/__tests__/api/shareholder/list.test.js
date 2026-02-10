/**
 * 股東列表 API 單元測試
 * GET /api/shareholder/list
 */
import { resetAllMocks, MOCK_SHAREHOLDER } from '../../helpers/setup'
import db from '@/lib/db'
import { GET } from '@/app/api/shareholder/list/route'

beforeEach(() => resetAllMocks())

describe('GET /api/shareholder/list', () => {
  it('成功回傳股東列表', async () => {
    db.query.mockResolvedValue([MOCK_SHAREHOLDER])

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].shareholderCode).toBe('000001')
    expect(json.data[0].name).toBe('王小明') // stripAll 移除空白
    expect(json.data[0].uuid).toBe(MOCK_SHAREHOLDER.UUID)
  })

  it('回應格式含 city1, district1 欄位', async () => {
    db.query.mockResolvedValue([MOCK_SHAREHOLDER])

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()
    const item = json.data[0]

    expect(item).toHaveProperty('city1', '台北市')
    expect(item).toHaveProperty('district1', '大安區')
    expect(item).toHaveProperty('originalAddress', '信義路一段1號')
    expect(item).toHaveProperty('originalHomePhone', '02-12345678')
    expect(item).toHaveProperty('originalMobilePhone', '0912345678')
    expect(item).toHaveProperty('updatedMobilePhone', '0987654321')
  })

  it('空資料庫回傳空陣列', async () => {
    db.query.mockResolvedValue([])

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
  })

  it('db.query 回傳 null 時回傳空陣列', async () => {
    db.query.mockResolvedValue(null)

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
  })

  it('資料庫查詢失敗回傳 500（資料庫錯誤）', async () => {
    db.query.mockRejectedValue(new Error('資料庫查詢失敗'))

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('DATABASE_ERROR')
  })

  it('非資料庫錯誤回傳 500（伺服器錯誤）', async () => {
    db.query.mockRejectedValue(new Error('unexpected'))

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('loginCount / updateCount 為 null 時回傳 0', async () => {
    db.query.mockResolvedValue([{ ...MOCK_SHAREHOLDER, LOGIN_COUNT: null, UPDATE_COUNT: null }])

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(json.data[0].loginCount).toBe(0)
    expect(json.data[0].updateCount).toBe(0)
  })

  it('多筆資料正確轉換', async () => {
    const second = { ...MOCK_SHAREHOLDER, SORT: '000002', NAME: '李大華' }
    db.query.mockResolvedValue([MOCK_SHAREHOLDER, second])

    const res = await GET(new Request('http://localhost'))
    const json = await res.json()

    expect(json.data).toHaveLength(2)
    expect(json.data[1].shareholderCode).toBe('000002')
    expect(json.data[1].name).toBe('李大華')
  })
})
