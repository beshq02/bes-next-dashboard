/**
 * 股東信件 PDF 生成工具
 * 使用 jspdf 和 html2canvas 生成 PDF 信件
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// A4 尺寸（毫米）
const A4_WIDTH = 210
const A4_HEIGHT = 297

/**
 * 載入 HTML 模板（從 public 目錄讀取）
 * @returns {Promise<string>} HTML 模板字串
 */
async function loadTemplate() {
  try {
    const response = await fetch('/lib/pdf/shareholder-letter-template.html')
    if (!response.ok) {
      throw new Error('無法載入 PDF 模板')
    }
    return await response.text()
  } catch (error) {
    console.error('載入模板失敗:', error)
    throw new Error(`載入模板失敗: ${error.message}`)
  }
}


/**
 * 替換模板變數
 * @param {string} template - HTML 模板
 * @param {Object} data - 替換資料
 * @returns {string} 替換後的 HTML
 */
function replaceTemplateVariables(template, data) {
  let html = template
  Object.keys(data).forEach(key => {
    const value = data[key] || ''
    const regex = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(regex, value)
  })
  return html
}

/**
 * 計算像素尺寸（mm 轉 px，假設 96 DPI）
 * @param {number} mm - 毫米
 * @returns {number} 像素
 */
function mmToPx(mm) {
  return (mm * 96) / 25.4
}

/**
 * 使用 iframe 在背景生成 Canvas（完全隔離，不影響主頁面）
 * @param {string} html - HTML 內容
 * @param {number} widthPx - 寬度（像素）
 * @param {number} heightPx - 高度（像素）
 * @returns {Promise<HTMLCanvasElement>} Canvas 元素
 */
async function generateCanvasFromIframe(html, widthPx, heightPx) {
  return new Promise((resolve, reject) => {
    // 建立 iframe（完全隱藏，在背景執行）
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-9999px'  // 移到畫面外
    iframe.style.left = '-9999px'
    iframe.style.width = `${widthPx}px`
    iframe.style.height = `${heightPx}px`
    iframe.style.border = 'none'
    iframe.style.zIndex = '-9999'
    iframe.style.opacity = '0'
    iframe.style.visibility = 'hidden'
    iframe.style.pointerEvents = 'none'
    
    document.body.appendChild(iframe)
    
    // 等待 iframe 載入
    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        
        // 寫入 HTML 內容
        iframeDoc.open()
        iframeDoc.write(html)
        iframeDoc.close()
        
        // 等待圖片載入
        const images = iframeDoc.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(
            img =>
              new Promise((resolveImg, rejectImg) => {
                if (img.complete) {
                  resolveImg()
                } else {
                  img.onload = resolveImg
                  img.onerror = rejectImg
                }
              })
          )
        )
        
        // 等待一小段時間確保渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 使用 html2canvas 轉換為 Canvas（只捕捉 iframe 內的 body）
        const canvas = await html2canvas(iframeDoc.body, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: widthPx,
          height: heightPx,
          windowWidth: widthPx,
          windowHeight: heightPx,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          allowTaint: false,
          foreignObjectRendering: false,
        })
        
        // 清理 iframe
        document.body.removeChild(iframe)
        
        resolve(canvas)
      } catch (error) {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
        reject(error)
      }
    }
    
    iframe.onerror = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
      reject(new Error('iframe 載入失敗'))
    }
    
    // 觸發載入
    iframe.src = 'about:blank'
  })
}

/**
 * 生成單個股東的 PDF 信件
 * @param {Object} shareholder - 股東資料
 * @param {string} qrCodeDataUrl - QR Code 圖片 Data URL
 * @returns {Promise<Blob>} PDF Blob
 */
export async function generateShareholderPDF(shareholder, qrCodeDataUrl) {
  try {
    // 載入模板
    const template = await loadTemplate()
    
    // 準備替換資料
    const templateData = {
      name: shareholder.name || '',
      shareholderCode: shareholder.shareholderCode || '',
      idNumber: shareholder.idNumber || '',
      qrCodeImage: qrCodeDataUrl || '',
    }
    
    // 替換模板變數
    const html = replaceTemplateVariables(template, templateData)
    
    // 計算像素尺寸
    const widthPx = mmToPx(A4_WIDTH)
    const heightPx = mmToPx(A4_HEIGHT)
    
    // 使用 iframe 在背景生成 Canvas（完全隔離，不影響主頁面）
    const canvas = await generateCanvasFromIframe(html, widthPx, heightPx)
    
    // 建立 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH, A4_HEIGHT],
    })
    
    // 計算 Canvas 與 PDF 的比例，確保不縮放
    const pdfWidth = pdf.internal.pageSize.getWidth()
    
    // 計算圖片在 PDF 中的尺寸（保持原始比例，填滿整個頁面）
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * pdfWidth) / canvas.width
    
    // 將 Canvas 轉換為圖片並加入 PDF（從 0,0 開始，填滿整個頁面）
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    
    // 轉換為 Blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('生成 PDF 失敗:', error)
    throw new Error(`生成 PDF 失敗: ${error.message}`)
  }
}

/**
 * 生成所有股東的 PDF 文件（每個股東一頁）
 * @param {Array} shareholders - 股東資料陣列
 * @param {Object} qrCodeMap - QR Code 對應表 { shareholderCode: qrCodeDataUrl }
 * @returns {Promise<Blob>} PDF Blob
 */
export async function generateAllShareholdersPDF(shareholders, qrCodeMap) {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [A4_WIDTH, A4_HEIGHT],
    })
    
    // 載入模板
    const template = await loadTemplate()
    
    // 計算像素尺寸
    const widthPx = mmToPx(A4_WIDTH)
    const heightPx = mmToPx(A4_HEIGHT)
    
    // 為每個股東生成一頁
    for (let i = 0; i < shareholders.length; i++) {
      const shareholder = shareholders[i]
      const qrCodeDataUrl = qrCodeMap[shareholder.shareholderCode]
      
      if (!qrCodeDataUrl) {
        console.warn(`股東 ${shareholder.shareholderCode} 沒有 QR Code，跳過`)
        continue
      }
      
      // 如果不是第一頁，新增頁面
      if (i > 0) {
        pdf.addPage()
      }
      
      // 準備替換資料
      const templateData = {
        name: shareholder.name || '',
        shareholderCode: shareholder.shareholderCode || '',
        idNumber: shareholder.idNumber || '',
        qrCodeImage: qrCodeDataUrl || '',
      }
      
      // 替換模板變數
      const html = replaceTemplateVariables(template, templateData)
      
      // 使用 iframe 在背景生成 Canvas（完全隔離，不影響主頁面）
      const canvas = await generateCanvasFromIframe(html, widthPx, heightPx)
      
      // 計算 Canvas 與 PDF 的比例，確保不縮放
      const pdfWidth = pdf.internal.pageSize.getWidth()
      
      // 計算圖片在 PDF 中的尺寸（保持原始比例，填滿整個頁面）
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      
      // 將 Canvas 轉換為圖片並加入 PDF（從 0,0 開始，填滿整個頁面）
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    }
    
    // 轉換為 Blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('生成批次 PDF 失敗:', error)
    throw new Error(`生成批次 PDF 失敗: ${error.message}`)
  }
}
