'use server'

import { supabase } from '@/lib/supabase'

/**
 * 取得使用者所有收藏的 tender_no
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getFavorites(userId = 'default') {
  const { data, error } = await supabase
    .from('gcc_favorite')
    .select('tender_no')
    .eq('user_id', userId)

  if (error) throw error
  return data.map(row => row.tender_no)
}

/**
 * 新增收藏
 * @param {string} userId
 * @param {string} tenderNo
 */
export async function addFavorite(userId = 'default', tenderNo) {
  const { error } = await supabase
    .from('gcc_favorite')
    .upsert({ user_id: userId, tender_no: tenderNo }, { onConflict: 'user_id,tender_no' })

  if (error) throw error
}

/**
 * 移除收藏
 * @param {string} userId
 * @param {string} tenderNo
 */
export async function removeFavorite(userId = 'default', tenderNo) {
  const { error } = await supabase
    .from('gcc_favorite')
    .delete()
    .eq('user_id', userId)
    .eq('tender_no', tenderNo)

  if (error) throw error
}
