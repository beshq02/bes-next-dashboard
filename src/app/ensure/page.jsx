import { tables } from '@/lib/tables'

import EnsureTable from './components/EnsureTable'
import Footer from './components/Footer'

export default async function Or80() {
  const wkEnsureData = await tables.wkEnsure.getData()
  const wkEnsureDescData = await tables.wkEnsureDesc.getData()
  
  // 取得員工資料（員工編號 226178）
  let employeeData = null
  try {
    const employeeResult = await tables.frEmployee.getData('226178')
    employeeData = employeeResult[0] || null
  } catch (error) {
    console.error('取得員工資料失敗:', error)
  }
  
  console.log(wkEnsureData)
  return (
    <div style={{ padding: 16 }}>
      <EnsureTable data={wkEnsureData} descData={wkEnsureDescData} />
      <Footer employeeData={employeeData} />
    </div>
  )
}
