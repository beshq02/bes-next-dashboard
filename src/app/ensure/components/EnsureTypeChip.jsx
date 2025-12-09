'use client'

import { useState, useEffect } from 'react'

import { Chip } from '@mui/material'
import {
  Security as SecurityIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'

// 保固金種類配置
const ENSURE_TYPE_CONFIG = {
  切結書: {
    icon: <DescriptionIcon sx={{ fontSize: '16px !important' }} />,
    color: '#1976d2', // 藍色
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  定存單: {
    icon: <AccountBalanceIcon sx={{ fontSize: '16px !important' }} />,
    color: '#388e3c', // 綠色
    backgroundColor: '#e8f5e8',
    borderColor: '#388e3c',
  },
  保證書: {
    icon: <SecurityIcon sx={{ fontSize: '16px !important' }} />,
    color: '#f57c00', // 橙色
    backgroundColor: '#fff3e0',
    borderColor: '#f57c00',
  },
  現金: {
    icon: <AttachMoneyIcon sx={{ fontSize: '16px !important' }} />,
    color: '#d32f2f', // 紅色
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
}

/**
 * 保固金種類顯示組件
 * @param {Object} props
 * @param {string} props.type - 保固金種類 ('切結書', '定存單', '保證書', '現金')
 * @param {string} props.size - Chip 大小 ('small', 'medium')
 * @param {Object} props.sx - 額外的樣式
 */
export default function EnsureTypeChip({ type, size = 'small', sx = {} }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果沒有提供類型或類型不在配置中，顯示預設樣式
  if (!type || !ENSURE_TYPE_CONFIG[type]) {
    return (
      <Chip
        label={type || '未知'}
        size={size}
        variant="outlined"
        suppressHydrationWarning
        sx={{
          fontSize: '12px',
          height: '24px',
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderColor: '#ddd',
          ...sx,
        }}
      />
    )
  }

  const config = ENSURE_TYPE_CONFIG[type]

  if (!mounted) {
    return (
      <Chip
        icon={config.icon}
        label={type}
        size={size}
        variant="outlined"
        suppressHydrationWarning
        sx={{
          fontSize: '12px',
          height: '24px',
          color: config.color,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          '& .MuiChip-icon': {
            color: config.color,
            marginLeft: '4px',
          },
          '& .MuiChip-label': {
            paddingLeft: '4px',
            paddingRight: '8px',
            fontWeight: 500,
          },
          ...sx,
        }}
      />
    )
  }

  return (
    <Chip
      icon={config.icon}
      label={type}
      size={size}
      variant="outlined"
      sx={{
        fontSize: '12px',
        height: '24px',
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        '& .MuiChip-icon': {
          color: config.color,
          marginLeft: '4px',
        },
        '& .MuiChip-label': {
          paddingLeft: '4px',
          paddingRight: '8px',
          fontWeight: 500,
        },
        ...sx,
      }}
    />
  )
}

/**
 * 獲取所有支援的保固金種類
 * @returns {string[]} 保固金種類陣列
 */
export const getSupportedEnsureTypes = () => {
  return Object.keys(ENSURE_TYPE_CONFIG)
}

/**
 * 檢查是否為有效的保固金種類
 * @param {string} type - 要檢查的類型
 * @returns {boolean} 是否有效
 */
export const isValidEnsureType = type => {
  return type && ENSURE_TYPE_CONFIG.hasOwnProperty(type)
}
