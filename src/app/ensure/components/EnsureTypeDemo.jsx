'use client'

import { Box, Grid, Typography } from '@mui/material'

import EnsureTypeChip, { getSupportedEnsureTypes } from './EnsureTypeChip'

/**
 * 保固金種類 Chip 展示組件
 * 用於展示所有支援的保固金種類樣式
 */
export default function EnsureTypeDemo() {
  const supportedTypes = getSupportedEnsureTypes()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        保固金種類 Chip 展示
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        支援的保固金種類：
      </Typography>

      <Grid container spacing={2}>
        {supportedTypes.map(type => (
          <Grid item key={type}>
            <EnsureTypeChip type={type} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
        不同尺寸：
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <EnsureTypeChip type="切結書" size="small" />
        <EnsureTypeChip type="切結書" size="medium" />
      </Box>

      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
        未知類型處理：
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <EnsureTypeChip type="未知類型" />
        <EnsureTypeChip type="" />
        <EnsureTypeChip />
      </Box>
    </Box>
  )
}
