'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function Footer({ employeeData = null }) {
  // 格式化員工資訊顯示
  const getEmployeeInfo = () => {
    if (!employeeData) return null
    
    const deptName = employeeData.DEPARTMENT_NAME || ''
    const empName = employeeData.EMPLOYEE_NAME || ''
    const extension = '#6230' // 固定分機號碼
    
    if (!deptName && !empName) return null
    
    return `開發人員: ${deptName} ${empName}(${extension})`
  }

  const employeeInfo = getEmployeeInfo()

  return (
    <Box sx={{ width: '100%', textAlign: 'center', pt: 4, pb: 2 }}>
      {employeeInfo && (
        <Typography variant="body2" color="text.secondary">
          {employeeInfo}
        </Typography>
      )}
    </Box>
  )
}

