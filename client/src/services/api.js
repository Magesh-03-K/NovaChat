import axios from 'axios'
import { supabase } from './supabase.js'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api'
  }
  return 'https://novachat-fpgc.onrender.com/api'
}

// Central Axios instance; attaches the current Supabase access token to
// every request so the FastAPI backend can verify identity.
export const api = axios.create({
  baseURL: getBaseURL(),
})

let cachedToken = null

// Initialize cached token on load
supabase.auth.getSession().then(({ data }) => {
  cachedToken = data.session?.access_token || null
}).catch(() => {})

// Keep token updated when auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token || null
})

api.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    try {
      const { data } = await supabase.auth.getSession()
      cachedToken = data.session?.access_token || null
    } catch {
      // ignore
    }
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  }
  return config
})

