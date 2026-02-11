/**
 * QR Code 管理頁面
 * 路徑：/shareholder/qrcode-batch
 *
 * 管理員可以查看所有股東的 QR Code，並匯出所有資料
 * 使用 MUI X Data Grid 展現股東列表，支援篩選功能
 * 頁面載入時自動為當前分頁的股東產生並顯示 QR Code
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Link,
  AppBar,
  Toolbar,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Search, Download } from '@mui/icons-material'
import Image from 'next/image'
import ExcelJS from 'exceljs'
import { generateAllShareholdersPDF, generateShareholderPDF } from '@/lib/pdf/shareholder-letter'
import { getBaseUrlFromClient, buildShareholderUpdateUrl } from '@/lib/url'

export default function QRCodeBatchPage() {
  // 股東列表相關狀態
  const [shareholders, setShareholders] = useState([])
  const [filteredShareholders, setFilteredShareholders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // QR Code 相關狀態（儲存每個股東的 QR Code 資料）
  const [shareholderQRCodes, setShareholderQRCodes] = useState({})
  const [generatingQRCodes, setGeneratingQRCodes] = useState(false)
  // baseUrl 狀態（從 API 取得，確保與 QR Code URL 一致）
  const [baseUrl, setBaseUrl] = useState(null)

  // 表格分頁和篩選
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  })
  const [searchText, setSearchText] = useState('')

  // 載入股東列表
  useEffect(() => {
    loadShareholders()
  }, [])

  // 篩選股東列表
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredShareholders(shareholders)
    } else {
      const filtered = shareholders.filter(s => {
        const searchLower = searchText.toLowerCase()
        return (
          s.shareholderCode?.toLowerCase().includes(searchLower) ||
          s.idNumber?.toLowerCase().includes(searchLower) ||
          s.name?.toLowerCase().includes(searchLower) ||
          s.city1?.toLowerCase().includes(searchLower) ||
          s.updatedCity?.toLowerCase().includes(searchLower) ||
          s.district1?.toLowerCase().includes(searchLower) ||
          s.updatedDistrict?.toLowerCase().includes(searchLower) ||
          s.originalAddress?.toLowerCase().includes(searchLower) ||
          s.updatedAddress?.toLowerCase().includes(searchLower) ||
          s.originalHomePhone?.toLowerCase().includes(searchLower) ||
          s.updatedHomePhone?.toLowerCase().includes(searchLower) ||
          s.originalMobilePhone?.toLowerCase().includes(searchLower) ||
          s.updatedMobilePhone?.toLowerCase().includes(searchLower)
        )
      })
      setFilteredShareholders(filtered)
    }
    setPaginationModel(prev => ({ ...prev, page: 0 })) // 重置到第一頁
  }, [searchText, shareholders])

  // 計算當前分頁的股東
  const paginatedShareholders = useMemo(() => {
    return filteredShareholders.slice(
      paginationModel.page * paginationModel.pageSize,
      paginationModel.page * paginationModel.pageSize + paginationModel.pageSize
    )
  }, [filteredShareholders, paginationModel])

  // 為當前分頁的股東產生 QR Code
  useEffect(() => {
    if (paginatedShareholders.length > 0) {
      generateQRCodesForCurrentPage()
    }
  }, [paginationModel.page, paginationModel.pageSize, paginatedShareholders])

  const loadShareholders = async () => {
    setLoading(true)
    setError(null)

    try {
      // 查詢所有股東資料
      const response = await fetch('/api/shareholder/list')

      const data = await response.json()

      if (!response.ok) {
        // 如果 API 返回錯誤，顯示錯誤訊息
        const errorMsg = data.error?.message || `HTTP error! status: ${response.status}`
        console.error('載入股東列表錯誤:', {
          status: response.status,
          error: data.error,
          message: errorMsg,
        })
        setError(errorMsg)
        setShareholders([])
        return
      }

      if (data.success) {
        const shareholdersData = data.data || []
        console.log('載入的股東資料數量:', shareholdersData.length)
        if (shareholdersData.length > 0) {
          const firstShareholder = shareholdersData[0]
          console.log('第一筆股東資料詳情:', JSON.stringify({
            shareholderCode: firstShareholder.shareholderCode,
            name: firstShareholder.name,
            originalAddress: firstShareholder.originalAddress,
            updatedAddress: firstShareholder.updatedAddress,
            originalHomePhone: firstShareholder.originalHomePhone,
            updatedHomePhone: firstShareholder.updatedHomePhone,
            originalMobilePhone: firstShareholder.originalMobilePhone,
            updatedMobilePhone: firstShareholder.updatedMobilePhone,
            loginCount: firstShareholder.loginCount,
            updateCount: firstShareholder.updateCount,
          }, null, 2))
        }
        setShareholders(shareholdersData)
        // 如果資料為空，顯示提示訊息
        if (shareholdersData.length === 0) {
          setError('資料庫中沒有股東資料')
        }
      } else {
        setError(data.error?.message || '載入股東列表失敗')
        setShareholders([])
      }
    } catch (err) {
      console.error('載入股東列表錯誤:', err)
      setError(`無法載入股東列表: ${err.message || '請檢查網路連線或稍後再試'}`)
      setShareholders([])
    } finally {
      setLoading(false)
    }
  }

  // 為當前分頁的股東產生 QR Code
  const generateQRCodesForCurrentPage = async () => {
    const currentPageCodes = paginatedShareholders
      .map(s => s.shareholderCode)
      .filter(code => code && code.length === 6)

    if (currentPageCodes.length === 0) return

    // 檢查是否已經有 QR Code
    const needGenerate = currentPageCodes.filter(code => !shareholderQRCodes[code])
    if (needGenerate.length === 0) return

    setGeneratingQRCodes(true)
    setError(null)

    try {
      const response = await fetch('/api/shareholder/qrcode/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareholderCodes: needGenerate,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const qrCodeMap = {}
        data.data.qrCodes.forEach(qr => {
          if (!qr.error && qr.shareholderCode) {
            qrCodeMap[qr.shareholderCode] = qr
          }
        })
        setShareholderQRCodes(prev => ({ ...prev, ...qrCodeMap }))
        
        // 儲存 baseUrl（如果 API 有回傳）
        if (data.data.baseUrl) {
          setBaseUrl(data.data.baseUrl)
        }
      } else {
        console.error('產生 QR Code 失敗:', data.error?.message)
      }
    } catch (err) {
      console.error('產生 QR Code 錯誤:', err)
    } finally {
      setGeneratingQRCodes(false)
    }
  }

  // 下載單一股東的 PDF 信件（使用 useCallback 確保函數穩定性）
  const handleDownload = useCallback(async (shareholder, qrCodeDataUrl) => {
    if (!qrCodeDataUrl) {
      setError('QR Code 尚未產生，請稍候再試')
      return
    }
    
    try {
      setError(null)
      // 生成該股東的 PDF
      const pdfBlob = await generateShareholderPDF(shareholder, qrCodeDataUrl)
      
      // 下載 PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${shareholder.name || '股東'}_${shareholder.idNumber || ''}_信件.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下載 PDF 失敗:', error)
      setError('下載 PDF 失敗，請稍後再試')
    }
  }, [])

  // 匯出所有資料
  const handleExportExcel = async () => {
    try {
      setError(null)

      // 取得所有股東資料（不受分頁限制）
      const allShareholders = filteredShareholders.length > 0 ? filteredShareholders : shareholders

      if (allShareholders.length === 0) {
        setError('沒有可匯出的資料')
        return
      }

      // 為所有股東產生 QR Code
      const allCodes = allShareholders
        .map(s => s.shareholderCode)
        .filter(code => code && code.length === 6)

      if (allCodes.length === 0) {
        setError('沒有有效的股東代號')
        return
      }

      setGeneratingQRCodes(true)

      // 呼叫批次產生 API，取得所有 QR Code
      const response = await fetch('/api/shareholder/qrcode/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareholderCodes: allCodes,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError('產生 QR Code 失敗，無法匯出所有資料')
        setGeneratingQRCodes(false)
        return
      }

      // 建立 QR Code 對應表
      const qrCodeMap = {}
      data.data.qrCodes.forEach(qr => {
        if (!qr.error && qr.shareholderCode) {
          qrCodeMap[qr.shareholderCode] = qr
        }
      })
      
      // 儲存 baseUrl（如果 API 有回傳）
      if (data.data.baseUrl) {
        setBaseUrl(data.data.baseUrl)
      }

      // 建立 Excel 工作簿
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('股東資料')

      // 設定欄位標題
      worksheet.columns = [
        { header: '股東代號', key: 'shareholderCode', width: 12 },
        { header: '身分證字號', key: 'idNumber', width: 12 },
        { header: '姓名', key: 'name', width: 15 },
        { header: '原始地址', key: 'originalAddress', width: 30 },
        { header: '更新地址', key: 'updatedAddress', width: 30 },
        { header: '原始家用電話', key: 'originalHomePhone', width: 15 },
        { header: '更新家用電話', key: 'updatedHomePhone', width: 15 },
        { header: '原始手機號碼', key: 'originalMobilePhone', width: 15 },
        { header: '更新手機號碼', key: 'updatedMobilePhone', width: 15 },
        { header: '登入次數', key: 'loginCount', width: 12 },
        { header: '修改次數', key: 'updateCount', width: 12 },
        { header: 'UUID', key: 'uuid', width: 40 },
        { header: '完整 URL', key: 'fullUrl', width: 50 },
        { header: 'QR Code', key: 'qrCode', width: 20 },
      ]

      // 設定標題行樣式
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }

      // 轉換 base64 為 Uint8Array 的輔助函數（瀏覽器相容）
      const base64ToUint8Array = base64String => {
        const base64Data = base64String.replace(/^data:image\/png;base64,/, '')
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes
      }

      // 新增資料列並嵌入圖片
      for (let i = 0; i < allShareholders.length; i++) {
        const shareholder = allShareholders[i]
        const qrCode = qrCodeMap[shareholder.shareholderCode]
        const uuid = shareholder.uuid || ''
        // 使用共用函數建立 URL，優先使用 API 回傳的 baseUrl
        const urlBaseUrl = getBaseUrlFromClient(baseUrl)
        const fullUrl = uuid ? buildShareholderUpdateUrl(uuid, urlBaseUrl) : ''

        const row = worksheet.addRow({
          shareholderCode: shareholder.shareholderCode || '',
          idNumber: shareholder.idNumber || '',
          name: shareholder.name || '',
          originalAddress: shareholder.originalAddress || '',
          updatedAddress: shareholder.updatedAddress || '',
          originalHomePhone: shareholder.originalHomePhone || '',
          updatedHomePhone: shareholder.updatedHomePhone || '',
          originalMobilePhone: shareholder.originalMobilePhone || '',
          updatedMobilePhone: shareholder.updatedMobilePhone || '',
          loginCount: shareholder.loginCount || 0,
          updateCount: shareholder.updateCount || 0,
          uuid: uuid,
          fullUrl: fullUrl,
          qrCode: '', // 圖片會單獨加入
        })

        // 如果 QR Code 存在，嵌入圖片
        if (qrCode?.qrCodeDataUrl) {
          try {
            const imageBuffer = base64ToUint8Array(qrCode.qrCodeDataUrl)
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'png',
            })

            // 將圖片加入儲存格（QR Code 欄位是第 14 欄，索引為 13）
            // exceljs 的 addImage 使用 0-based 索引，row.number 是 1-based
            worksheet.addImage(imageId, {
              tl: { col: 13, row: row.number - 1 },
              ext: { width: 80, height: 80 }, // 設定圖片大小
            })

            // 調整行高以容納圖片
            row.height = 80
          } catch (imgError) {
            console.error('嵌入圖片失敗:', imgError)
          }
        }
      }

      // 產生 Excel 檔案並下載
      const fileName = `股東QRCode資料_${new Date().toISOString().split('T')[0]}.xlsx`
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setGeneratingQRCodes(false)
    } catch (err) {
      console.error('匯出所有資料錯誤:', err)
      setError('匯出所有資料失敗，請稍後再試')
      setGeneratingQRCodes(false)
    }
  }

  // 匯出所有股東的 PDF 信件
  const handleExportPDF = async () => {
    try {
      setError(null)

      // 取得所有股東資料（不受分頁限制）
      const allShareholders = shareholders

      if (allShareholders.length === 0) {
        setError('沒有可匯出的資料')
        return
      }

      // 為所有股東產生 QR Code
      const allCodes = allShareholders
        .map(s => s.shareholderCode)
        .filter(code => code && code.length === 6)

      if (allCodes.length === 0) {
        setError('沒有有效的股東代號')
        return
      }

      setGeneratingQRCodes(true)

      // 呼叫批次產生 API，取得所有 QR Code（使用印刷模式取得高解析度 QR Code）
      const response = await fetch('/api/shareholder/qrcode/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareholderCodes: allCodes,
          printMode: true, // 使用印刷模式產生高解析度 QR Code
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError('產生 QR Code 失敗，無法匯出 PDF')
        setGeneratingQRCodes(false)
        return
      }

      // 建立 QR Code 對應表
      const qrCodeMap = {}
      data.data.qrCodes.forEach(qr => {
        if (!qr.error && qr.shareholderCode) {
          qrCodeMap[qr.shareholderCode] = qr.qrCodeDataUrl
        }
      })

      // 生成所有股東的 PDF
      const pdfBlob = await generateAllShareholdersPDF(allShareholders, qrCodeMap)

      // 下載 PDF
      const fileName = `股東PDF信件_${new Date().toISOString().split('T')[0]}.pdf`
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setGeneratingQRCodes(false)
    } catch (err) {
      console.error('匯出 PDF 錯誤:', err)
      setError('匯出 PDF 失敗，請稍後再試')
      setGeneratingQRCodes(false)
    }
  }

  // 定義 Data Grid 欄位（使用 useMemo 避免每次渲染都重新創建）
  const columns = useMemo(
    () => [
      {
        field: 'shareholderCode',
        headerName: '股東代號',
        width: 100,
        flex: 0,
        renderCell: params => {
          if (!params || !params.row) {
            return <Typography variant="body2">-</Typography>
          }
          const uuid = params.row.uuid || null
          // 使用共用函數建立 URL，優先使用 API 回傳的 baseUrl
          const urlBaseUrl = getBaseUrlFromClient(baseUrl)
          const fullUrl = uuid ? buildShareholderUpdateUrl(uuid, urlBaseUrl) : null
          return fullUrl ? (
            <Link href={fullUrl} target="_blank" rel="noopener noreferrer">
              {params.value || '-'}
            </Link>
          ) : (
            <Typography variant="body2">{params.value || '-'}</Typography>
          )
        },
      },
      {
        field: 'name',
        headerName: '姓名',
        width: 90,
        flex: 0,
      },
      {
        field: 'idNumberLast4',
        headerName: '身分證末四碼',
        width: 110,
        flex: 0,
      },
      {
        field: 'city1',
        headerName: '縣市',
        width: 80,
        flex: 0,
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          const updatedCity = params.row.updatedCity
          const originalCity = params.row.city1
          let displayValue = '-'
          if (updatedCity != null && String(updatedCity).trim() !== '') {
            displayValue = String(updatedCity)
          } else if (originalCity != null && String(originalCity).trim() !== '') {
            displayValue = String(originalCity)
          }
          return <Typography variant="body2">{displayValue}</Typography>
        },
      },
      {
        field: 'district1',
        headerName: '鄉鎮區',
        width: 80,
        flex: 0,
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          const updatedDistrict = params.row.updatedDistrict
          const originalDistrict = params.row.district1
          let displayValue = '-'
          if (updatedDistrict != null && String(updatedDistrict).trim() !== '') {
            displayValue = String(updatedDistrict)
          } else if (originalDistrict != null && String(originalDistrict).trim() !== '') {
            displayValue = String(originalDistrict)
          }
          return <Typography variant="body2">{displayValue}</Typography>
        },
      },
      {
        field: 'address',
        headerName: '地址',
        flex: 1,
        minWidth: 120,
        maxWidth: 250,
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          // 有 updatedAddress（不為 null 且不為空字串）就用 updatedAddress，沒有就用 originalAddress
          const updatedAddr = params.row.updatedAddress
          const originalAddr = params.row.originalAddress
          let displayValue = '-'
          
          if (updatedAddr != null && String(updatedAddr).trim() !== '') {
            displayValue = String(updatedAddr)
          } else if (originalAddr != null && String(originalAddr).trim() !== '') {
            displayValue = String(originalAddr)
          }
          
          return <Typography variant="body2">{displayValue}</Typography>
        },
      },
      {
        field: 'homePhone',
        headerName: '家用電話',
        width: 110,
        flex: 0,
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          // 有 updatedHomePhone（不為 null 且不為空字串）就用 updatedHomePhone，沒有就用 originalHomePhone
          const updatedPhone = params.row.updatedHomePhone
          const originalPhone = params.row.originalHomePhone
          let displayValue = '-'
          
          if (updatedPhone != null && String(updatedPhone).trim() !== '') {
            displayValue = String(updatedPhone)
          } else if (originalPhone != null && String(originalPhone).trim() !== '') {
            displayValue = String(originalPhone)
          }
          
          return <Typography variant="body2">{displayValue}</Typography>
        },
      },
      {
        field: 'mobilePhone',
        headerName: '手機號碼',
        width: 110,
        flex: 0,
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          // 有 updatedMobilePhone（不為 null 且不為空字串）就用 updatedMobilePhone，沒有就用 originalMobilePhone
          const updatedMobile = params.row.updatedMobilePhone
          const originalMobile = params.row.originalMobilePhone
          let displayValue = '-'
          
          if (updatedMobile != null && String(updatedMobile).trim() !== '') {
            displayValue = String(updatedMobile)
          } else if (originalMobile != null && String(originalMobile).trim() !== '') {
            displayValue = String(originalMobile)
          }
          
          return <Typography variant="body2">{displayValue}</Typography>
        },
      },
      {
        field: 'loginCount',
        headerName: '登入次數',
        width: 85,
        flex: 0,
        type: 'number',
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          const count = params.row.loginCount != null ? Number(params.row.loginCount) : 0
          return <Typography variant="body2">{count}</Typography>
        },
      },
      {
        field: 'updateCount',
        headerName: '修改次數',
        width: 85,
        flex: 0,
        type: 'number',
        renderCell: params => {
          if (!params || !params.row) return <Typography variant="body2">-</Typography>
          const count = params.row.updateCount != null ? Number(params.row.updateCount) : 0
          return <Typography variant="body2">{count}</Typography>
        },
      },
      // QR Code 欄位已隱藏
      // {
      //   field: 'qrCode',
      //   headerName: 'QR Code',
      //   ...
      // },
    ],
    [baseUrl]
  )

  // 準備 Data Grid 的資料（需要 id 欄位）
  const rows = useMemo(
    () => {
      const mappedRows = filteredShareholders.map((shareholder, index) => ({
        id: shareholder.shareholderCode || `row-${index}`,
        ...shareholder,
      }))
      
      // 調試：記錄第一筆 rows 資料
      if (mappedRows.length > 0) {
        console.log('第一筆 rows 資料:', JSON.stringify(mappedRows[0], null, 2))
      }
      
      return mappedRows
    },
    [filteredShareholders]
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* 導覽列 */}
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
            股東資料QR Code列印
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 頁面內容 */}
      <Box sx={{ padding: { xs: 1, sm: 3, md: 4 } }}>
        {' '}
        {/* 文檔規範：頁面邊距 lg 或 xl (24-32px) */}
        <Paper sx={{ padding: 3, marginBottom: 3 }}>
          {/* 標題與搜尋欄位 */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            marginBottom={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 2, sm: 2 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'primary.main',
                whiteSpace: 'nowrap',
              }}
            >
              股東列表
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="搜尋股東代號、姓名、地址、電話..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{
                width: { xs: '100%', sm: '320px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" padding={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: 'auto', minHeight: 400 }}>
              <DataGrid
                rows={rows || []}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                loading={loading}
                autoHeight
                disableColumnMenu
                disableColumnFilter
                // 固定每列高度，避免因為 QR Code 欄位顯示/隱藏導致可見筆數改變
                rowHeight={52}
                        sx={{
                  width: '100%',
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-main': {
                    overflowX: 'hidden', // 隱藏橫向滾動條
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'hidden', // 隱藏虛擬滾動器的橫向滾動條
                    overflowY: 'auto', // 允許垂直滾動
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    minHeight: '100%', // 確保內容高度足夠
                  },
                  '& .MuiDataGrid-cell': {
                    fontSize: '14px', // 文檔規範：body2 (14px)
                    padding: '8px 10px', // 減少 padding 以適應更多欄位
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    display: 'flex',
                    alignItems: 'center', // 垂直居中
                    justifyContent: 'flex-start', // 水平靠左對齊
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'action.hover', // 文檔規範：Muted 背景
                          fontSize: '14px', // 文檔規範：body2 (14px)
                          fontWeight: 500, // 文檔規範：Medium 字重
                          height: '56px', // 文檔規範：表頭高度 56px
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '0 10px', // 減少欄位標題的 padding
                  },
                  '& .MuiDataGrid-row': {
                    height: 'auto', // 由 rowHeight 控制實際高度，這裡讓內容自動填滿
                    minHeight: '52px', // 一般列的最小高度
                            '&:hover': {
                              backgroundColor: 'action.hover', // 文檔規範：懸停時背景變為 Muted
                            },
                  },
                  '& .MuiDataGrid-cell[data-field="qrCode"]': {
                    padding: '8px 30px 8px 4px !important', // QR Code 欄位的 padding（右側增加空間避免與滾動條重疊）
                    display: 'flex !important',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    overflow: 'visible !important', // 確保內容不會被裁剪
                  },
                  // 確保滾動條不會覆蓋內容
                  '& .MuiDataGrid-scrollbar': {
                    zIndex: 1, // 確保滾動條在正確的層級
                  },
                  '& .MuiDataGrid-scrollbar--vertical': {
                    right: 0,
                    width: '17px', // 標準滾動條寬度
                  },
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                  '& .MuiDataGrid-cell:focus-within': {
                    outline: 'none',
                  },
                }}
                localeText={{
                  noRowsLabel: '找不到符合條件的股東',
                  noResultsOverlayLabel: '找不到符合條件的股東',
                  footerRowSelected: count => `已選擇 ${count} 筆`,
                  footerPaginationRowsPerPage: '每頁顯示：',
                  footerPaginationDisplayedRows: ({ from, to, count }) =>
                    `${from}-${to} / 共 ${count} 筆`,
                }}
              />
            </Box>
          )}
        </Paper>
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  )
}
