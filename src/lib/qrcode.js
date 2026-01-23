/**
 * QR Code 工具函數
 * 用於產生股東專屬的 QR Code（含 Logo）
 */

import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import { loadImage, createCanvas } from 'canvas'

// Logo 路徑（相對於 public 目錄）
const LOGO_FILENAME = 'logo.png'
// Logo 佔 QR Code 尺寸的比例（15%）
const LOGO_RATIO = 0.15

/**
 * 取得 Logo 路徑
 * @returns {string} Logo 檔案的絕對路徑
 */
function getLogoPath() {
  // 在 Next.js 中，public 目錄的檔案可以通過 process.cwd() 找到
  return path.join(process.cwd(), 'public', LOGO_FILENAME)
}

/**
 * 將 Logo 合成到 QR Code 中央
 * @param {string} qrCodeDataUrl - QR Code 的 Data URL
 * @param {number} qrCodeWidth - QR Code 的寬度
 * @returns {Promise<string>} 合成後的 Data URL
 */
async function addLogoToQRCode(qrCodeDataUrl, qrCodeWidth) {
  try {
    const logoPath = getLogoPath()
    
    // 檢查 Logo 檔案是否存在
    if (!fs.existsSync(logoPath)) {
      console.warn('Logo 檔案不存在，返回原始 QR Code:', logoPath)
      return qrCodeDataUrl
    }
    
    // 載入 QR Code 圖片
    const qrCodeImage = await loadImage(qrCodeDataUrl)
    
    // 載入 Logo 圖片
    const logoImage = await loadImage(logoPath)
    
    // 建立 Canvas
    const canvas = createCanvas(qrCodeWidth, qrCodeWidth)
    const ctx = canvas.getContext('2d')
    
    // 繪製 QR Code
    ctx.drawImage(qrCodeImage, 0, 0, qrCodeWidth, qrCodeWidth)
    
    // 計算 Logo 尺寸和位置
    const logoSize = Math.floor(qrCodeWidth * LOGO_RATIO)
    const logoX = Math.floor((qrCodeWidth - logoSize) / 2)
    const logoY = Math.floor((qrCodeWidth - logoSize) / 2)
    
    // 繪製白色背景（圓角矩形）以確保 Logo 清晰可見
    const padding = Math.floor(logoSize * 0.1) // 10% padding
    const bgSize = logoSize + padding * 2
    const bgX = logoX - padding
    const bgY = logoY - padding
    const borderRadius = Math.floor(bgSize * 0.1) // 10% 圓角
    
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(bgX + borderRadius, bgY)
    ctx.lineTo(bgX + bgSize - borderRadius, bgY)
    ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + borderRadius)
    ctx.lineTo(bgX + bgSize, bgY + bgSize - borderRadius)
    ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - borderRadius, bgY + bgSize)
    ctx.lineTo(bgX + borderRadius, bgY + bgSize)
    ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - borderRadius)
    ctx.lineTo(bgX, bgY + borderRadius)
    ctx.quadraticCurveTo(bgX, bgY, bgX + borderRadius, bgY)
    ctx.closePath()
    ctx.fill()
    
    // 繪製 Logo（保持透明背景）
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
    
    // 轉換為 Data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('合成 Logo 失敗:', error)
    // 如果合成失敗，返回原始 QR Code
    return qrCodeDataUrl
  }
}

/**
 * 產生 QR Code Data URL（含 Logo）
 * @param {string} shareholderIdentifier - 股東識別碼（7位數字：6位股東代號+1位隨機碼）
 * @param {object} options - QR Code 選項
 * @param {string} options.baseUrl - 基礎 URL（例如：http://localhost:6230）
 * @param {boolean} options.printMode - 是否為印刷模式（高解析度）
 * @param {boolean} options.withLogo - 是否加入 Logo（預設 true）
 * @returns {Promise<string>} QR Code Data URL
 */
export async function generateQRCodeDataUrl(shareholderIdentifier, options = {}) {
  try {
    // 構建 QR Code 內容：包含股東識別碼的完整 URL
    const relativePath = `/shareholder/update/${shareholderIdentifier}`
    const qrCodeUrl = options.baseUrl 
      ? `${options.baseUrl}${relativePath}`
      : relativePath
    
    // 根據是否為印刷模式設定選項
    const isPrintMode = options.printMode === true
    // 是否加入 Logo（預設為 true）
    const withLogo = options.withLogo !== false
    
    // 預設選項 - 使用錯誤修正等級 'H' 以支援 Logo
    const defaultOptions = isPrintMode
      ? {
          errorCorrectionLevel: 'H', // 最高錯誤修正等級，必須使用 H 以支援 Logo
          type: 'image/png',
          width: 2000, // 高解析度，適合 A4 紙張印刷
          margin: 4, // 較大邊距，確保印刷邊緣不影響掃描
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }
      : {
          errorCorrectionLevel: 'H', // 使用 H 等級以支援 Logo
          type: 'image/png',
          width: 300,
          margin: 2,
        }
    
    // 從 options 中分離出自訂選項，避免傳給 QRCode.toDataURL
    const { baseUrl: _baseUrl, printMode: _printMode, withLogo: _withLogo, ...qrOptions } = { ...defaultOptions, ...options }
    
    // 取得最終寬度
    const qrCodeWidth = qrOptions.width || (isPrintMode ? 2000 : 300)
    
    // 產生 QR Code Data URL
    let dataUrl = await QRCode.toDataURL(qrCodeUrl, qrOptions)
    
    // 如果需要加入 Logo
    if (withLogo) {
      dataUrl = await addLogoToQRCode(dataUrl, qrCodeWidth)
    }
    
    return dataUrl
  } catch (error) {
    throw new Error(`QR Code 產生失敗: ${error.message}`)
  }
}

/**
 * 產生 QR Code 並返回完整資訊
 * @param {string} shareholderIdentifier - 股東識別碼（7位數字：6位股東代號+1位隨機碼）
 * @param {string} baseUrl - 基礎 URL（例如：http://localhost:6230）
 * @param {boolean} printMode - 是否為印刷模式（高解析度）
 * @param {boolean} withLogo - 是否加入 Logo（預設 true）
 * @returns {Promise<object>} 包含 QR Code Data URL 和相關資訊的物件
 */
export async function generateQRCode(shareholderIdentifier, baseUrl = null, printMode = false, withLogo = true) {
  const relativePath = `/shareholder/update/${shareholderIdentifier}`
  const fullUrl = baseUrl ? `${baseUrl}${relativePath}` : relativePath
  
  const qrCodeDataUrl = await generateQRCodeDataUrl(shareholderIdentifier, { baseUrl, printMode, withLogo })
  
  return {
    qrCodeDataUrl,
    shareholderId: shareholderIdentifier,
    qrCodeUrl: fullUrl, // 返回完整 URL
    relativeUrl: relativePath, // 也保留相對路徑供參考
    printMode, // 標記是否為印刷模式
    withLogo, // 標記是否有 Logo
  }
}
