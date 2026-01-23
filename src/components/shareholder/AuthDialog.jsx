/**
 * 身份驗證對話框組件
 * 使用 MUI Dialog、shadcn/ui Input OTP、Button 元件
 * 遵循 Material Design 3.0 和文檔規範
 * 
 * 支援兩種驗證模式：
 * 1. 手機驗證碼驗證（當股東資料中有手機號碼時）
 * 2. 身分證末四碼驗證（當股東資料中沒有手機號碼時）
 */

'use client'

import { useEffect, useState } from 'react'
import { keyframes } from '@emotion/react'
import Image from 'next/image'
import Lottie from 'lottie-react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { validateIdLastFour, validateVerificationCode } from '@/lib/validation'

// 測試模式：從環境變數讀取（前端需要使用 NEXT_PUBLIC_ 前綴）
// 設定方式：在 .env 檔案中設定 NEXT_PUBLIC_TESTMODE=true 或 NEXT_PUBLIC_TESTMODE=false
// 或設定 NEXT_PUBLIC_TESTMODE=1（測試模式）或 NEXT_PUBLIC_TESTMODE=0（正式模式）
const isTestMode = process.env.NEXT_PUBLIC_TESTMODE === 'true' || process.env.NEXT_PUBLIC_TESTMODE === '1' || process.env.NEXT_PUBLIC_TESTMODE === undefined

export default function AuthDialog({
  open,
  qrCodeIdentifier,
  hasPhoneNumber,
  phoneNumber: initialPhoneNumber,
  scanLogId: initialScanLogId,
  onSuccess,
  onError,
}) {
  // 驗證模式：'phone' | 'id' | 'loading'
  const [verificationMode, setVerificationMode] = useState('loading')
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || null)
  const [hasSentCode, setHasSentCode] = useState(false) // 是否已發送過驗證碼
  const [verificationCode, setVerificationCode] = useState('') // 手機驗證碼（4碼）
  const [idLastFour, setIdLastFour] = useState('') // 身分證末四碼（4碼）
  const [scanLogId, setScanLogId] = useState(initialScanLogId || null) // 掃描時建立的 log ID
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false) // 發送驗證碼中
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null)
  const [contactInfo] = useState('電話：02-1234-5678 | 電子郵件：admin@example.com')
  const [shake, setShake] = useState(false)
  const [expiresAt, setExpiresAt] = useState(null) // 驗證碼過期時間
  const [remainingSeconds, setRemainingSeconds] = useState(null) // 剩餘秒數
  const [generatedCode, setGeneratedCode] = useState(null) // 產生的驗證碼（測試用）
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false) // 是否顯示成功動畫
  const [verificationData, setVerificationData] = useState(null) // 儲存驗證成功的資料

  // 監聽驗證碼變化，當輸入滿 4 碼時自動觸發驗證
  useEffect(() => {
    const codeLength = verificationCode ? verificationCode.length : 0
    const shouldTrigger = hasSentCode && codeLength === 4 && !loading && verificationMode === 'phone' && qrCodeIdentifier && phoneNumber
    
    console.log('🔍 useEffect 檢查:', {
      hasSentCode: String(hasSentCode),
      verificationCode: String(verificationCode),
      codeLength: String(codeLength),
      loading: String(loading),
      verificationMode: String(verificationMode),
      qrCodeIdentifier: String(qrCodeIdentifier),
      phoneNumber: String(phoneNumber),
      shouldTrigger: String(shouldTrigger)
    })
    
    if (shouldTrigger) {
      console.log('✅ useEffect 觸發驗證:', verificationCode)
      // 使用 setTimeout 確保 state 更新完成後再觸發驗證
      const timer = setTimeout(() => {
        handlePhoneVerification(verificationCode)
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationCode, hasSentCode, loading, verificationMode, qrCodeIdentifier, phoneNumber])

  const shakeKeyframes = keyframes`
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  `

  const maskPhoneNumber = phone => {
    if (!phone || phone.length < 7) return phone || ''
    const first4 = phone.slice(0, 4)
    const last3 = phone.slice(-3)
    const maskLength = Math.max(phone.length - 7, 0)
    return `${first4}${'*'.repeat(maskLength)}${last3}`
  }

  // 根據父層傳入資訊初始化驗證模式與 logId：AuthDialog 不再自行呼叫 qr-check
  useEffect(() => {
    if (!open) return

    if (hasPhoneNumber && initialPhoneNumber) {
      setPhoneNumber(initialPhoneNumber)
      setVerificationMode('phone')
      setHasSentCode(false)
    } else {
      setVerificationMode('id')
    }

    if (initialScanLogId) {
      setScanLogId(initialScanLogId)
    }
  }, [open, hasPhoneNumber, initialPhoneNumber, initialScanLogId])

  // 重置狀態
  useEffect(() => {
    if (!open) {
      setVerificationMode('loading')
      setPhoneNumber(null)
      setHasSentCode(false)
      setScanLogId(null)
      setVerificationCode('')
      setIdLastFour('')
      setError(null)
      setErrorType(null)
      setShake(false)
      setSendingCode(false)
      setExpiresAt(null)
      setRemainingSeconds(null)
      setGeneratedCode(null)
      setShowSuccessAnimation(false)
      setVerificationData(null)
      setAnimationData(null)
    }
  }, [open])

  // 倒數計時器：當驗證碼過期時自動跳回原介面
  useEffect(() => {
    if (!hasSentCode || !expiresAt || verificationMode !== 'phone') {
      setRemainingSeconds(null)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = Math.max(0, Math.floor((expires - now) / 1000))

      if (diff <= 0) {
        // 時間到，跳回原介面
        setRemainingSeconds(null)
        setHasSentCode(false)
        setVerificationCode('')
        setError(null)
        setErrorType(null)
        setExpiresAt(null)
        return
      }

      setRemainingSeconds(diff)
    }

    // 立即更新一次
    updateTimer()

    // 每秒更新一次
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [hasSentCode, expiresAt, verificationMode])

  // 發送驗證碼
  const sendVerificationCode = async (phone) => {
    if (!qrCodeIdentifier || !phone) return

    setSendingCode(true)
    setError(null)

    try {
      const response = await fetch('/api/shareholder/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeIdentifier,
          phoneNumber: phone,
          scanLogId, // 傳入掃描時建立的 log ID
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error?.message || '驗證碼發送失敗，請稍後再試'
        setError(errorMsg)
        return
      }

      // 發送成功，切換到輸入驗證碼畫面
      setHasSentCode(true)
      
      // 記錄產生的驗證碼（僅測試模式才記錄，正式模式不顯示）
      if (isTestMode && data?.data?.verificationCode) {
        setGeneratedCode(data.data.verificationCode)
        console.log('✅ 測試模式：驗證碼已產生：', data.data.verificationCode)
      } else {
        // 正式模式：清除驗證碼，不顯示在畫面上
        setGeneratedCode(null)
      }
      
      // 記錄過期時間（從 API 回應取得，或計算 1 分鐘後）
      if (data?.data?.expiresAt) {
        setExpiresAt(data.data.expiresAt)
      } else {
        // 如果 API 沒有返回過期時間，預設為 1 分鐘後
        const expiryTime = new Date(Date.now() + 60 * 1000)
        setExpiresAt(expiryTime.toISOString())
      }
    } catch (err) {
      console.error('發送驗證碼錯誤:', err)
      setError('驗證碼發送失敗，請稍後再試')
    } finally {
      setSendingCode(false)
    }
  }

  // 處理手機驗證碼提交
  const handlePhoneVerification = async (code = verificationCode) => {
    if (!qrCodeIdentifier || !phoneNumber || !code) return

    const trimmed = String(code).trim()
    console.log(`[前端驗證] 接收到的 code: "${code}", type: ${typeof code}, trimmed: "${trimmed}"`)

    // 驗證格式
    const validation = validateVerificationCode(trimmed)
    if (!validation.valid) {
      setError('認證失敗，請重新輸入手機驗證碼')
      setErrorType('auth_failed')
      triggerShakeAndClear('phone')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const requestBody = {
        qrCodeIdentifier,
        verificationType: 'phone',
        verificationCode: trimmed,
        phoneNumber,
        scanLogId, // 傳入掃描時建立的 log ID
      }
      console.log(`[前端驗證] 發送請求:`, requestBody)
      const response = await fetch('/api/shareholder/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || '認證失敗，請重新輸入手機驗證碼'
        setError(errorMsg)
        setErrorType('auth_failed')
        triggerShakeAndClear('phone')
        if (onError) {
          onError(errorMsg)
        }
        setLoading(false)
        return
      }

      // 驗證成功
      if (data.success && data.data) {
        // 儲存驗證資料並顯示成功動畫
        setVerificationData(data.data)
        setShowSuccessAnimation(true)
        setLoading(false)
      } else {
        setError('認證失敗，請重新輸入手機驗證碼')
        setErrorType('auth_failed')
        triggerShakeAndClear('phone')
        if (onError) {
          onError('認證失敗，請重新輸入手機驗證碼')
        }
      }
    } catch (err) {
      console.error('身份驗證錯誤:', err)
      setError('認證失敗，請重新輸入手機驗證碼')
      setErrorType('auth_failed')
      triggerShakeAndClear('phone')
      if (onError) {
        onError('認證失敗，請重新輸入手機驗證碼')
      }
    } finally {
      setLoading(false)
    }
  }

  // 處理身分證末四碼提交
  const handleIdVerification = async (idLastFourValue = idLastFour) => {
    if (!qrCodeIdentifier || !idLastFourValue) return

    const trimmed = idLastFourValue.trim()

    // 驗證格式
    const validation = validateIdLastFour(trimmed)
    if (!validation.valid) {
      setError('認證失敗，請重新輸入身分證末四碼')
      setErrorType('auth_failed')
      triggerShakeAndClear('id')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shareholder/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeIdentifier,
          verificationType: 'id',
          idLastFour: trimmed,
          scanLogId, // 傳入掃描時建立的 log ID
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || '認證失敗，請重新輸入身分證末四碼'
        setError(errorMsg)
        setErrorType('auth_failed')
        triggerShakeAndClear('id')
        if (onError) {
          onError(errorMsg)
        }
        setLoading(false)
        return
      }

      // 驗證成功
      if (data.success && data.data) {
        // 儲存驗證資料並顯示成功動畫
        setVerificationData(data.data)
        setShowSuccessAnimation(true)
        setLoading(false)
      } else {
        setError('認證失敗，請重新輸入身分證末四碼')
        setErrorType('auth_failed')
        triggerShakeAndClear('id')
        if (onError) {
          onError('認證失敗，請重新輸入身分證末四碼')
        }
      }
    } catch (err) {
      console.error('身份驗證錯誤:', err)
      setError('認證失敗，請重新輸入身分證末四碼')
      setErrorType('auth_failed')
      triggerShakeAndClear('id')
      if (onError) {
        onError('認證失敗，請重新輸入身分證末四碼')
      }
    } finally {
      setLoading(false)
    }
  }

  // 處理手機驗證碼變更
  const handleVerificationCodeChange = (value) => {
    if (loading) return

    // input-otp 的 onChange 應該接收字符串，但為了安全起見，處理各種情況
    let codeValue = value
    if (typeof value === 'object' && value !== null) {
      // 如果是對象，嘗試從常見屬性獲取
      codeValue = value.value || value.target?.value || String(value)
    }
    if (typeof codeValue !== 'string') {
      codeValue = String(codeValue || '')
    }

    const numericOnly = codeValue.replace(/\D/g, '')
    const filteredValue = numericOnly.slice(0, 4)

    console.log('🔍 驗證碼輸入變更:', { 
      originalValue: value, 
      codeValue, 
      numericOnly, 
      filteredValue, 
      length: filteredValue.length,
      type: typeof value
    })

    setVerificationCode(filteredValue)

    // 清除錯誤當用戶開始輸入時
    if (error) {
      setError(null)
      setErrorType(null)
      setShake(false)
    }

    // 輸入滿 4 碼即自動驗證（由 useEffect 處理，這裡不直接調用）
  }

  // 處理身分證末四碼變更
  const handleIdNumberChange = (value) => {
    if (loading) return

    const numericOnly = value.replace(/\D/g, '')
    const filteredValue = numericOnly.slice(0, 4)

    setIdLastFour(filteredValue)

    // 清除錯誤當用戶開始輸入時
    if (error) {
      setError(null)
      setErrorType(null)
      setShake(false)
    }

    // 輸入滿 4 碼即自動驗證
    if (filteredValue.length === 4) {
      handleIdVerification(filteredValue)
    }
  }

  const triggerShakeAndClear = (mode) => {
    if (mode === 'phone') {
      setVerificationCode('')
    } else {
      setIdLastFour('')
    }
    setShake(true)
    setTimeout(() => {
      setShake(false)
      // 動畫結束後自動聚焦到第一個輸入框
      const firstInput = document.querySelector('[data-input-otp][data-input-otp-mss="0"]')
      if (firstInput) {
        firstInput.focus()
      }
    }, 400)
  }

  // 載入動畫資料
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    if (showSuccessAnimation && !animationData) {
      fetch('/animations/success.json')
        .then((res) => res.json())
        .then((data) => setAnimationData(data))
        .catch((err) => {
          console.error('載入動畫失敗:', err)
          // 如果載入失敗，直接呼叫 onSuccess
          if (onSuccess && verificationData) {
            onSuccess(verificationData)
          }
        })
    }
  }, [showSuccessAnimation, animationData, onSuccess, verificationData])

  // 處理動畫完成後的 callback
  const handleAnimationComplete = () => {
    if (onSuccess && verificationData) {
      onSuccess(verificationData)
    }
  }

  // 渲染輸入欄位（根據驗證模式）
  const renderInputFields = () => {
    // 顯示成功動畫
    if (showSuccessAnimation && animationData) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            width: '100%',
          }}
        >
          <Lottie
            animationData={animationData}
            loop={false}
            autoplay={true}
            onComplete={handleAnimationComplete}
            style={{ width: 200, height: 200 }}
          />
        </Box>
      )
    }

    // 動畫載入中
    if (showSuccessAnimation && !animationData) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            width: '100%',
          }}
        >
          <CircularProgress />
        </Box>
      )
    }

    if (verificationMode === 'loading' || sendingCode) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )
    }

    if (verificationMode === 'phone') {
      // 尚未發送驗證碼：顯示手機號碼與操作按鈕
      if (!hasSentCode && phoneNumber) {
        return (
          <Box
            sx={{
              flex: '0 0 auto',
              marginBottom: error ? 3 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'text.primary',
                textAlign: 'center',
              }}
            >
              請選擇驗證方式
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                優先以手機簡訊驗證，簡訊將發送至：
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'text.primary',
                  textAlign: 'center',
                }}
              >
                {maskPhoneNumber(phoneNumber)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <button
                  type="button"
                  onClick={() => sendVerificationCode(phoneNumber)}
                  disabled={sendingCode || loading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: sendingCode || loading ? 'not-allowed' : 'pointer',
                    opacity: sendingCode || loading ? 0.7 : 1,
                  }}
                  aria-label="獲取手機驗證碼"
                >
                  {sendingCode ? '驗證碼發送中...' : '獲取驗證碼'}
                </button>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationMode('id')
                    setError(null)
                    setErrorType(null)
                    setShake(false)
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.23)',
                    backgroundColor: '#fff',
                    color: 'rgba(0,0,0,0.87)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="改用身分證驗證"
                >
                  改用身分證驗證
                </button>
              </Box>
            </Box>
          </Box>
        )
      }

      // 已發送驗證碼：顯示手機驗證碼輸入欄位
      return (
        <Box
          sx={{
            flex: '0 0 auto',
            marginBottom: error ? 3 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: 2,
              fontSize: '18px',
              fontWeight: 600,
              color: 'text.primary',
              textAlign: 'center',
            }}
          >
            請輸入手機驗證碼（4 碼數字）
          </Typography>
          <Typography
            variant="body2"
            sx={{
              marginBottom: 1,
              fontSize: '14px',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            驗證碼已發送至您的手機 {phoneNumber ? `（${maskPhoneNumber(phoneNumber)}）` : ''}
          </Typography>
          {remainingSeconds !== null && remainingSeconds > 0 && (
            <Typography
              variant="body2"
              sx={{
                marginBottom: 1,
                fontSize: '14px',
                color: remainingSeconds <= 10 ? 'error.main' : 'text.secondary',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              驗證碼將於 {remainingSeconds} 秒後過期
            </Typography>
          )}
          {/* 僅在測試模式時顯示驗證碼 */}
          {isTestMode && generatedCode && (
            <Typography
              variant="body2"
              sx={{
                marginBottom: 3,
                fontSize: '16px',
                color: 'primary.main',
                textAlign: 'center',
                fontWeight: 700,
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                padding: '8px 16px',
                borderRadius: '4px',
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              🔑 測試模式：驗證碼為 {generatedCode}
            </Typography>
          )}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              animation: shake ? `${shakeKeyframes} 0.4s` : 'none',
              px: { xs: 2, sm: 4 },
            }}
          >
            <InputOTP
              maxLength={4}
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              disabled={loading || sendingCode}
              inputMode="numeric"
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                '& > div': {
                  width: '100%',
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                },
                '& [data-slot]': {
                  flex: 1,
                  minWidth: 80,
                  maxWidth: 120,
                  height: 80,
                  fontSize: '36px',
                  fontWeight: 600,
                },
                '& [data-slot][data-active=true]': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </Box>
        </Box>
      )
    }

    // 身分證末四碼模式
    return (
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: error ? 3 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            marginBottom: 3,
            fontSize: '18px',
            fontWeight: 600,
            color: 'text.primary',
            textAlign: 'center',
          }}
        >
          請輸入身分證末四碼
        </Typography>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            animation: shake ? `${shakeKeyframes} 0.4s` : 'none',
            px: { xs: 2, sm: 4 },
          }}
        >
          <InputOTP
            maxLength={4}
            value={idLastFour}
            onChange={handleIdNumberChange}
            disabled={loading}
            inputMode="numeric"
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              '& > div': {
                width: '100%',
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
              },
              '& [data-slot]': {
                flex: 1,
                minWidth: 80,
                maxWidth: 120,
                height: 80,
                fontSize: '36px',
                fontWeight: 600,
              },
              '& [data-slot][data-active=true]': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </Box>
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) {
            if (verificationMode === 'phone') {
              handlePhoneVerification()
            } else if (verificationMode === 'id') {
              handleIdVerification()
            }
          }
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            sx={{ padding: '24px 24px 16px 24px' }}
          >
            <Image
              src="/logo.png"
              alt="中華工程股份有限公司 Logo"
              width={40}
              height={40}
              style={{ objectFit: 'contain' }}
            />
            <Typography
              variant="h5"
              component="div"
              align="center"
              sx={{
                fontSize: '20px',
                fontWeight: 500,
              }}
            >
              中華工程股份有限公司股東資料回報
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            padding: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: '50vh',
            justifyContent: 'center',
          }}
        >
          {renderInputFields()}
          {/* 錯誤訊息區域 */}
          {error && (
            <Box sx={{ flex: '0 0 auto', marginTop: 'auto' }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: '4px',
                }}
                role="alert"
                aria-live="polite"
              >
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: 1,
                  }}
                >
                  {error}
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    fontSize: '13px',
                    color: 'text.secondary',
                    marginBottom: 1,
                  }}
                >
                  請確認已掃描信件上的 QR Code，並輸入您的驗證碼
                </Typography>
                <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
                  若持續無法驗證，請聯絡我們：{contactInfo}
                </Box>
              </Alert>
            </Box>
          )}
        </DialogContent>
      </form>
    </Dialog>
  )
}
