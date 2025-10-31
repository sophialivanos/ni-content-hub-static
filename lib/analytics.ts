declare global { interface Window { dataLayer?: any[]; gtag?: (...args:any[]) => void } }

export function track(event: string, payload: Record<string, any> = {}) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...payload })
    if (window.gtag) window.gtag('event', event, payload)
    if (process.env.NODE_ENV !== 'production') console.log('[track]', event, payload)
  }
}