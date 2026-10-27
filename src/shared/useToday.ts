import { useEffect, useState } from 'react'
import { isoDate } from '@/app/state'

/** Today as "YYYY-MM-DD", updated each minute (so a new day starts while the app is open). */
export function useToday(): string {
  const [today, setToday] = useState(() => isoDate(new Date()))
  useEffect(() => {
    const t = setInterval(() => setToday(isoDate(new Date())), 60_000)
    return () => clearInterval(t)
  }, [])
  return today
}
