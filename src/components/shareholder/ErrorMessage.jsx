/**
 * 錯誤訊息組件
 * 使用 MUI Alert 元件顯示錯誤訊息
 */

'use client'

import { Alert, AlertTitle, Box, Typography } from '@mui/material'

export default function ErrorMessage({ code, message, contactInfo }) {
  return (
    <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
      <AlertTitle>錯誤</AlertTitle>
      <Typography variant="body1" component="div">
        {message}
      </Typography>
      {contactInfo && (
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {contactInfo}
          </Typography>
        </Box>
      )}
    </Alert>
  )
}

