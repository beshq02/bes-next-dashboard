import sql from 'mssql'
import { CONFIG } from '@/config-global'

import db from './db'

// 專門用於 STAGE 資料庫的連接配置
const stageDbConfig = {
  user: CONFIG.MSSQL_USER,
  password: CONFIG.MSSQL_PASSWORD,
  database: 'STAGE',
  port: CONFIG.MSSQL_PORT,
  server: CONFIG.MSSQL_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
}

class StageDatabase {
  constructor() {
    this.pool = null
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = await new sql.ConnectionPool(stageDbConfig).connect()
      }
      return this.pool
    } catch (err) {
      throw new Error(`STAGE 資料庫連接失敗: ${err.message}`)
    }
  }

  async query(queryString, params = {}) {
    try {
      const pool = await this.connect()
      const request = pool.request()

      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value)
      })

      const result = await request.query(queryString)
      return result.recordset
    } catch (err) {
      throw new Error(`STAGE 資料庫查詢失敗: ${err.message}`)
    }
  }
}

const stageDb = new StageDatabase()

export const tables = {
  wkWeeklyDate: {
    getData: async ordNo => {
      const query = `
        SELECT DISTINCT CALENDAR_DATE 
        FROM FR_WK_WEEKLY
        WHERE ORD_NO = @ordNo
        ORDER BY CALENDAR_DATE DESC
      `
      return await db.query(query, { ordNo })
    },
  },
  wkMain: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_MAIN
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkMainHelp: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_MAIN_HELP
        WHERE ORD_NO = @ordNo
        ORDER BY HELP_NUM
      `
      return await db.query(query, { ordNo })
    },
  },
  wkWeekly: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_WEEKLY
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkWeeklyCustomize: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_WEEKLY_CUSTOMIZE
        WHERE ORD_NO = @ordNo
        ORDER BY SORT
    `
      return await db.query(query, { ordNo })
    },
  },
  wkMonthly: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_MONTHLY
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkDifference: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_DIFFERENCE
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkDifferenceCash: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_DIFFERENCE_CASH
        WHERE ORD_NO = @ordNo
        ORDER BY DIFFERENCE_CASH_ID
      `
      return await db.query(query, { ordNo })
    },
  },
  wkRevenue: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_REVENUE 
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkMilestone: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_MILESTONE
        WHERE ORD_NO = @ordNo
        ORDER BY MILESTONE_NO, MILESTONE_ID
      `
      return await db.query(query, { ordNo })
    },
  },
  wkFile: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_FILE
        WHERE ORD_NO = @ordNo
        ORDER BY PIC_TYPE, PIC_ORDER
      `
      return await db.query(query, { ordNo })
    },
  },
  wkCriticalpathCco: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_CRITICALPATH_CCO
        WHERE ORD_NO = @ordNo
        ORDER BY CCO_NUM
      `
      return await db.query(query, { ordNo })
    },
  },
  wkTodo: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_TO_DO
        WHERE ORD_NO = @ordNo
        ORDER BY TODO_NUM
      `
      return await db.query(query, { ordNo })
    },
  },
  wkTodoB: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_TO_DO_B
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkTrack: {
    getData: async ordNo => {
      const query = `
        SELECT * FROM FR_WK_TRACK
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkRegulatoryTrack: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_REGULATORY_TRACK
        WHERE ORD_NO = @ordNo
        ORDER BY 
          ISNULL(RESERVE_DATE, 'Z'),
          CONTRACK_LEVEL,
          CONSTRUCTION_DATE ASC
      `
      return await db.query(query, { ordNo })
    },
  },
  wkControversialCases: {
    getData: async ordNo => {
      const query = `
        SELECT * 
        FROM FR_WK_CONTROVERSIAL_CASES
        WHERE ORD_NO = @ordNo
        ORDER BY C_TYPE DESC, C_ID
      `
      return await db.query(query, { ordNo })
    },
  },
  wkComControl: {
    getData: async ordNo => {
      const query = `
        SELECT *
        FROM FR_WK_COM_CONTROL
        WHERE ORD_NO = @ordNo
      `
      return await db.query(query, { ordNo })
    },
  },
  wkMonthlyPlot1: {
    getData: async ordNo => {
      const query = `SELECT * FROM FR_WK_MONTHLY_PROGRESS_PLOTDATA WHERE ORD_NO = @ordNo`
      return await db.query(query, { ordNo })
    },
  },
  wkMonthlyPlot1Extra: {
    getData: async ordNo => {
      const query = `SELECT * FROM FR_WK_MONTHLY_PROGRESS_PLOTDATA_EXTRA WHERE ORD_NO = @ordNo`
      return await db.query(query, { ordNo })
    },
  },
  wkDifferenceCashPlot: {
    getData: async ordNo => {
      const query = `SELECT * FROM FR_WK_DIFFERENCE_CASH_PLOTDATA WHERE ORD_NO = @ordNo ORDER BY YYMM`
      return await db.query(query, { ordNo })
    },
  },
  frProjectIncome: {
    getData: async ordNo => {
      const query = `SELECT * FROM FR_PROJECT_INCOME WHERE GBMCU = @ordNo ORDER BY YM`
      return await db.query(query, { ordNo })
    },
  },
  // STAGE 資料庫查詢 - Token 驗證
  sysAccessToken: {
    validateToken: async token => {
      const query = `
        SELECT TOKEN, EXPIRES_AT
        FROM SYS_ACCESS_TOKEN
        WHERE TOKEN = @token
        AND DATEADD(HOUR, 8, GETUTCDATE()) < EXPIRES_AT
      `
      return await stageDb.query(query, { token })
    },
    // 獲取 ID=30805 的 ORD_NO 值
    getOrdNo: async () => {
      const query = `
        SELECT ORD_NO
        FROM [STAGE].[dbo].[SYS_ACCESS_TOKEN]
        WHERE ID = @id
      `
      const result = await stageDb.query(query, { id: 30805 })
      return result[0] && result[0].ORD_NO ? result[0].ORD_NO : null
    },
    // 根據 token 從 SYS_ACCESS_TOKEN 表中取得 ORD_NO
    getOrdNoByToken: async token => {
      const query = `
        SELECT ORD_NO
        FROM SYS_ACCESS_TOKEN
        WHERE TOKEN = @token
      `
      const result = await stageDb.query(query, { token })
      return result[0] && result[0].ORD_NO ? result[0].ORD_NO : null
    },
    // 暴露 stageDb 以供其他查詢使用
    stageDb: stageDb,
  },
  wkEnsure: {
    getData: async () => {
      const query = `SELECT * FROM FR_WK_ENSURE ORDER BY ORD_NO, ENSURE_END_DATE`
      return await db.query(query)
    },
  },
  wkEnsureDesc: {
    getData: async () => {
      const query = `SELECT * FROM FR_WK_ENSURE_DESC`
      return await db.query(query)
    },
  },
  wkGantt: {
    getData: async () => {
      const query = `
        SELECT ORD_CH, ORD_NO, MNG_CNAME, DEFAULT_SDATE
        FROM FR_WK_GANTT
        ORDER BY DEFAULT_SDATE DESC
      `
      return await db.query(query)
    },
  },
  frEmployee: {
    getData: async employeeId => {
      const query = `
        SELECT *
        FROM FR_EMPLOYEE
        WHERE EMPLOYEE_ID = @employeeId
      `
      return await db.query(query, { employeeId })
    },
  },
}
