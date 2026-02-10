/**
 * 股東資料更新 API 單元測試
 * PUT /api/shareholder/data/[id]
 */
import { resetAllMocks, createMockRequest, createParams, MOCK_SHAREHOLDER } from '../../helpers/setup'
import db from '@/lib/db'
import { PUT } from '@/app/api/shareholder/data/[id]/route'

beforeEach(() => resetAllMocks())

// 現有資料（模擬 SELECT 結果）
const EXISTING = {
  CITY1: '台北市',
  DISTRICT1: '大安區',
  POSTAL_CODE: '106',
  ORIGINAL_ADDRESS: '信義路一段1號',
  HOME_PHONE_1: '02-12345678',
  HOME_PHONE_2: null,
  MOBILE_PHONE_1: '0912345678',
  MOBILE_PHONE_2: null,
  UPDATED_CITY: null,
  UPDATED_DISTRICT: null,
  UPDATED_ADDRESS: null,
  UPDATED_POSTAL_CODE: null,
  UPDATED_HOME_PHONE_1: null,
  UPDATED_HOME_PHONE_2: null,
  UPDATED_MOBILE_PHONE_1: null,
  UPDATED_MOBILE_PHONE_2: null,
}

describe('PUT /api/shareholder/data/[id]', () => {
  it('成功更新股東資料（有變更欄位）', async () => {
    // 第1次 query: SELECT 現有資料 → 第2次 query: UPDATE
    db.query.mockResolvedValueOnce([EXISTING]).mockResolvedValueOnce(undefined)

    const req = createMockRequest({
      updatedAddress: '新地址路100號',
    })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.shareholderCode).toBe('000001')

    // 驗證 UPDATE query 包含 updatedAddress
    const updateCall = db.query.mock.calls[1]
    expect(updateCall[0]).toContain('UPDATED_ADDRESS')
    expect(updateCall[1].updatedAddress).toBe('新地址路100號')
  })

  it('無變更欄位回傳 400', async () => {
    const req = createMockRequest({})
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('股東不存在回傳 404', async () => {
    db.query.mockResolvedValue([])

    const req = createMockRequest({ updatedAddress: '新地址' })
    const res = await PUT(req, createParams({ id: '999999' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error.code).toBe('SHAREHOLDER_NOT_FOUND')
  })

  it('股東代號格式錯誤回傳 400', async () => {
    const req = createMockRequest({ updatedAddress: '新地址' })
    const res = await PUT(req, createParams({ id: 'abc' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('缺少股東代號回傳 400', async () => {
    const req = createMockRequest({ updatedAddress: '新地址' })
    const res = await PUT(req, createParams({ id: '' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('差異比對：與預設值相同不產生 UPDATE 欄位', async () => {
    db.query.mockResolvedValueOnce([EXISTING]).mockResolvedValueOnce(undefined)

    // 傳入與 ORIGINAL_ADDRESS 相同的值 → 不應產生 UPDATED_ADDRESS
    const req = createMockRequest({ updatedAddress: '信義路一段1號' })
    const res = await PUT(req, createParams({ id: '000001' }))

    const updateCall = db.query.mock.calls[1]
    expect(updateCall[0]).not.toContain('UPDATED_ADDRESS = @updatedAddress')
  })

  it('差異比對：UPDATED 有值時以 UPDATED 為預設', async () => {
    const existing = { ...EXISTING, UPDATED_ADDRESS: '已更新地址' }
    db.query.mockResolvedValueOnce([existing]).mockResolvedValueOnce(undefined)

    // 傳入與 UPDATED_ADDRESS 相同的值 → 不變更
    const req = createMockRequest({ updatedAddress: '已更新地址' })
    await PUT(req, createParams({ id: '000001' }))

    const updateCall = db.query.mock.calls[1]
    expect(updateCall[0]).not.toContain('UPDATED_ADDRESS = @updatedAddress')
  })

  it('LOG 寫入成功（有 logId）', async () => {
    db.query
      .mockResolvedValueOnce([EXISTING])  // SELECT
      .mockResolvedValueOnce(undefined)   // UPDATE SHAREHOLDER
      .mockResolvedValueOnce(undefined)   // UPDATE SHAREHOLDER_LOG

    const req = createMockRequest({
      updatedAddress: '新地址路100號',
      logId: 'log-uuid-123',
    })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    // 第3次呼叫應為 LOG UPDATE
    expect(db.query).toHaveBeenCalledTimes(3)
    const logCall = db.query.mock.calls[2]
    expect(logCall[0]).toContain('SHAREHOLDER_LOG')
    expect(logCall[1].logId).toBe('log-uuid-123')
  })

  it('LOG 寫入失敗不影響主流程', async () => {
    db.query
      .mockResolvedValueOnce([EXISTING])             // SELECT
      .mockResolvedValueOnce(undefined)              // UPDATE SHAREHOLDER
      .mockRejectedValueOnce(new Error('log error')) // UPDATE LOG fails

    const req = createMockRequest({
      updatedAddress: '新地址路100號',
      logId: 'log-uuid-123',
    })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    // 主流程仍然成功
    expect(json.success).toBe(true)
  })

  it('無 logId 時不寫 LOG', async () => {
    db.query
      .mockResolvedValueOnce([EXISTING])  // SELECT
      .mockResolvedValueOnce(undefined)   // UPDATE SHAREHOLDER

    const req = createMockRequest({ updatedAddress: '新地址路100號' })
    await PUT(req, createParams({ id: '000001' }))

    // 應只呼叫 2 次（SELECT + UPDATE），不呼叫 LOG
    expect(db.query).toHaveBeenCalledTimes(2)
  })

  it('HAS_UPDATED_DATA 有變更時為 1', async () => {
    db.query
      .mockResolvedValueOnce([EXISTING])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)

    const req = createMockRequest({
      updatedAddress: '全新地址',
      logId: 'log-uuid',
    })
    await PUT(req, createParams({ id: '000001' }))

    const logCall = db.query.mock.calls[2]
    expect(logCall[1].hasUpdatedData).toBe(1)
  })

  it('HAS_UPDATED_DATA 無變更時為 0', async () => {
    db.query
      .mockResolvedValueOnce([EXISTING])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)

    // 傳入與預設值相同 → 不變更
    const req = createMockRequest({
      updatedAddress: '信義路一段1號',
      logId: 'log-uuid',
    })
    await PUT(req, createParams({ id: '000001' }))

    const logCall = db.query.mock.calls[2]
    expect(logCall[1].hasUpdatedData).toBe(0)
  })

  it('多欄位同時更新', async () => {
    db.query.mockResolvedValueOnce([EXISTING]).mockResolvedValueOnce(undefined)

    const req = createMockRequest({
      updatedCity: '新北市',
      updatedDistrict: '板橋區',
      updatedMobilePhone1: '0911222333',
    })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    const updateCall = db.query.mock.calls[1]
    expect(updateCall[0]).toContain('UPDATED_CITY')
    expect(updateCall[0]).toContain('UPDATED_DISTRICT')
    expect(updateCall[0]).toContain('UPDATED_MOBILE_PHONE_1')
  })

  it('資料庫錯誤回傳 500', async () => {
    db.query.mockRejectedValue(new Error('資料庫連接失敗'))

    const req = createMockRequest({ updatedAddress: '新地址' })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('DATABASE_ERROR')
  })

  it('非資料庫錯誤回傳 INTERNAL_SERVER_ERROR', async () => {
    db.query.mockRejectedValue(new Error('unexpected'))

    const req = createMockRequest({ updatedAddress: '新地址' })
    const res = await PUT(req, createParams({ id: '000001' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})
