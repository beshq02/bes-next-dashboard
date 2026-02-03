import LunchPicker from './components/LunchPicker'

export const metadata = {
  title: '中午吃甚麼?',
}

export default function LunchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-fade-in mb-8 text-center">
          <div className="mb-4 inline-block">
            <div className="animate-bounce text-6xl md:text-7xl">☀️🍱✨</div>
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            中午吃甚麼?
          </h1>
          <p className="text-lg font-medium text-purple-600">
            讓可愛的小幫手幫你決定吧 ♡
          </p>
          <div className="mt-3 flex justify-center gap-2 text-2xl">
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
