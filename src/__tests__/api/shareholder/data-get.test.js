/**
 * 股東資料查詢 API 單元測試
 * GET /api/shareholder/data/[id]
 */
import { resetAllMocks, createParams, MOCK_SHAREHOLDER } from '../../helpers/setup'
import db from '@/lib/db'
import { GET } from '@/app/api/shareholder/data/[id]/route'

beforeEach(() => resetAllMocks())

describe('GET /api/shareholder/data/[id]', () => {
  it('成功查詢股東資料', async () => {
    db.query.mockResolvedValue([MOCK_SHAREHOLDER])

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.shareholderCode).toBe('000001')
    expect(json.data.name).toBe('王小明') // stripAll
    expect(json.data.uuid).toBe(MOCK_SHAREHOLDER.UUID)
  })

  it('clean 函數正確清理空白字串', async () => {
    db.query.mockResolvedValue([{ ...MOCK_SHAREHOLDER, UPDATED_ADDRESS: '  ', HOME_PHONE_2: '' }])

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.data.updatedAddress).toBeNull()
    expect(json.data.originalHomePhone2).toBeNull()
  })

  it('stripAll 函數移除所有空白', async () => {
    db.query.mockResolvedValue([{ ...MOCK_SHAREHOLDER, NAME: '  王  小  明  ' }])

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.data.name).toBe('王小明')
  })

  it('股東不存在回傳 404', async () => {
    db.query.mockResolvedValue([])

    const res = await GET(new Request('http://localhost'), createParams({ id: '999999' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('SHAREHOLDER_NOT_FOUND')
  })

  it('db.query 回傳 null 時回傳 404', async () => {
    db.query.mockResolvedValue(null)

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(404)
  })

  it('缺少股東代號回傳 400', async () => {
    const res = await GET(new Request('http://localhost'), createParams({ id: '' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('股東代號非數字回傳 400', async () => {
    const res = await GET(new Request('http://localhost'), createParams({ id: 'abc' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('股東代號超過6位回傳 400', async () => {
    const res = await GET(new Request('http://localhost'), createParams({ id: '1234567' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('資料庫錯誤回傳 500', async () => {
    db.query.mockRejectedValue(new Error('資料庫連接失敗'))

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('DATABASE_ERROR')
  })

  it('非資料庫錯誤回傳 500（INTERNAL_SERVER_ERROR）', async () => {
    db.query.mockRejectedValue(new Error('something else'))

    const res = await GET(new Request('http://localhost'), createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})
