// @author  veera
// @file    features/admin-support/components/TypewriterText.tsx

import { useEffect, useRef, useState } from 'react'

export type TypewriterTextProps = {
  text: string
  speedMs?: number
  onComplete?: () => void
}

export function TypewriterText({ text, speedMs = 14, onComplete }: TypewriterTextProps) {
  const [visibleLength, setVisibleLength] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setVisibleLength(0)
    if (!text.length) {
      onCompleteRef.current?.()
      return undefined
    }

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisibleLength(index)
      if (index >= text.length) {
        window.clearInterval(timer)
        onCompleteRef.current?.()
      }
    }, speedMs)

    return () => window.clearInterval(timer)
  }, [text, speedMs])

  return <>{text.slice(0, visibleLength)}</>
}
