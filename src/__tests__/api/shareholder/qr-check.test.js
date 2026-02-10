/**
 * QR Code 有效性檢查 API 單元測試
 * GET /api/shareholder/qr-check/[id]
 */
import { resetAllMocks, createParams, VALID_UUID } from '../../helpers/setup'
import db from '@/lib/db'
import crypto from 'crypto'
import { GET } from '@/app/api/shareholder/qr-check/[id]/route'

beforeEach(() => resetAllMocks())

const QR_SHAREHOLDER = {
  SORT: '000001',
  NAME: '王小明',
  ORIGINAL_ADDRESS: '信義路一段1號',
  HOME_PHONE_1: '02-12345678',
  MOBILE_PHONE_1: '0912345678',
  UPDATED_MOBILE_PHONE_1: '0987654321',
  UUID: VALID_UUID,
  LOGIN_COUNT: 5,
  UPDATE_COUNT: 2,
}

describe('GET /api/shareholder/qr-check/[id]', () => {
  it('QR Code 有效，回傳股東資料', async () => {
    crypto.randomUUID.mockReturnValue('scan-log-uuid')
    db.query
      .mockResolvedValueOnce([QR_SHAREHOLDER]) // 查詢股東
      .mockResolvedValueOnce(undefined)         // INSERT visit LOG

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.shareholderCode).toBe('000001')
    expect(json.data.name).toBe('王小明')
    expect(json.data.phoneNumber).toBe('0987654321') // UPDATED 優先
    expect(json.data.hasPhoneNumber).toBe(true)
    expect(json.data.scanLogId).toBe('scan-log-uuid')
    expect(json.data.uuid).toBe(VALID_UUID)
  })

  it('無 UPDATED_MOBILE 時使用 MOBILE_PHONE_1', async () => {
    const row = { ...QR_SHAREHOLDER, UPDATED_MOBILE_PHONE_1: null }
    crypto.randomUUID.mockReturnValue('log-id')
    db.query
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce(undefined)

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    expect(json.data.phoneNumber).toBe('0912345678')
    expect(json.data.hasPhoneNumber).toBe(true)
  })

  it('無手機號碼時 hasPhoneNumber=false', async () => {
    const row = { ...QR_SHAREHOLDER, UPDATED_MOBILE_PHONE_1: null, MOBILE_PHONE_1: null }
    crypto.randomUUID.mockReturnValue('log-id')
    db.query
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce(undefined)

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    expect(json.data.phoneNumber).toBeNull()
    expect(json.data.hasPhoneNumber).toBe(false)
  })

  it('QR Code 不存在回傳 404', async () => {
    db.query.mockResolvedValue([])

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error.code).toBe('QR_CODE_INVALID')
  })

  it('UUID 格式錯誤回傳 400', async () => {
    const res = await GET(new Request('http://localhost'), createParams({ id: 'not-a-uuid' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('缺少 id 回傳 400', async () => {
    const res = await GET(new Request('http://localhost'), createParams({ id: '' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('LOG 記錄建立（INSERT visit）', async () => {
    crypto.randomUUID.mockReturnValue('new-scan-log')
    db.query
      .mockResolvedValueOnce([QR_SHAREHOLDER])
      .mockResolvedValueOnce(undefined)

    await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))

    const logCall = db.query.mock.calls[1]
    expect(logCall[0]).toContain('INSERT')
    expect(logCall[0]).toContain('SHAREHOLDER_LOG')
    expect(logCall[1].logId).toBe('new-scan-log')
    expect(logCall[1].actionType).toBe('visit')
    expect(logCall[1].verificationType).toBe('phone') // 有手機 → phone
  })

  it('LOG 寫入失敗不影響主流程', async () => {
    crypto.randomUUID.mockReturnValue('log-id')
    db.query
      .mockResolvedValueOnce([QR_SHAREHOLDER])
      .mockRejectedValueOnce(new Error('log insert failed'))

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    // 主流程仍然成功
    expect(json.success).toBe(true)
  })

  it('資料庫錯誤回傳 500', async () => {
    db.query.mockRejectedValue(new Error('資料庫連接失敗'))

    const res = await GET(new Request('http://localhost'), createParams({ id: VALID_UUID }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('DATABASE_ERROR')
  })
})
