'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFavorites, addFavorite, removeFavorite } from '../lib/favorites'

const USER_ID = 'default'

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFavorites(USER_ID)
      .then(list => setFavorites(new Set(list)))
      .catch(_e => console.error('載入收藏失敗:', _e))
      .finally(() => setIsLoading(false))
  }, [])

  const toggle = useCallback(async (tenderNo) => {
    const isFav = favorites.has(tenderNo)

    // 樂觀更新 UI
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(tenderNo)
      else next.add(tenderNo)
      return next
    })

    // 背景同步 Supabase
    try {
      if (isFav) {
        await removeFavorite(USER_ID, tenderNo)
      } else {
        await addFavorite(USER_ID, tenderNo)
      }
    } catch (_e) {
      console.error('收藏操作失敗:', _e)
      // 回滾 UI
      setFavorites(prev => {
        const next = new Set(prev)
        if (isFav) next.add(tenderNo)
        else next.delete(tenderNo)
        return next
      })
    }
  }, [favorites])

  return { favorites, toggle, isLoading }
}
