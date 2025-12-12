'use client'

import LunchPicker from './components/LunchPicker'

export default function LunchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="text-6xl md:text-7xl animate-bounce">🍱✨</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-3">
            今天吃什麼呢～？
          </h1>
          <p className="text-purple-600 text-lg font-medium">
            讓可愛的小幫手幫你決定吧 ♡
          </p>
          <div className="flex justify-center gap-2 mt-3 text-2xl">
            <span className="animate-wiggle">🌟</span>
            <span className="animate-wiggle animation-delay-200">💖</span>
            <span className="animate-wiggle animation-delay-400">🌈</span>
          </div>
        </div>
        <LunchPicker />
      </div>
    </div>
  )
}
