import sql from 'mssql'
import { CONFIG } from '@/config-global'

const sqlConfig = {
  user: CONFIG.MSSQL_USER,
  password: CONFIG.MSSQL_PASSWORD,
  database: CONFIG.MSSQL_DATABASE,
  port: CONFIG.MSSQL_PORT,
  server: CONFIG.MSSQL_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    useUTC: false, // 讓 mssql 驅動以本地時間（UTC+8）解讀 GETDATE()，避免時區偏移
  },
  // 添加連接和請求超時設定
  pool: {
    max: 50,
    min: 5,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000, // 設定請求超時為 30 秒
  connectionTimeout: 30000, // 設定連接超時為 30 秒
}

class Database {
  constructor() {
    this.pool = null
  }

  async connect() {
    try {
      // 檢查連接池是否存在且已連接
      if (!this.pool || !this.pool.connected) {
        if (this.pool) {
          try {
            await this.pool.close()
          } catch (e) {
            // 忽略關閉錯誤
          }
        }
        this.pool = await new sql.ConnectionPool(sqlConfig).connect()
      }
      return this.pool
    } catch (err) {
      console.error('資料庫連接錯誤:', err)
      throw new Error(`資料庫連接失敗: ${err.message}`)
    }
  }

  async query(queryString, params = {}) {
    try {
      const pool = await this.connect()
      const request = pool.request()

      Object.entries(params).forEach(([key, value]) => {
        // 根據值的類型自動推斷 SQL 類型
        if (typeof value === 'string') {
          request.input(key, sql.NVarChar, value)
        } else if (typeof value === 'number') {
          request.input(key, sql.Int, value)
        } else if (value === null || value === undefined) {
          request.input(key, sql.NVarChar, value)
        } else {
          request.input(key, value)
        }
      })

      const result = await request.query(queryString)
      return result.recordset
    } catch (err) {
      console.error('資料庫查詢錯誤詳情:', {
        message: err.message,
        code: err.code,
        originalError: err.originalError,
        query: queryString,
        params: params
      })
      throw new Error(`資料庫查詢失敗: ${err.message}`)
    }
  }
}

const db = new Database()

export default db
