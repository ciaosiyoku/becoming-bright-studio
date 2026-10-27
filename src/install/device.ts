// Which kind of device opened the install page, from the browser's user agent. Pure (tested).

export type Device = 'android' | 'ipad' | 'computer'

export const DEVICES: Device[] = ['android', 'ipad', 'computer']

/**
 * Android tablets and phones (Fire tablets too: their Silk browser is Android underneath) share one set of steps,
 * iPad and iPhone another. iPads on iPadOS 13+ say "Macintosh", so a Mac user agent with a touch screen is an iPad.
 */
export function detectDevice(ua: string, maxTouchPoints = 0): Device {
  if (/Android|\bSilk\b|\bKF[A-Z]{2,6}\b|Kindle/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) return 'ipad'
  return 'computer'
}
