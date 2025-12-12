'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Shuffle } from 'lucide-react'

const DEFAULT_RESTAURANTS = [
  { id: 1, name: '滷肉飯', emoji: '🍚' },
  { id: 2, name: '牛肉麵', emoji: '🍜' },
  { id: 3, name: '便當', emoji: '🍱' },
  { id: 4, name: '水餃', emoji: '🥟' },
  { id: 5, name: '炒飯', emoji: '🍛' },
  { id: 6, name: '義大利麵', emoji: '🍝' },
  { id: 7, name: '拉麵', emoji: '🍜' },
  { id: 8, name: '漢堡', emoji: '🍔' },
  { id: 9, name: '披薩', emoji: '🍕' },
  { id: 10, name: '壽司', emoji: '🍣' },
  { id: 11, name: '雞排', emoji: '🍗' },
  { id: 12, name: '排骨飯', emoji: '🍖' },
]

export default function LunchPicker() {
  const [restaurants, setRestaurants] = useState([])
  const [newRestaurant, setNewRestaurant] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)

  // 從 localStorage 載入餐廳列表
  useEffect(() => {
    const saved = localStorage.getItem('lunchRestaurants')
    if (saved) {
      setRestaurants(JSON.parse(saved))
    } else {
      setRestaurants(DEFAULT_RESTAURANTS)
    }
  }, [])

  // 儲存餐廳列表到 localStorage
  useEffect(() => {
    if (restaurants.length > 0) {
      localStorage.setItem('lunchRestaurants', JSON.stringify(restaurants))
    }
  }, [restaurants])

  const handleAddRestaurant = () => {
    if (newRestaurant.trim()) {
      const newId = Math.max(...restaurants.map(r => r.id), 0) + 1
      const emojis = ['🍽️', '🥘', '🍲', '🥗', '🌮', '🌯', '🥙', '🍴']
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
      
      setRestaurants([
        ...restaurants,
        { id: newId, name: newRestaurant.trim(), emoji: randomEmoji }
      ])
      setNewRestaurant('')
    }
  }

  const handleDeleteRestaurant = (id) => {
    setRestaurants(restaurants.filter(r => r.id !== id))
    if (selectedRestaurant?.id === id) {
      setSelectedRestaurant(null)
    }
  }

  const handlePickRandom = () => {
    if (restaurants.length === 0) return
    
    setIsSpinning(true)
    setSelectedRestaurant(null)

    // 快速切換效果
    let count = 0
    const maxCount = 20
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length)
      setSelectedRestaurant(restaurants[randomIndex])
      count++
      
      if (count >= maxCount) {
        clearInterval(interval)
        setIsSpinning(false)
      }
    }, 100)
  }

  const handleResetToDefault = () => {
    setRestaurants(DEFAULT_RESTAURANTS)
    setSelectedRestaurant(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 結果顯示卡片 */}
      <Card className="border-4 border-pink-300 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-pink-50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <span>✨</span>
            <span>今天吃什麼好呢</span>
            <span>✨</span>
          </CardTitle>
          <CardDescription className="text-purple-500 font-medium text-base">
            點一下按鈕，讓魔法決定吧～ 🪄
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 選擇結果 */}
          <div className="flex flex-col items-center justify-center min-h-[250px] bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-8 border-4 border-dashed border-pink-300 shadow-inner relative overflow-hidden">
            {/* 背景裝飾 */}
            <div className="absolute top-2 left-2 text-2xl opacity-30">💕</div>
            <div className="absolute top-2 right-2 text-2xl opacity-30">🌸</div>
            <div className="absolute bottom-2 left-2 text-2xl opacity-30">🎀</div>
            <div className="absolute bottom-2 right-2 text-2xl opacity-30">✨</div>
            
            {selectedRestaurant ? (
              <div className={`text-center transition-all duration-300 relative z-10 ${isSpinning ? 'scale-95 opacity-70' : 'scale-110 opacity-100'}`}>
                <div className={`text-9xl mb-6 ${isSpinning ? 'animate-spin' : 'animate-bounce'}`}>
                  {selectedRestaurant.emoji}
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                  {selectedRestaurant.name}
                </div>
                {!isSpinning && (
                  <div className="mt-6 space-y-2">
                    <div className="text-pink-600 font-bold text-2xl animate-pulse">
                      ♡ 就是你了！♡
                    </div>
                    <div className="text-purple-500 text-lg">
                      要開心享用哦～ 😋
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center relative z-10">
                <div className="text-7xl mb-4 animate-bounce">🎲✨</div>
                <div className="text-2xl text-purple-500 font-bold">準備好了嗎～？</div>
                <div className="text-lg text-pink-500 mt-2">來抽一個吧 ♡</div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handlePickRandom}
              disabled={isSpinning || restaurants.length === 0}
              size="lg"
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold px-12 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white"
            >
              <Shuffle className="mr-3 h-6 w-6" />
              {isSpinning ? '抽抽抽～ ✨' : '🎀 開始抽籤吧！'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 餐廳列表管理 */}
      <Card className="border-4 border-purple-300 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-purple-600">
            <span className="flex items-center gap-2">
              <span>📝</span>
              <span>我的美食清單</span>
            </span>
            <Badge className="bg-gradient-to-r from-pink-400 to-purple-400 text-white text-base px-4 py-1 rounded-full">
              🌟 {restaurants.length} 個選項
            </Badge>
          </CardTitle>
          <CardDescription className="text-purple-500 font-medium">
            新增你喜歡的餐廳吧～ ♡
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 新增餐廳 */}
          <div className="flex gap-2">
            <Input
              placeholder="✏️ 輸入餐廳名稱..."
              value={newRestaurant}
              onChange={(e) => setNewRestaurant(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRestaurant()}
              className="flex-1 border-3 border-pink-300 rounded-2xl text-lg py-5 focus:border-purple-400 focus:ring-purple-400"
            />
            <Button 
              onClick={handleAddRestaurant} 
              className="shrink-0 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white rounded-2xl px-6 py-5"
            >
              <Plus className="h-5 w-5 mr-1" />
              新增
            </Button>
          </div>

          {/* 餐廳列表 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-2">
            {restaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between bg-gradient-to-br from-pink-50 to-purple-50 border-3 border-pink-200 rounded-2xl p-3 hover:shadow-lg hover:scale-105 transition-all duration-200 group hover:border-purple-300"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{restaurant.emoji}</span>
                  <span className="font-bold text-sm text-purple-700">{restaurant.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteRestaurant(restaurant.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-pink-500 hover:text-pink-700 bg-white rounded-full p-1"
                  title="刪除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {restaurants.length === 0 && (
            <div className="text-center py-12 text-purple-400">
              <div className="text-5xl mb-4">🥺</div>
              <p className="text-lg font-medium mb-2">還沒有餐廳呢～</p>
              <p className="text-sm">快來新增一些美食選項吧！</p>
            </div>
          )}

          {/* 重置按鈕 */}
          <div className="flex justify-end pt-4 border-t-2 border-purple-200">
            <Button
              onClick={handleResetToDefault}
              variant="outline"
              size="sm"
              className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 rounded-full px-6"
            >
              🔄 重置為預設列表
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
