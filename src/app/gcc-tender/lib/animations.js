/**
 * GCC-Tender 動畫配置
 * 所有 framer-motion variants 集中管理
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

/**
 * 檢查使用者是否偏好減少動畫
 * 注意：僅在客戶端使用
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
