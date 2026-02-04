/**
 * 感謝頁面
 * 路徑：/shareholder/update/[qrCode]/thank-you
 *
 * 資料修改成功後顯示的感謝頁面
 */

'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, AppBar, Toolbar } from '@mui/material'
import Image from 'next/image'
import Lottie from 'lottie-react'

export default function ThankYouPage() {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/animations/Thank you.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('載入動畫失敗:', err))
  }, [])
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
            gap: 2,
            minHeight: '64px',
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
              fontSize: '20px',
              fontWeight: 500,
            }}
          >
            中華工程股份有限公司股東資料回報
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 頁面內容 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: 600,
            width: '100%',
            padding: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* 成功動畫 */}
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: 200, height: 200 }}
            />
          ) : (
            <Box
              sx={{
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          )}

          {/* 標題 */}
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'primary.main',
              textAlign: 'center',
            }}
          >
            感謝您的配合
          </Typography>

          {/* 主要訊息 */}
          <Typography
            variant="body1"
            sx={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'text.primary',
              textAlign: 'center',
            }}
          >
            您的資料已成功更新，感謝您的配合與協助。
          </Typography>

          {/* 說明文字 */}
          <Box
            sx={{
              marginTop: 2,
              paddingTop: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              width: '100%',
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
              本系統所收集之資料僅供公司內部使用，我們將妥善保管您的個人資料，並遵循相關隱私保護法規。
            </Typography>
          </Box>

          {/* Logo 及公司名稱 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              marginTop: 2,
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
    </Box>
  )
}

