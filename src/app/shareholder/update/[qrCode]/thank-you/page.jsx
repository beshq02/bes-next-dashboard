/**
 * 感謝頁面
 * 路徑：/shareholder/update/[qrCode]/thank-you
 *
 * 資料修改成功後顯示的感謝頁面
 */

'use client'

import Image from 'next/image'
import { Box, Button, Card, CardContent, Divider, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

const ESG_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdfLw7UCncd1lh1USTnjpQ1OCc06HScZns0xkXGCN_1PViKHg/viewform'

export default function ThankYouPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: { xs: '100%', sm: 600 }, margin: '0 auto' }}>
        {/* 成功提示卡片 */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          {/* 成功標示區塊 */}
          <Box
            sx={{
              backgroundColor: '#e8f5e9',
              borderBottom: '1px solid #c8e6c9',
              py: { xs: 3, sm: 4 },
              px: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <CheckCircleOutlineIcon
              sx={{
                fontSize: { xs: 48, sm: 56 },
                color: '#2e7d32',
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '20px', sm: '24px' },
                color: '#1b5e20',
                textAlign: 'center',
              }}
            >
              資料更新成功
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '14px', sm: '15px' },
                color: '#388e3c',
                textAlign: 'center',
              }}
            >
              感謝您撥冗填寫股東資料
            </Typography>
          </Box>
        </Card>

        {/* ESG 問卷邀請卡片 */}
        <Card
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* 標題 */}
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
              問卷邀請
            </Typography>

            {/* 說明文字 */}
            <Typography
              sx={{
                fontSize: { xs: '15px', sm: '16px' },
                lineHeight: 1.8,
                color: 'text.primary',
                mb: 3,
              }}
            >
              誠摯邀請您填寫 ESG 利害關係人問卷，完成後我們將寄送
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  color: '#1976d2',
                }}
              >
                {' '}7-ELEVEN 100 元禮券{' '}
              </Box>
              以表感謝。
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* 問卷按鈕 */}
            <Button
              component="a"
              href={ESG_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              fullWidth
              endIcon={<OpenInNewIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              sx={{
                py: { xs: 1.5, sm: 1.75 },
                fontSize: { xs: '15px', sm: '16px' },
                fontWeight: 600,
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
              }}
            >
              填寫 ESG 問卷
            </Button>

            <Typography
              sx={{
                mt: 2,
                fontSize: { xs: '12px', sm: '13px' },
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              中華工程股份有限公司 114 年度 ESG 利害關係人問卷
            </Typography>
          </CardContent>
        </Card>

        {/* 底部說明 */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            py: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '12px', sm: '13px' },
              lineHeight: 1.7,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            本系統所收集之資料僅供公司內部使用，
            我們將妥善保管您的個人資料，並遵循相關隱私保護法規。
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
              sx={{
                fontSize: { xs: '13px', sm: '14px' },
                fontWeight: 500,
                color: 'text.secondary',
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
