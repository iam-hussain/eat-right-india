import { useCallback, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        fn(...args)
      }, delay)
    },
    [fn, delay]
  ) as T

  return debouncedFn
}

/**
 * Custom hook for throttling function calls
 * @param fn - The function to throttle
 * @param delay - Delay in milliseconds (default: 1000ms)
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 1000
): T {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRunRef.current

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now
        fn(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now()
          fn(...args)
        }, delay - timeSinceLastRun)
      }
    },
    [fn, delay]
  ) as T

  return throttledFn
}

