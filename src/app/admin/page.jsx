import { tables } from '@/lib/tables'
import Link from 'next/link'
import { Box, Typography, Paper, Stack, Chip } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

// 預定義的顏色陣列，確保有足夠的對比度
const colorPalette = [
  { bg: '#E3F2FD', text: '#1565C0' }, // 藍色
  { bg: '#F3E5F5', text: '#7B1FA2' }, // 紫色
  { bg: '#E8F5E9', text: '#2E7D32' }, // 綠色
  { bg: '#FFF3E0', text: '#E65100' }, // 橙色
  { bg: '#FCE4EC', text: '#C2185B' }, // 粉紅色
  { bg: '#E0F2F1', text: '#00695C' }, // 青色
  { bg: '#FFF9C4', text: '#F57F17' }, // 黃色
  { bg: '#E1BEE7', text: '#6A1B9A' }, // 深紫色
  { bg: '#BBDEFB', text: '#0D47A1' }, // 深藍色
  { bg: '#C8E6C9', text: '#1B5E20' }, // 深綠色
  { bg: '#FFE0B2', text: '#E65100' }, // 淺橙色
  { bg: '#F8BBD0', text: '#880E4F' }, // 深粉紅色
]

// 根據 MNG_CNAME 生成一致的顏色
function getColorForMngCname(mngCname) {
  if (!mngCname) return colorPalette[0]
  
  // 使用字串的 hash 來選擇顏色
  let hash = 0
  for (let i = 0; i < mngCname.length; i++) {
    hash = mngCname.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colorPalette.length
  return colorPalette[index]
}

export default async function AdminPage() {
  const ganttData = await tables.wkGantt.getData()

  // 根據 ORD_NO 去除重複，保留第一個（因為已按日期排序，會保留最新的）
  const uniqueData = Array.from(
    new Map(ganttData.map(item => [item.ORD_NO, item])).values()
  )

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        週報管理
      </Typography>
      <Stack spacing={1}>
        {uniqueData.map((item, index) => (
          <Link
            key={item.ORD_NO}
            href={`/weekly-report?ORD_NO=${encodeURIComponent(item.ORD_NO)}&fromAdmin=true`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                backgroundColor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                  boxShadow: 2,
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      minWidth: 200,
                    }}
                  >
                    {item.ORD_CH}
                  </Typography>
                  {item.MNG_CNAME && (() => {
                    const colors = getColorForMngCname(item.MNG_CNAME)
                    return (
                      <Chip
                        label={item.MNG_CNAME}
                        size="small"
                        sx={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          fontWeight: 500,
                          border: `1px solid ${colors.text}20`,
                        }}
                      />
                    )
                  })()}
                  {item.DEFAULT_SDATE && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        ml: 'auto',
                        fontFamily: 'monospace',
                      }}
                    >
                      {new Date(item.DEFAULT_SDATE).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </Typography>
                  )}
                </Stack>
                <OpenInNew
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                    opacity: 0.6,
                  }}
                />
              </Stack>
            </Paper>
          </Link>
        ))}
      </Stack>
    </Box>
  )
}

