/**
 * 身份驗證 API 單元測試
 * POST /api/shareholder/verify
 */
import { resetAllMocks, createMockRequest, VALID_UUID } from '../../helpers/setup'
import db from '@/lib/db'
import crypto from 'crypto'
import { POST } from '@/app/api/shareholder/verify/route'

beforeEach(() => resetAllMocks())

const SHAREHOLDER_QR = {
  SORT: '000001',
  UUID: VALID_UUID,
  NAME: '王小明',
  ORIGINAL_ADDRESS: '信義路一段1號',
  PHONE: '0987654321',
  UPDATED_MOBILE_PHONE_1: '0987654321',
  MOBILE_PHONE_1: '0912345678',
  ID_LAST_FOUR: '1234',
}

// 模擬 SHAREHOLDER_LOG 中的驗證碼記錄
const VALID_LOG_RECORD = {
  SHAREHOLDER_CODE: '000001',
  SHAREHOLDER_UUID: VALID_UUID,
  PHONE_NUMBER_USED: '0987654321',
  RANDOM_CODE: '1234',
  ACTION_TIME: new Date(), // 剛剛產生，未過期
  VERIFICATION_TYPE: 'phone',
  ACTION_TYPE: 'verify',
}

describe('POST /api/shareholder/verify', () => {
  // ─── 手機驗證 ───

  it('手機驗證成功', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])   // 查詢股東 (UUID)
      .mockResolvedValueOnce([VALID_LOG_RECORD]) // verifyCodeByLog: 查詢 LOG
      .mockResolvedValueOnce(undefined)           // 更新 LOGIN_COUNT
      .mockResolvedValueOnce(undefined)           // updateOrInsertVerificationLog

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
      scanLogId: 'scan-log-id',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.verified).toBe(true)
    expect(json.data.shareholderCode).toBe('000001')
    expect(json.data.logId).toBe('scan-log-id')
  })

  it('驗證碼錯誤回傳 401', async () => {
    const wrongCodeRecord = { ...VALID_LOG_RECORD, RANDOM_CODE: '9999' }
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])
      .mockResolvedValueOnce([wrongCodeRecord])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.code).toBe('AUTHENTICATION_FAILED')
  })

  it('驗證碼過期回傳 401', async () => {
    const expiredRecord = {
      ...VALID_LOG_RECORD,
      ACTION_TIME: new Date(Date.now() - 2 * 60 * 1000), // 2 分鐘前
    }
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])
      .mockResolvedValueOnce([expiredRecord])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.message).toContain('過期')
  })

  it('驗證碼不存在回傳 401', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])
      .mockResolvedValueOnce([])  // 無記錄

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.message).toContain('不存在')
  })

  // ─── 身分證驗證 ───

  it('身分證驗證成功', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])   // 查詢股東 (UUID)，含 ID_LAST_FOUR
      .mockResolvedValueOnce(undefined)           // UPDATE LOG (scanLogId)
      .mockResolvedValueOnce(undefined)           // 更新 LOGIN_COUNT
      .mockResolvedValueOnce(undefined)           // updateOrInsertVerificationLog

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'id',
      idLastFour: '1234',
      scanLogId: 'scan-log-id',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.verified).toBe(true)
  })

  it('身分證末四碼不符回傳 401', async () => {
    db.query
      .mockResolvedValueOnce([SHAREHOLDER_QR])  // UUID 查到的 ID_LAST_FOUR 是 '1234'

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'id',
      idLastFour: '5678',  // 使用者輸入不符
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.code).toBe('AUTHENTICATION_FAILED')
  })

  it('股東無身分證末四碼回傳 401', async () => {
    const noIdShareholder = { ...SHAREHOLDER_QR, ID_LAST_FOUR: null }
    db.query
      .mockResolvedValueOnce([noIdShareholder])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'id',
      idLastFour: '1234',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
  })

  // ─── 缺少必填欄位 ───

  it('缺少 qrCodeIdentifier 回傳 400', async () => {
    const req = createMockRequest({
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('缺少 verificationType 回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it('verificationType 無效值回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'email',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it('手機驗證缺少 verificationCode 回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it('手機驗證缺少 phoneNumber 回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it('身分證驗證缺少 idLastFour 回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'id',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it('QR Code 無效（UUID 查無股東）回傳 404', async () => {
    db.query.mockResolvedValue([])

    const req = createMockRequest({
      qrCodeIdentifier: VALID_UUID,
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error.code).toBe('QR_CODE_INVALID')
  })

  it('QR Code 識別碼格式非 UUID 回傳 400', async () => {
    const req = createMockRequest({
      qrCodeIdentifier: 'not-uuid-format',
      verificationType: 'phone',
      verificationCode: '1234',
      phoneNumber: '0987654321',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })
})
