import { tables } from '@/lib/tables'
import WeeklyReportClient from './components/WeeklyReportClient'

export default async function WeeklyReport({ searchParams }) {
  const { ORD_NO: ordNo, fromAdmin, token } = await searchParams
  const ordNoC = await tables.sysAccessToken.getOrdNo()
  
  // 取得員工資料（員工編號 226178）
  let employeeData = null
  try {
    const employeeResult = await tables.frEmployee.getData('226178')
    employeeData = employeeResult[0] || null
  } catch (error) {
    console.error('取得員工資料失敗:', error)
  }
  
  // 只有當 fromAdmin=true 時才允許跳過驗證（從 admin 頁面來的）
  if (fromAdmin === 'true' && ordNo) {
    return <WeeklyReportClient skipAuth={true} adminOrdNo={ordNo} employeeData={employeeData} />
  }
  
  // 如果只有 token 參數而沒有 ORD_NO，從資料庫取得 ORD_NO
  let dbOrdNo = null
  if (token && !ordNo) {
    try {
      dbOrdNo = await tables.sysAccessToken.getOrdNoByToken(token)
    } catch (error) {
      console.error('從資料庫取得 ORD_NO 失敗:', error)
    }
  }
  
  // 其他情況都需要 token 驗證
  return <WeeklyReportClient ordNoC={ordNoC} dbOrdNo={dbOrdNo} employeeData={employeeData} />
}

export async function generateMetadata({ searchParams }) {
  const { ORD_NO: ordNo, token } = await searchParams
  const defaultSiteName = '工務所'
  const defaultOrdCh = '工令'

  // 如果沒有 ORD_NO，但有 token，嘗試從資料庫取得 ORD_NO
  let finalOrdNo = ordNo
  if (!finalOrdNo && token) {
    try {
      finalOrdNo = await tables.sysAccessToken.getOrdNoByToken(token)
    } catch (error) {
      console.error('從資料庫取得 ORD_NO 失敗:', error)
    }
  }

  // 如果還是沒有 ORD_NO，返回預設標題
  if (!finalOrdNo) {
    return {
      title: `${defaultSiteName} - ${defaultOrdCh}`,
    }
  }

  let siteName = defaultSiteName
  let ordCh = defaultOrdCh

  try {
    const wkMainData = await tables.wkMain.getData(finalOrdNo)
    siteName = wkMainData[0]?.SITE_CNAME || defaultSiteName
    ordCh = wkMainData[0]?.ORD_CH || defaultOrdCh
  } catch (error) {
    console.error('取得工務所名稱失敗:', error)
  } finally {
    return {
      title: `${siteName} - ${ordCh}`,
    }
  }
}
