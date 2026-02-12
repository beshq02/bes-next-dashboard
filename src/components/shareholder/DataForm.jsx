/**
 * 資料修改表單組件
 * 使用 MUI TextField、Button 元件
 * 遵循 Material Design 3.0 和文檔規範
 */

'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  CardContent,
  FormControl,
  FormHelperText,
} from '@mui/material'

import { areaData } from '@/lib/data/taiwanAreaData'

export default function DataForm({ shareholderData, qrCode, logId }) {
  // 地址欄位
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [originalCity, setOriginalCity] = useState('')
  const [originalDistrict, setOriginalDistrict] = useState('')
  const [originalPostalCode, setOriginalPostalCode] = useState('')
  const [originalAddress, setOriginalAddress] = useState('')

  // 電話欄位
  const [homePhone1, setHomePhone1] = useState('')
  const [homePhone2, setHomePhone2] = useState('')
  const [mobilePhone1, setMobilePhone1] = useState('')
  const [mobilePhone2, setMobilePhone2] = useState('')
  const [originalHomePhone1, setOriginalHomePhone1] = useState('')
  const [originalHomePhone2, setOriginalHomePhone2] = useState('')
  const [originalMobilePhone1, setOriginalMobilePhone1] = useState('')
  const [originalMobilePhone2, setOriginalMobilePhone2] = useState('')

  // Email 欄位
  const [email, setEmail] = useState('')

  // 錯誤狀態
  const [cityError, setCityError] = useState('')
  const [districtError, setDistrictError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [homePhone1Error, setHomePhone1Error] = useState('')
  const [mobilePhone1Error, setMobilePhone1Error] = useState('')
  const [emailError, setEmailError] = useState('')

  // 是否已觸碰欄位（用於顯示即時驗證錯誤）
  const [touchedFields, setTouchedFields] = useState({})

  const router = useRouter()

  // 輔助函數：判斷值是否有效
  const hasValue = val => val !== null && val !== undefined && val !== ''

  // 初始化表單資料
  useEffect(() => {
    if (shareholderData) {
      // 設定原始值
      setOriginalCity(shareholderData.originalCity || '')
      setOriginalDistrict(shareholderData.originalDistrict || '')
      setOriginalPostalCode(shareholderData.originalPostalCode || '')
      setOriginalAddress(shareholderData.originalAddress || '')
      setOriginalHomePhone1(shareholderData.originalHomePhone1 || '')
      setOriginalHomePhone2(shareholderData.originalHomePhone2 || '')
      setOriginalMobilePhone1(shareholderData.originalMobilePhone1 || '')
      setOriginalMobilePhone2(shareholderData.originalMobilePhone2 || '')

      // 計算初始顯示值（有更新值顯示更新值，沒有就顯示原值）
      const initialCity = hasValue(shareholderData.updatedCity)
        ? shareholderData.updatedCity
        : shareholderData.originalCity || ''
      setCity(initialCity)

      // 行政區：若初始縣市在 areaData 中且行政區值也在該縣市的清單中，才設定
      const initialDistrict = hasValue(shareholderData.updatedDistrict)
        ? shareholderData.updatedDistrict
        : shareholderData.originalDistrict || ''
      setDistrict(initialDistrict)

      setPostalCode(
        hasValue(shareholderData.updatedPostalCode)
          ? shareholderData.updatedPostalCode
          : shareholderData.originalPostalCode || ''
      )
      setAddress(
        hasValue(shareholderData.updatedAddress)
          ? shareholderData.updatedAddress
          : shareholderData.originalAddress || ''
      )
      setHomePhone1(
        hasValue(shareholderData.updatedHomePhone1)
          ? shareholderData.updatedHomePhone1
          : shareholderData.originalHomePhone1 || ''
      )
      setHomePhone2(
        hasValue(shareholderData.updatedHomePhone2)
          ? shareholderData.updatedHomePhone2
          : shareholderData.originalHomePhone2 || ''
      )
      setMobilePhone1(
        hasValue(shareholderData.updatedMobilePhone1)
          ? shareholderData.updatedMobilePhone1
          : shareholderData.originalMobilePhone1 || ''
      )
      setMobilePhone2(
        hasValue(shareholderData.updatedMobilePhone2)
          ? shareholderData.updatedMobilePhone2
          : shareholderData.originalMobilePhone2 || ''
      )
      setEmail(shareholderData.updatedEmail || '')
    }
  }, [shareholderData])

  // 即時驗證函數（僅格式驗證，所有欄位皆為選填）
  const validateField = (fieldName, value) => {
    const trimmedValue = (value || '').trim()

    switch (fieldName) {
      case 'city':
        if (!trimmedValue) {
          setCityError('請選擇縣市')
          return false
        }
        setCityError('')
        return true

      case 'district':
        if (!trimmedValue) {
          setDistrictError('請選擇鄉鎮市區')
          return false
        }
        setDistrictError('')
        return true

      case 'address':
        if (!trimmedValue) {
          setAddressError('請輸入詳細地址')
          return false
        }
        setAddressError('')
        return true

      case 'homePhone1':
        setHomePhone1Error('')
        return true

      case 'mobilePhone1':
        if (!trimmedValue) {
          setMobilePhone1Error('請輸入手機號碼')
          return false
        }
        if (!/^09\d{8}$/.test(trimmedValue)) {
          setMobilePhone1Error('手機號碼格式錯誤')
          return false
        }
        setMobilePhone1Error('')
        return true

      case 'email':
        if (trimmedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
          setEmailError('Email 格式錯誤')
          return false
        }
        setEmailError('')
        return true

      default:
        return true
    }
  }

  // 處理欄位失去焦點
  const handleBlur = fieldName => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    switch (fieldName) {
      case 'city':
        validateField('city', city)
        break
      case 'district':
        validateField('district', district)
        break
      case 'address':
        validateField('address', address)
        break
      case 'homePhone1':
        validateField('homePhone1', homePhone1)
        break
      case 'mobilePhone1':
        validateField('mobilePhone1', mobilePhone1)
        break
      case 'email':
        validateField('email', email)
        break
    }
  }

  // 處理欄位變更
  const handleCityChange = e => {
    const value = e.target.value
    setCity(value)
    setDistrict('') // 縣市變更時清空行政區
    if (touchedFields.city) validateField('city', value)
    if (touchedFields.district) setDistrictError('')
  }

  const handleDistrictChange = e => {
    const value = e.target.value
    setDistrict(value)
    if (touchedFields.district) validateField('district', value)
  }

  const handlePostalCodeChange = e => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5)
    setPostalCode(value)
  }

  const handleAddressChange = e => {
    const value = e.target.value
    setAddress(value)
    if (touchedFields.address) validateField('address', value)
  }

  const handleHomePhone1Change = e => {
    const value = e.target.value.replace(/[^0-9-]/g, '')
    setHomePhone1(value)
    if (touchedFields.homePhone1) validateField('homePhone1', value)
  }

  const handleHomePhone2Change = e => {
    const value = e.target.value.replace(/[^0-9-]/g, '')
    setHomePhone2(value)
  }

  const handleMobilePhone1Change = e => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setMobilePhone1(value)
    if (touchedFields.mobilePhone1) validateField('mobilePhone1', value)
  }

  const handleMobilePhone2Change = e => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setMobilePhone2(value)
  }

  const handleEmailChange = e => {
    const value = e.target.value
    setEmail(value)
    if (touchedFields.email) validateField('email', value)
  }

  // 驗證所有欄位（含必填檢查）
  const validateAllFields = () => {
    const isValidMobilePhone1 = validateField('mobilePhone1', mobilePhone1)
    const isValidCity = validateField('city', city)
    const isValidDistrict = validateField('district', district)
    const isValidAddress = validateField('address', address)
    const isValidEmail = validateField('email', email)

    setTouchedFields({
      mobilePhone1: true,
      city: true,
      district: true,
      address: true,
      email: true,
    })

    return isValidMobilePhone1 && isValidCity && isValidDistrict && isValidAddress && isValidEmail
  }

  // 處理表單提交
  const handleSubmit = async e => {
    e.preventDefault()

    // 驗證欄位格式
    if (!validateAllFields()) {
      return
    }

    const shareholderCode = shareholderData.shareholderCode

    if (!shareholderCode) {
      console.error('無法取得股東代號')
      if (qrCode) {
        router.push(`/shareholder/update/${qrCode}/thank-you`)
      } else {
        router.push(`/shareholder/update/thank-you?success=true`)
      }
      return
    }

    // 準備更新資料
    const updateData = {
      updatedCity: city.trim() || null,
      updatedDistrict: district.trim() || null,
      updatedPostalCode: postalCode.trim() || null,
      updatedAddress: address.trim() || null,
      updatedHomePhone1: homePhone1.trim() || null,
      updatedHomePhone2: homePhone2.trim() || null,
      updatedMobilePhone1: mobilePhone1.trim() || null,
      updatedMobilePhone2: mobilePhone2.trim() || null,
      updatedEmail: email.trim() || null,
      ...(logId && { logId }),
    }

    try {
      // 等待 API 完成後再跳轉
      await fetch(`/api/shareholder/data/${shareholderCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    } catch (err) {
      console.error('更新股東資料錯誤:', err)
    }

    // API 完成後跳轉到感謝頁面
    if (qrCode) {
      router.push(`/shareholder/update/${qrCode}/thank-you`)
    } else {
      router.push(`/shareholder/update/thank-you?success=true`)
    }
  }

  // 遮罩身分證字號
  const maskIdNumber = idNumber => {
    if (!idNumber || idNumber.length < 5) return idNumber
    const firstChar = idNumber.charAt(0)
    const lastFour = idNumber.slice(-4)
    return `${firstChar}******${lastFour}`
  }

  // 共用的輸入框樣式
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#fff',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
        borderWidth: '2px',
      },
      '&.Mui-error .MuiOutlinedInput-notchedOutline': {
        borderColor: '#d32f2f',
      },
    },
    '& .MuiInputLabel-root': {
      fontSize: '14px',
      color: '#666',
      '&.Mui-focused': {
        color: '#1976d2',
      },
      '&.Mui-error': {
        color: '#d32f2f',
      },
    },
    '& .MuiFormHelperText-root': {
      fontSize: '12px',
      marginLeft: 0,
      marginTop: '4px',
      '&.Mui-error': {
        color: '#d32f2f',
        fontWeight: 500,
      },
    },
  }

  // 顯示用姓名：去除前後空白、合併連續空白，空值不顯示
  const displayName = (shareholderData?.name || '').replace(/\s+/g, '') || null

  return (
    <Box
      sx={{
        maxWidth: { xs: '100%', sm: 600 },
        margin: '0 auto',
        marginTop: { xs: 2, sm: 4 },
        px: { xs: 0, sm: 2 },
      }}
    >
      {/* 歡迎詞區塊 */}
      <Box
        sx={{
          marginBottom: 3,
          backgroundColor: '#f8f9fa',
          borderRadius: { xs: '8px', sm: '12px' },
          border: '1px solid #e8eaed',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          component="div"
          variant="body1"
          sx={{
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.8,
            color: '#333',
          }}
        >
          <p style={{ margin: '0 0 0.75em 0', fontSize: '16px' }}>
            {displayName ? <strong style={{ display: 'inline' }}>{displayName}</strong> : null}
            {displayName ? ' ' : ''}股東您好，
          </p>
          <p style={{ margin: '0 0 0.75em 0' }}>
            承蒙您長期以來對中華工程的支持與信任，鑑於您身為本公司的尊榮股東，秉持ESG精神及股東對話的原則，恭喜您獲選本次「ESG問卷」資格，
完成問卷將獲得<strong>【7-11壹百元商品卡】</strong>。
          </p>
          <p style={{ margin: '0 0 0.5em 0' }}>
            為確保商品券能順利寄送，請在填寫問券前確認以下資料並更新您的手機號碼及聯絡地址。
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#888', textAlign: 'right', paddingTop: 16, paddingBottom: 16 }}>
            本問卷將於 2026/03/31 截止收件。
          </p>
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: { xs: '8px', sm: '12px' },
          border: '1px solid #e0e0e0',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            {/* 手機號碼區塊 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                手機號碼<span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
              </Typography>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="手機 1"
                  required
                  type="tel"
                  value={mobilePhone1}
                  onChange={handleMobilePhone1Change}
                  onBlur={() => handleBlur('mobilePhone1')}
                  error={!!mobilePhone1Error && touchedFields.mobilePhone1}
                  helperText={
                    touchedFields.mobilePhone1 && mobilePhone1Error ? mobilePhone1Error : ''
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={textFieldSx}
                  inputProps={{
                    maxLength: 10,
                    inputMode: 'numeric',
                    pattern: '[0-9]{10}',
                    'aria-label': '手機號碼1',
                  }}
                />
                <TextField
                  label="手機 2（選填）"
                  type="tel"
                  value={mobilePhone2}
                  onChange={handleMobilePhone2Change}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={textFieldSx}
                  inputProps={{
                    maxLength: 10,
                    inputMode: 'numeric',
                    pattern: '[0-9]{10}',
                    'aria-label': '手機號碼2',
                  }}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 住家電話區塊 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                住家電話
              </Typography>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="電話 1"
                  type="tel"
                  value={homePhone1}
                  onChange={handleHomePhone1Change}
                  onBlur={() => handleBlur('homePhone1')}
                  error={!!homePhone1Error && touchedFields.homePhone1}
                  helperText={touchedFields.homePhone1 && homePhone1Error ? homePhone1Error : ''}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={textFieldSx}
                  inputProps={{
                    maxLength: 20,
                    inputMode: 'tel',
                    'aria-label': '住家電話1',
                  }}
                />
                <TextField
                  label="電話 2（選填）"
                  type="tel"
                  value={homePhone2}
                  onChange={handleHomePhone2Change}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={textFieldSx}
                  inputProps={{
                    maxLength: 20,
                    inputMode: 'tel',
                    'aria-label': '住家電話2',
                  }}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 地址區塊 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                聯絡地址<span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
              </Typography>

              {/* 縣市和鄉鎮市區 - 並排下拉選單 */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <FormControl
                  fullWidth
                  size="small"
                  required
                  error={!!cityError && touchedFields.city}
                  sx={textFieldSx}
                >
                  <InputLabel>縣市</InputLabel>
                  <Select
                    label="縣市"
                    value={city}
                    onChange={handleCityChange}
                    onBlur={() => handleBlur('city')}
                    sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
                    inputProps={{ 'aria-label': '縣市' }}
                  >
                    {Object.keys(areaData).map(cityName => (
                      <MenuItem key={cityName} value={cityName}>
                        {cityName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touchedFields.city && cityError && <FormHelperText>{cityError}</FormHelperText>}
                </FormControl>

                <FormControl
                  fullWidth
                  size="small"
                  required
                  error={!!districtError && touchedFields.district}
                  sx={textFieldSx}
                >
                  <InputLabel>鄉鎮市區</InputLabel>
                  <Select
                    label="鄉鎮市區"
                    value={city && areaData[city] ? district : ''}
                    onChange={handleDistrictChange}
                    onBlur={() => handleBlur('district')}
                    disabled={!city || !areaData[city]}
                    sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
                    inputProps={{ 'aria-label': '鄉鎮市區' }}
                  >
                    {(areaData[city] || []).map(districtName => (
                      <MenuItem key={districtName} value={districtName}>
                        {districtName}
                      </MenuItem>
                    ))}
                  </Select>
                  {touchedFields.district && districtError && (
                    <FormHelperText>{districtError}</FormHelperText>
                  )}
                </FormControl>
              </Stack>

              {/* 詳細地址 */}
              <TextField
                label="詳細地址"
                required
                value={address}
                onChange={handleAddressChange}
                onBlur={() => handleBlur('address')}
                error={!!addressError && touchedFields.address}
                helperText={touchedFields.address && addressError ? addressError : ''}
                fullWidth
                variant="outlined"
                size="small"
                sx={textFieldSx}
                inputProps={{
                  'aria-label': '詳細地址',
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Email 區塊 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                電子信箱
              </Typography>

              <TextField
                label="Email（選填）"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                error={!!emailError && touchedFields.email}
                helperText={touchedFields.email && emailError ? emailError : ''}
                fullWidth
                variant="outlined"
                size="small"
                sx={textFieldSx}
                inputProps={{
                  maxLength: 255,
                  inputMode: 'email',
                  'aria-label': '電子信箱',
                }}
              />
            </Box>

            {/* 提交按鈕 */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              確認送出
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 謝詞及資料申明 */}
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pb: 4,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          感謝您的配合與協助。本系統所收集之資料僅供公司內部使用，我們將妥善保管您的個人資料，並遵循相關隱私保護法規。
        </Typography>

        {/* Logo 及公司名稱 */}
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
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            中華工程股份有限公司
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
