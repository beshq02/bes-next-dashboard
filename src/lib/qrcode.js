/**
 * QR Code 工具函數
 * 用於產生股東專屬的 QR Code
 */

import QRCode from 'qrcode'

/**
 * 產生 QR Code Data URL
 * @param {string} shareholderIdentifier - 股東識別碼（7位數字：6位股東代號+1位隨機碼）
 * @param {object} options - QR Code 選項
 * @param {string} options.baseUrl - 基礎 URL（例如：http://localhost:6230）
 * @param {boolean} options.printMode - 是否為印刷模式（高解析度）
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
    
    // 預設選項
    const defaultOptions = isPrintMode
      ? {
          errorCorrectionLevel: 'H', // 最高錯誤修正等級，適合印刷
          type: 'image/png',
          width: 2000, // 高解析度，適合 A4 紙張印刷
          margin: 4, // 較大邊距，確保印刷邊緣不影響掃描
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }
      : {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2,
        }
    
    // 從 options 中分離出 baseUrl 和 printMode，避免傳給 QRCode.toDataURL
    const { baseUrl, printMode, ...qrOptions } = { ...defaultOptions, ...options }
    
    // 產生 QR Code Data URL
    const dataUrl = await QRCode.toDataURL(qrCodeUrl, qrOptions)
    
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
 * @returns {Promise<object>} 包含 QR Code Data URL 和相關資訊的物件
 */
export async function generateQRCode(shareholderIdentifier, baseUrl = null, printMode = false) {
  const relativePath = `/shareholder/update/${shareholderIdentifier}`
  const fullUrl = baseUrl ? `${baseUrl}${relativePath}` : relativePath
  
  const qrCodeDataUrl = await generateQRCodeDataUrl(shareholderIdentifier, { baseUrl, printMode })
  
  return {
    qrCodeDataUrl,
    shareholderId: shareholderIdentifier,
    qrCodeUrl: fullUrl, // 返回完整 URL
    relativeUrl: relativePath, // 也保留相對路徑供參考
    printMode, // 標記是否為印刷模式
  }
}

