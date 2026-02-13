'use client'

import { Camera } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useScreenshot } from './ScreenshotProvider'

export default function ScreenshotButton() {
  const { open, setOpen } = useScreenshot()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(!open)}
      className={`cursor-pointer ${
        open
          ? 'border-bes-blue-500 bg-bes-blue-50 text-bes-blue-700'
          : 'border-bes-blue-400 text-bes-blue-600 hover:bg-bes-blue-50'
      }`}
    >
      <Camera className="mr-1 size-4" />
      頁面截圖
    </Button>
  )
}
