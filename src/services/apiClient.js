import { API_CONFIG } from '../constants/apiConfig'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const apiClient = {
  async fetchStock(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = `${API_CONFIG.baseUrl}/api/v1/stock${query ? '?' + query : ''}`
    return this._fetch(url)
  },

  async fetchStockBySku(sku) {
    const url = `${API_CONFIG.baseUrl}/api/v1/stock/${encodeURIComponent(sku)}`
    return this._fetch(url)
  },

  async _fetch(url) {
    for (let attempt = 0; attempt <= API_CONFIG.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout)

        const response = await fetch(url, {
          headers: { 'X-API-Key': API_CONFIG.apiKey },
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } catch (error) {
        if (attempt < API_CONFIG.retryAttempts) {
          await delay(API_CONFIG.retryDelay * (attempt + 1))
          continue
        }
        throw error
      }
    }
  },
}
