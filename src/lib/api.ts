import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

export const getClienteIdFromUrl = (): string =>
  globalThis.location.pathname.split('/').find(Boolean) ?? ''
