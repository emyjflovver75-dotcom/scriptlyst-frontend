import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * React hook for iOS keyboard state detection.
 *
 * The template already handles viewport tracking globally (main.jsx),
 * so most apps don't need this hook. Use it for edge cases:
 *   - Remove safe-area-inset-bottom padding when keyboard is open
 *   - Resize a drawer/modal when keyboard is visible
 *
 * @returns {{ keyboardHeight: number, isKeyboardOpen: boolean, onFocusPin: () => void, onBlurFix: () => void }}
 */
export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const baseHeight = useRef(
    typeof window !== 'undefined' ? window.innerHeight : 0
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const kb = Math.max(0, baseHeight.current - vv.height)
      setKeyboardHeight(kb > 80 ? kb : 0)
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  const onFocusPin = useCallback(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    ;[50, 100, 200, 400].forEach(ms =>
      setTimeout(() => window.scrollTo(0, 0), ms)
    )
  }, [])

  const onBlurFix = useCallback(() => {
    setTimeout(() => window.scrollTo(0, 0), 50)
  }, [])

  const isKeyboardOpen = keyboardHeight > 80
  return { keyboardHeight, isKeyboardOpen, onFocusPin, onBlurFix }
}
