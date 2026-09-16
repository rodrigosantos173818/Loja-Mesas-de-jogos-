import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
export function cleanCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8)
}
export function formatCep(value: string) {
  const clean = cleanCep(value)
  return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean
}
export function whatsappUrl(message: string) {
  const number = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
}
