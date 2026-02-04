/**
 * 股東資料更新主頁面
 * 路徑：/shareholder/update/[qrCode]
 *
 * 此頁面接收 QR Code 參數，顯示身份驗證對話框，驗證成功後顯示資料修改表單
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import AuthDialog from '@/components/shareholder/AuthDialog'
import DataForm from '@/components/shareholder/DataForm'
import ErrorMessage from '@/components/shareholder/ErrorMessage'
import { Box, CircularProgress, Typography, AppBar, Toolbar } from '@mui/material'

export default function ShareholderUpdatePage() {
  const params = useParams()
  const qrCode = params?.qrCode
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [shareholderData, setShareholderData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [logId, setLogId] = useState(null) // 儲存登入記錄 ID
  const [hasPhoneNumber, setHasPhoneNumber] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(null)
  const [scanLogId, setScanLogId] = useState(null)
  const hasCheckedQrRef = useRef(false)

  useEffect(() => {
    const checkQrCode = async () => {
      // 避免在嚴格模式或重複渲染時多次呼叫 qr-check
      if (hasCheckedQrRef.current) return
      hasCheckedQrRef.current = true

      // 解析 QR Code 參數
      if (!qrCode) {
        setError({
          code: 'QR_CODE_INVALID',
          message: 'QR Code 無效或已過期，請聯繫管理員',
          contactInfo: '電話：02-1234-5678 | 電子郵件：admin@example.com',
        })
        setLoading(false)
        return
      }

      // 驗證 QR Code 格式（應為標準 UUID）
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidPattern.test(qrCode)) {
        setError({
          code: 'QR_CODE_INVALID',
          message: 'QR Code 無效或已過期，請聯繫管理員',
          contactInfo: '電話：02-1234-5678 | 電子郵件：admin@example.com',
        })
        setLoading(false)
        return
      }

      try {
        // 先呼叫後端 API 檢查 QR Code 是否存在且有效
        const response = await fetch(`/api/shareholder/qr-check/${qrCode}`)
        const data = await response.json()

        if (!response.ok || !data?.success) {
          const message = data?.error?.message || 'QR Code 無效或已過期，請聯繫管理員'

          setError({
            code: data?.error?.code || 'QR_CODE_INVALID',
            message,
            contactInfo: '電話：02-1234-5678 | 電子郵件：admin@example.com',
          })
          setLoading(false)
          return
        }

        const { hasPhoneNumber, phoneNumber, scanLogId } = data.data || {}
        setHasPhoneNumber(!!hasPhoneNumber && !!phoneNumber)
        setPhoneNumber(phoneNumber || null)
        setScanLogId(scanLogId || null)

        // QR Code 已通過伺服器端檢查，顯示身份驗證對話框
        setShowAuthDialog(true)
      } catch (err) {
        console.error('檢查 QR Code 錯誤:', err)
        setError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '伺服器錯誤，請稍後再試或聯繫管理員',
          contactInfo: '電話：02-1234-5678 | 電子郵件：admin@example.com',
        })
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    setError(null)
    setShowAuthDialog(false)
    checkQrCode()
  }, [qrCode])

  // 處理身份驗證成功
  const handleAuthSuccess = async data => {
    try {
      setShowAuthDialog(false)
      setIsAuthenticated(true)
      
      // 儲存 logId（如果有的話）
      if (data?.logId) {
        setLogId(data.logId)
      }

      // 驗證成功後，使用 shareholderCode 取得完整的股東資料（包含 original 和 updated 欄位）
      if (data?.shareholderCode) {
        const response = await fetch(`/api/shareholder/data/${data.shareholderCode}`)
        const result = await response.json()
        
        if (response.ok && result.success && result.data) {
          // 使用完整的資料結構
          setShareholderData(result.data)
        } else {
          // 如果取得完整資料失敗，使用驗證 API 回傳的基本資料
          console.warn('無法取得完整資料，使用基本資料:', result)
          setShareholderData(data)
        }
      } else {
        // 如果沒有 shareholderCode，直接使用驗證 API 回傳的資料
        setShareholderData(data)
      }
    } catch (err) {
      console.error('載入資料錯誤:', err)
      setError({
        code: 'DATA_LOAD_ERROR',
        message: '載入資料失敗，請重新整理頁面',
        contactInfo: '電話：02-1234-5678 | 電子郵件：admin@example.com',
      })
    }
  }

  // 處理身份驗證失敗 (不再設置頁面級別的錯誤，確保錯誤只在 AuthDialog 內顯示)
  const handleAuthError = errorMessage => {
    // 不在此處設置頁面級別的錯誤，因為 AuthDialog 會自行處理顯示
    console.error('身份驗證失敗 (由 AuthDialog 處理):', errorMessage)
  }

  // 渲染導覽列（所有狀態下都顯示）
  const renderNavBar = () => (
    <AppBar
      position="static"
      elevation={4}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2, // 文檔規範：gap md (16px)
          minHeight: '64px', // 文檔規範：高度 64px
        }}
      >
        <Image
          src="/logo.png"
          alt="中華工程股份有限公司 Logo"
          width={48}
          height={48}
          style={{ objectFit: 'contain' }}
        />
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontSize: '20px', // 文檔規範：h5 (20px)
            fontWeight: 500, // 文檔規範：Medium 字重
          }}
        >
          中華工程股份有限公司股東資料回報
        </Typography>
      </Toolbar>
    </AppBar>
  )

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        {renderNavBar()}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 64px)"
        >
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (error && !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        {renderNavBar()}
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 64px)"
          padding={3}
        >
          <ErrorMessage code={error.code} message={error.message} contactInfo={error.contactInfo} />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* 導覽列 */}
      {renderNavBar()}

      {/* 頁面內容 */}
      <Box
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {showAuthDialog && !isAuthenticated && (
          <AuthDialog
            open={showAuthDialog}
            qrCodeIdentifier={qrCode}
            hasPhoneNumber={hasPhoneNumber}
            phoneNumber={phoneNumber}
            scanLogId={scanLogId}
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
          />
        )}

        {isAuthenticated && shareholderData && (
          <DataForm shareholderData={shareholderData} qrCode={qrCode} logId={logId} />
        )}
      </Box>
    </Box>
  )
}
