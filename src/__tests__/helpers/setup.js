/**
 * 共用 mock 與 helper
 */

// ── NextResponse mock ──
// 模擬 next/server 的 NextResponse.json()
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init) => ({
      status: init?.status ?? 200,
      body,
      async json() { return this.body },
    }),
  },
}))

// ── db mock ──
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}))

// ── sms mock ──
jest.mock('@/lib/sms', () => ({
  __esModule: true,
  sendSMS: jest.fn(),
}))

// ── validation mock (passthrough — 使用真實實作) ──
// 不 mock validation，讓它使用真實邏輯

// ── crypto mock (部分) ──
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
}))

// ── helper: 建立一個包含 json() 方法的模擬 Request ──
export function createMockRequest(body) {
  return {
    json: async () => body,
  }
}

// ── helper: 建立 Next.js 15 params (Promise) ──
export function createParams(obj) {
  return { params: Promise.resolve(obj) }
}

// ── 共用測試資料 ──
export const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

export const MOCK_SHAREHOLDER = {
  SORT: '000001',
  NAME: '王 小 明',
  UUID: VALID_UUID,
  ID_LAST_FOUR: '1234',
  CITY1: '台北市',
  DISTRICT1: '大安區',
  POSTAL_CODE: '106',
  ORIGINAL_ADDRESS: '信義路一段1號',
  UPDATED_ADDRESS: null,
  UPDATED_CITY: null,
  UPDATED_DISTRICT: null,
  UPDATED_POSTAL_CODE: null,
  HOME_PHONE_1: '02-12345678',
  HOME_PHONE_2: null,
  MOBILE_PHONE_1: '0912345678',
  MOBILE_PHONE_2: null,
  UPDATED_HOME_PHONE_1: null,
  UPDATED_HOME_PHONE_2: null,
  UPDATED_MOBILE_PHONE_1: '0987654321',
  UPDATED_MOBILE_PHONE_2: null,
  LOGIN_COUNT: 5,
  UPDATE_COUNT: 2,
  CREATED_AT: '2024-01-01T00:00:00.000Z',
  UPDATED_AT: '2024-06-01T00:00:00.000Z',
}

// 重設所有 mock（使用 resetAllMocks 確保 mockResolvedValueOnce 佇列也被清除）
export function resetAllMocks() {
  jest.resetAllMocks()
}
