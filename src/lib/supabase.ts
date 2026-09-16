import { createClient } from '@supabase/supabase-js'
import type { Product, StoreCategory } from '@/data/products'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function fromDb(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: row.category as Product['category'],
    description: String(row.description || ''),
    details: Array.isArray(row.details) ? row.details.map(String) : [],
    price: Number(row.price),
    pixPrice: Number(row.pix_price),
    promotionalPrice: row.promotional_price == null ? null : Number(row.promotional_price),
    installmentCount: Number(row.installment_count),
    weightKg: Number(row.weight_kg),
    lengthCm: Number(row.length_cm),
    widthCm: Number(row.width_cm),
    heightCm: Number(row.height_cm),
    volumes: Number(row.volumes ?? 1),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    featured: Boolean(row.featured),
    premium: Boolean(row.premium),
    active: Boolean(row.active),
  }
}

export function toDb(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description,
    details: product.details,
    price: product.price,
    pix_price: product.pixPrice,
    promotional_price: product.promotionalPrice,
    installment_count: product.installmentCount,
    weight_kg: product.weightKg,
    length_cm: product.lengthCm,
    width_cm: product.widthCm,
    height_cm: product.heightCm,
    volumes: product.volumes,
    images: product.images,
    featured: product.featured,
    premium: product.premium,
    active: product.active,
  }
}

export function categoryFromDb(row: Record<string, unknown>): StoreCategory {
  return {
    slug: String(row.slug),
    name: String(row.name),
    image: String(row.image || ''),
    description: String(row.description || ''),
    order: Number(row.sort_order ?? 0),
    active: Boolean(row.active),
  }
}

export function categoryToDb(category: StoreCategory) {
  return {
    slug: category.slug,
    name: category.name,
    image: category.image,
    description: category.description,
    sort_order: category.order,
    active: category.active,
  }
}
