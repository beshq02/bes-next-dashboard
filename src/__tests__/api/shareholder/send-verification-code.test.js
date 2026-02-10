/**
 * 發送手機驗證碼 API 單元測試
 * POST /api/shareholder/send-verification-code
 */
import { resetAllMocks, createMockRequest, VALID_UUID, MOCK_SHAREHOLDER } from '../../helpers/setup'
import db from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import crypto from 'crypto'

// send-verification-code 在模組頂層讀取 process.env.TESTMODE
// 需要在 require 之前設定，利用動態 import 或直接設定
// 預設 TESTMODE=undefined → isTestMode=true

let POST

beforeAll(async () => {
  // 確保測試模式（TESTMODE 不設定 → 預設 true）
  delete process.env.TESTMODE
  // 動態 import 確保 isTestMode = true
  const mod = await import('@/app/api/shareholder/send-verification-code/route')
  POST = mod.POST
})

beforeEach(() => resetAllMocks())

const SHAREHOLDER_ROW = {
  SORT: '000001',
  UUID: VALID_UUID,
  MOBILE_PHONE_1: '0912345678',
  UPDATED_MOBILE_PHONE_1: '0987654321',
}

describe('POST /api/shareholder/send-verification-code', () => {
  it('成功發送驗證碼（測試模式）', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_ROW]) // 查詢股東
      .mockResolvedValueOnce(undefined)          // 記錄 LOG（update scanLogId）

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',   // 需與 UPDATED_MOBILE_PHONE_1 一致
      scanLogId: 'scan-log-id',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.expiresAt).toBeDefined()
    expect(json.data.message).toContain('驗證碼已發送')
    // 測試模式回傳驗證碼
    expect(json.data.verificationCode).toBeDefined()
    expect(json.data.verificationCode).toMatch(/^\d{4}$/)
    // 測試模式不呼叫 sendSMS
    expect(sendSMS).not.toHaveBeenCalled()
  })

  it('缺少 qrCodeIdentifier 回傳 400', async () => {
    const req = createMockRequest({ phoneNumber: '0987654321' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('缺少 phoneNumber 回傳 400', async () => {
    const req = createMockRequest({ qrCodeIdentifier: VALID_UUID })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('UUID 格式錯誤回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: 'not-a-uuid',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('股東不存在回傳 404', async () => {
    db.query.mockResolvedValue([])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error.code).toBe('QR_CODE_INVALID')
  })

  it('手機號碼不符回傳 401', async () => {
    db.query.mockResolvedValue([SHAREHOLDER_ROW])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0900000000', // 不符
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.code).toBe('AUTHENTICATION_FAILED')
  })

  it('手機號碼使用 UPDATED_MOBILE_PHONE_1 優先', async () => {
    db.query.mockResolvedValue([SHAREHOLDER_ROW])

    // 使用原始號碼而非更新號碼 → 應失敗
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0912345678', // MOBILE_PHONE_1，但 UPDATED 有值
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
  })

  it('無 UPDATED 時使用 MOBILE_PHONE_1', async () => {
    const row = { ...SHAREHOLDER_ROW, UPDATED_MOBILE_PHONE_1: null }
    db.query
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce(undefined)

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0912345678',
      scanLogId: 'scan-log-id',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.success).toBe(true)
  })

  it('有 scanLogId 時更新現有 LOG', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_ROW])
      .mockResolvedValueOnce(undefined)

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',
      scanLogId: 'existing-log-id',
    })
    await POST(req)

    // 第2次呼叫為 UPDATE LOG
    const logCall = db.query.mock.calls[1]
    expect(logCall[0]).toContain('UPDATE')
    expect(logCall[0]).toContain('SHAREHOLDER_LOG')
    expect(logCall[1].scanLogId).toBe('existing-log-id')
  })

  it('無 scanLogId 時建立新 LOG', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_ROW])
      .mockResolvedValueOnce(undefined)

    crypto.randomUUID.mockReturnValue('new-uuid-for-log')

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',
      // 不傳 scanLogId
    })
    await POST(req)

    const logCall = db.query.mock.calls[1]
    expect(logCall[0]).toContain('INSERT')
    expect(logCall[1].logId).toBe('new-uuid-for-log')
  })

  it('LOG 寫入失敗不影響主流程', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_ROW])
      .mockRejectedValueOnce(new Error('log write failed'))

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',
      scanLogId: 'scan-log-id',
    })
    const res = await POST(req)
    const json = await res.json()

    // 主流程仍然成功
    expect(json.success).toBe(true)
  })

  it('資料庫錯誤回傳 500', async () => {
    db.query.mockRejectedValue(new Error('資料庫連接失敗'))

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.code).toBe('DATABASE_ERROR')
  })
})
