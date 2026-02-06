/**
 * PDF 模板預覽頁面
 * 路徑：/shareholder/pdf-preview
 * 
 * 用於快速預覽和測試 PDF 模板的排版效果
 * 可以即時修改模板並查看效果
 */

'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material'
import { Download, Refresh } from '@mui/icons-material'
import { generateShareholderPDF, getTemplate } from '@/lib/pdf/shareholder-letter'

export default function PDFPreviewPage() {
  const [previewHtml, setPreviewHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sampleQRCode, setSampleQRCode] = useState('')

  // 範例股東資料
  const sampleShareholder = {
    name: '許雅雯',
    shareholderCode: '012345',
    idNumber: 'J012345678',
  }

  // 載入並替換模板變數
  useEffect(() => {
    const init = async () => {
      const qrCode = await generateTestQRCode()
      await loadPreview(qrCode)
    }
    init()
  }, [])

  const generateTestQRCode = async () => {
    try {
      // 使用 API 生成 QR Code（使用測試用的 UUID）
      const testUuid = 'C895AA67-A2BB-4C44-8113-88A8738C434A'
      const response = await fetch(`/api/shareholder/qrcode/${testUuid}`)
      const data = await response.json()
      
      if (data.success && data.data?.qrCodeDataUrl) {
        const qrCode = data.data.qrCodeDataUrl
        setSampleQRCode(qrCode)
        return qrCode
      } else {
        throw new Error('API 返回失敗')
      }
    } catch (error) {
      console.error('生成測試 QR Code 失敗:', error)
      // 使用一個簡單的佔位圖
      const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      setSampleQRCode(placeholder)
      return placeholder
    }
  }

  const loadPreview = async (qrCodeToUse = null) => {
    try {
      setLoading(true)
      // 使用內嵌模板（從 shareholder-letter.js）
      let html = getTemplate()

      // 使用傳入的 QR Code 或當前狀態的 QR Code
      const qrCode = qrCodeToUse || sampleQRCode || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      // 替換變數
      html = html
        .replace(/{{name}}/g, sampleShareholder.name)
        .replace(/{{shareholderCode}}/g, sampleShareholder.shareholderCode)
        .replace(/{{idNumber}}/g, sampleShareholder.idNumber)
        .replace(/{{qrCodeImage}}/g, qrCode)

      setPreviewHtml(html)
    } catch (error) {
      console.error('載入預覽失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 重新載入預覽
  const handleRefresh = async () => {
    const qrCode = await generateTestQRCode()
    await loadPreview(qrCode)
  }

  // 測試生成 PDF
  const handleTestPDF = async () => {
    try {
      setGeneratingPDF(true)
      
      // 確保有 QR Code
      let qrCode = sampleQRCode
      if (!qrCode || qrCode.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) {
        qrCode = await generateTestQRCode()
      }
      
      const pdfBlob = await generateShareholderPDF(sampleShareholder, qrCode)
      
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `預覽測試_${sampleShareholder.name}_信件.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('生成 PDF 失敗:', error)
      alert('生成 PDF 失敗：' + error.message)
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: { xs: 1, sm: 3 },
      }}
    >
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={2}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            PDF 模板預覽
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              重新載入
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleTestPDF}
              disabled={generatingPDF || loading}
            >
              {generatingPDF ? '生成中...' : '測試生成 PDF'}
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
          此頁面用於預覽 PDF 模板的排版效果。修改模板檔案後，點擊「重新載入」按鈕即可看到最新效果。
        </Typography>

        <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 500 }}>
          範例資料：
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
          姓名：{sampleShareholder.name} | 股東代號：{sampleShareholder.shareholderCode} | 身分證字號：{sampleShareholder.idNumber}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
          模板檔案位置：<code>src/lib/pdf/shareholder-letter-template.html</code>
        </Typography>
      </Paper>

      {/* 預覽區域 */}
      <Paper
        sx={{
          padding: 2,
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        ) : previewHtml ? (
          <Box
            sx={{
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: '#fff',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              transform: 'scale(0.8)', // 縮小以適應螢幕
              transformOrigin: 'top center',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </Box>
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <Typography>載入中...</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
