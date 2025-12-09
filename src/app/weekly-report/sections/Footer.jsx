'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import DownloadIcon from '@mui/icons-material/Download'

export default function Footer({ employeeData = null }) {
  const handleDownloadClick = () => {
    // Chrome Web Store的goFullPage擴充功能網址
    const goFullPageUrl =
      'https://chrome.google.com/webstore/detail/gofullpage-full-page-scre/fdpohaocaechififmbbbbbknoalclacl'
    window.open(goFullPageUrl, '_blank')
  }

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
    <Box sx={{ width: '100%', textAlign: 'center', pt: 4 }}>
      <Typography variant="body2" color="text.secondary">
        中華工程 影音即時指揮中心開發
      </Typography>
      {employeeInfo && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {employeeInfo}
        </Typography>
      )}
      <Chip
        label="安裝Chrome網頁長截圖擴充功能"
        clickable
        onClick={handleDownloadClick}
        onDelete={handleDownloadClick}
        deleteIcon={<DownloadIcon />}
        variant="outlined"
        size="small"
        sx={{ border: 'none', color: 'text.secondary', mt: 1 }}
      />
    </Box>
  )
}
