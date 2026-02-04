/**
 * 確認對話框組件
 * 使用 MUI Dialog 顯示修改後的地址和電話號碼
 */

'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from '@mui/material'

export default function ConfirmDialog({ open, modifiedData, onConfirm, onCancel }) {
  // 處理確認
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(
        modifiedData.address,
        modifiedData.homePhone,
        modifiedData.mobilePhone
      )
    }
  }

  // 處理取消
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>確認修改</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          請確認以下修改內容：
        </Typography>
        <Box sx={{ marginTop: 2 }}>
          <Stack spacing={2}>
            {modifiedData.address && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  更新地址：
                </Typography>
                <Typography variant="body1" sx={{ marginTop: 0.5 }}>
                  {modifiedData.address}
                </Typography>
              </Box>
            )}
            {modifiedData.homePhone && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  更新住家電話：
                </Typography>
                <Typography variant="body1" sx={{ marginTop: 0.5 }}>
                  {modifiedData.homePhone}
                </Typography>
              </Box>
            )}
            {modifiedData.mobilePhone && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  更新手機電話：
                </Typography>
                <Typography variant="body1" sx={{ marginTop: 0.5 }}>
                  {modifiedData.mobilePhone}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} variant="outlined">
          取消
        </Button>
        <Button onClick={handleConfirm} variant="contained" autoFocus>
          確認
        </Button>
      </DialogActions>
    </Dialog>
  )
}

