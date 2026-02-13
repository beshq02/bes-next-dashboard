'use client'

import { useState, useEffect, useRef, useCallback, useContext, createContext } from 'react'
import { Camera, ImageOff, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const ScreenshotContext = createContext(null)

export function useScreenshot() {
  return useContext(ScreenshotContext)
}

function ScreenshotImage({ src, tenderName }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 })

  const onPointerDown = useCallback((e) => {
    const el = containerRef.current
    if (!el) return
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollX: el.scrollLeft,
      scrollY: el.scrollTop,
    }
    el.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current
    if (!d.active) return
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = d.scrollX - (e.clientX - d.startX)
    el.scrollTop = d.scrollY - (e.clientY - d.startY)
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Zoom controls */}
      {!error && !loading && (
        <div className="flex items-center justify-end gap-1 px-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="min-w-12 text-center text-xs text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            disabled={zoom >= 3}
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Image area — drag to pan */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto ${
          !loading && !error ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ImageOff className="mb-3 size-12" />
            <p className="text-sm">此案尚無頁面截圖</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-bes-blue-500" />
              </div>
            )}
            <img
              src={src}
              alt={`${tenderName} - 政府採購網頁面截圖`}
              className={`max-w-none origin-top-left select-none border ${loading ? 'hidden' : ''}`}
              draggable={false}
              style={{ width: `${zoom * 100}%` }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setError(true)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function ScreenshotProvider({ children, screenshotUrl, tenderName }) {
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mql.matches)
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <ScreenshotContext.Provider value={{ open, setOpen, screenshotUrl, tenderName }}>
      {/* Desktop (lg+): side-by-side layout */}
      <div className="lg:flex">
        <div
          className={`min-w-0 transition-all duration-300 ${open && isDesktop ? 'lg:w-1/2' : 'w-full'}`}
        >
          {children}
        </div>

        {/* Desktop right panel */}
        {open && isDesktop && (
          <div className="sticky top-0 flex h-screen w-1/2 flex-col border-l border-slate-200 bg-white">
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-bes-blue-500" />
                <h3 className="text-sm font-semibold text-bes-blue-900">政府採購網頁面截圖</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              <ScreenshotImage src={screenshotUrl} tenderName={tenderName} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet (< lg): fullscreen sheet */}
      <Sheet open={open && !isDesktop} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex h-dvh w-full max-w-full flex-col"
        >
          <SheetHeader className="shrink-0 text-left">
            <SheetTitle className="flex items-center gap-2">
              <Camera className="size-4 text-bes-blue-500" />
              政府採購網頁面截圖
            </SheetTitle>
            <SheetDescription className="truncate">{tenderName}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ScreenshotImage src={screenshotUrl} tenderName={tenderName} />
          </div>
        </SheetContent>
      </Sheet>
    </ScreenshotContext.Provider>
  )
}
