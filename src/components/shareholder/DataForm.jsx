/**
 * 資料修改表單組件
 * 使用 MUI TextField、shadcn/ui Input OTP、Button 元件
 * 遵循 Material Design 3.0 和文檔規範
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Box, TextField, Button, Card, CardContent, Typography, Stack } from '@mui/material'
import { validateAddress, validatePhone } from '@/lib/validation'

export default function DataForm({ shareholderData, qrCode, logId }) {
  const [updatedAddress, setUpdatedAddress] = useState('')
  const [updatedHomePhone, setUpdatedHomePhone] = useState('')
  const [updatedMobilePhone, setUpdatedMobilePhone] = useState('')
  const [originalAddress, setOriginalAddress] = useState('')
  const [originalHomePhone, setOriginalHomePhone] = useState('')
  const [originalMobilePhone, setOriginalMobilePhone] = useState('')
  // 記錄表單初始化時的值（用於判斷本次是否有變更）
  const [initialAddress, setInitialAddress] = useState('')
  const [initialHomePhone, setInitialHomePhone] = useState('')
  const [initialMobilePhone, setInitialMobilePhone] = useState('')
  const [addressError, setAddressError] = useState(null)
  const [homePhoneError, setHomePhoneError] = useState(null)
  const [mobilePhoneError, setMobilePhoneError] = useState(null)
  const router = useRouter()

  // 初始化表單資料
  useEffect(() => {
    if (shareholderData) {
      // 原資料（用於比對是否有變更，不可編輯）
      setOriginalAddress(shareholderData.originalAddress || '')
      setOriginalHomePhone(shareholderData.originalHomePhone || '')
      setOriginalMobilePhone(shareholderData.originalMobilePhone || '')
      // 更新資料（可編輯，預設：有更新值顯示更新值，沒有就顯示原值）
      // 注意：需要檢查 updatedAddress 是否為 null/undefined，如果是則使用 originalAddress
      const hasUpdatedAddress =
        shareholderData.updatedAddress !== null &&
        shareholderData.updatedAddress !== undefined &&
        shareholderData.updatedAddress !== ''
      const hasUpdatedHomePhone =
        shareholderData.updatedHomePhone !== null &&
        shareholderData.updatedHomePhone !== undefined &&
        shareholderData.updatedHomePhone !== ''
      const hasUpdatedMobilePhone =
        shareholderData.updatedMobilePhone !== null &&
        shareholderData.updatedMobilePhone !== undefined &&
        shareholderData.updatedMobilePhone !== ''

      // 計算要顯示的初始值（有更新值顯示更新值，沒有就顯示原值）
      const initialAddressValue = hasUpdatedAddress
        ? shareholderData.updatedAddress
        : shareholderData.originalAddress || ''
      const initialHomePhoneValue = hasUpdatedHomePhone
        ? shareholderData.updatedHomePhone
        : shareholderData.originalHomePhone || ''
      const initialMobilePhoneValue = hasUpdatedMobilePhone
        ? shareholderData.updatedMobilePhone
        : shareholderData.originalMobilePhone || ''

      // 記錄表單初始化時的值（用於判斷本次是否有變更）
      setInitialAddress(initialAddressValue)
      setInitialHomePhone(initialHomePhoneValue)
      setInitialMobilePhone(initialMobilePhoneValue)

      // 設定表單顯示值
      setUpdatedAddress(initialAddressValue)
      setUpdatedHomePhone(initialHomePhoneValue)
      setUpdatedMobilePhone(initialMobilePhoneValue)
    }
  }, [shareholderData])

  // 處理更新地址變更
  const handleAddressChange = e => {
    const value = e.target.value
    setUpdatedAddress(value)
    setAddressError(null)
  }

  // 處理更新住家電話變更
  const handleHomePhoneChange = e => {
    const value = e.target.value
    // 只允許數字和連字號
    const numericValue = value.replace(/[^0-9-]/g, '')
    setUpdatedHomePhone(numericValue)
    setHomePhoneError(null)
  }

  // 處理更新手機電話變更
  const handleMobilePhoneChange = e => {
    const value = e.target.value
    // 只允許數字
    const numericValue = value.replace(/[^0-9]/g, '')
    setUpdatedMobilePhone(numericValue)
    setMobilePhoneError(null)
  }

  // 處理表單提交（簡化流程：直接跳轉並記錄修改次數）
  const handleSubmit = async e => {
    e.preventDefault()

    // 使用 shareholderCode（股東代號，6位數字）
    const shareholderCode = shareholderData.shareholderCode

    if (!shareholderCode) {
      // 即使沒有股東代號也跳轉，但記錄錯誤
      console.error('無法取得股東代號')
      if (qrCode) {
        router.push(`/shareholder/update/${qrCode}/thank-you`)
      } else {
        router.push(`/shareholder/update/thank-you?success=true`)
      }
      return
    }

    // 準備更新資料（包含所有欄位，用於記錄修改次數和日誌）
    const updateData = {
      updatedAddress: updatedAddress.trim() || null,
      updatedHomePhone: updatedHomePhone.trim() || null,
      updatedMobilePhone: updatedMobilePhone.trim() || null,
      ...(logId && { logId }), // 如果有 logId，加入更新資料中
    }

    // 異步調用 API 記錄修改次數（不等待回應，直接跳轉）
    fetch(`/api/shareholder/data/${shareholderCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    }).catch(err => {
      // 靜默處理錯誤，不影響跳轉
      console.error('記錄修改次數錯誤:', err)
    })

    // 直接跳轉到感謝頁面
    if (qrCode) {
      router.push(`/shareholder/update/${qrCode}/thank-you`)
    } else {
      router.push(`/shareholder/update/thank-you?success=true`)
    }
  }

  // 遮罩身分證字號（只顯示英文字母+後面四碼，中間用'*'遮住）
  const maskIdNumber = idNumber => {
    if (!idNumber || idNumber.length < 5) return idNumber
    // 身分證字號格式：1個英文字母 + 9個數字
    // 顯示：英文字母 + ****** + 後四碼
    const firstChar = idNumber.charAt(0)
    const lastFour = idNumber.slice(-4)
    return `${firstChar}******${lastFour}`
  }

  // 取得要顯示的值（初始化時已處理：有更新值顯示更新值，沒有就顯示原值）
  // 直接返回狀態值即可，因為初始化時已經正確設定
  const getDisplayAddress = () => updatedAddress
  const getDisplayHomePhone = () => updatedHomePhone
  const getDisplayMobilePhone = () => updatedMobilePhone

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', marginTop: 4 }}>
      {/* 歡迎詞區塊 - 顯示在表單前面，獨立於Card，無背景，寬度較小並居中 */}
      <Box
        sx={{
          marginBottom: 3,
          maxWidth: 600,
          margin: '0 auto 24px auto',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontSize: '18px',
            fontWeight: 500,
            lineHeight: 1.8,
            color: 'text.primary',
            display: 'block',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: '30px',
            marginRight: '30px',
          }}
        >
          股東 <strong>{shareholderData?.name || ''}</strong> 您好，身分證字號{' '}
          <strong>{maskIdNumber(shareholderData?.idNumber || '')}</strong>
          。為確保公司能及時與您聯繫，並正確寄送股東會相關資料，請協助確認並更新您的聯絡地址及電話號碼。
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {/* 表單標題 */}
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: 2,
              color: 'text.primary',
            }}
          >
            聯絡資料
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {' '}
              {/* 文檔規範：表單欄位間距 md (16px) */}
              <TextField
                label="地址"
                value={getDisplayAddress()}
                onChange={handleAddressChange}
                error={!!addressError}
                helperText={addressError || '請輸入地址'}
                required
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                sx={{
                  '& .MuiInputBase-root': {
                    minHeight: '56px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '12px',
                  },
                }}
                inputProps={{
                  'aria-label': '地址輸入欄位',
                  'aria-required': 'true',
                  'aria-invalid': !!addressError,
                }}
              />
              <TextField
                label="住家電話"
                type="tel"
                value={getDisplayHomePhone()}
                onChange={handleHomePhoneChange}
                error={!!homePhoneError}
                helperText={homePhoneError || '請輸入住家電話（可選）'}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '12px',
                  },
                }}
                inputProps={{
                  maxLength: 20,
                  inputMode: 'tel',
                  'aria-label': '住家電話輸入欄位',
                  'aria-invalid': !!homePhoneError,
                }}
              />
              <TextField
                label="手機電話"
                type="tel"
                value={getDisplayMobilePhone()}
                onChange={handleMobilePhoneChange}
                error={!!mobilePhoneError}
                helperText={mobilePhoneError || '請輸入手機電話（可選）'}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '12px',
                  },
                }}
                inputProps={{
                  maxLength: 10,
                  inputMode: 'numeric',
                  pattern: '[0-9]{10}',
                  'aria-label': '手機電話輸入欄位',
                  'aria-invalid': !!mobilePhoneError,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large" // 文檔規範：Large (42px)
                fullWidth
                aria-label="資料確認"
                sx={{
                  fontSize: '14px', // 文檔規範：按鈕文字 14px
                  fontWeight: 500, // 文檔規範：Medium 字重
                  marginTop: 2,
                }}
              >
                資料確認
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* 謝詞及資料申明 - 顯示在表單後，無背景，文字靠左，logo置中，寬度較小並居中 */}
      <Box
        sx={{
          marginTop: 4,
          maxWidth: 600,
          margin: '32px auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'text.secondary',
            textAlign: 'left',
            paddingLeft: '30px',
            paddingRight: '30px',
          }}
        >
          感謝您的配合與協助。本系統所收集之資料僅供公司內部使用，我們將妥善保管您的個人資料，並遵循相關隱私保護法規。
        </Typography>

        {/* Logo 及公司名稱 - 置中對齊 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
          }}
        >
          <Image
            src="/logo.png"
            alt="中華工程股份有限公司 Logo"
            width={32}
            height={32}
            style={{ objectFit: 'contain' }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'text.primary',
            }}
          >
            中華工程股份有限公司
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
