import { supabase } from '@/lib/supabase'

export const orderStatuses = [
  { value: 'pending', label: 'Novo' },
  { value: 'in_progress', label: 'Em atendimento' },
  { value: 'awaiting_payment', label: 'Aguardando pagamento' },
  { value: 'paid', label: 'Pago' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
] as const

export type OrderStatus = (typeof orderStatuses)[number]['value']

export type OrderItem = {
  id: string
  product_name: string
  product_slug: string
  image: string
  color_name: string
  color_hex: string
  quantity: number
  unit_price: number
  line_total: number
}

export type Order = {
  id: string
  number: number
  customer_name: string
  customer_email: string
  customer_phone: string
  cep: string
  city: string
  state: string
  address: string
  address_number: string
  complement: string
  note: string
  subtotal: number
  status: OrderStatus
  created_at: string
  order_items: OrderItem[]
}

export async function fetchOrders(): Promise<Order[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    ...row,
    number: Number(row.number),
    subtotal: Number(row.subtotal),
    order_items: (row.order_items || []).map((item: Record<string, unknown>) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
  })) as Order[]
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export async function uploadStoreImages(files: File[], folder: 'products' | 'categories') {
  if (!supabase) throw new Error('Supabase não configurado.')
  if (files.length > 12) throw new Error('Envie no máximo 12 imagens por vez.')
  for (const file of files) {
    if (!imageTypes.has(file.type)) throw new Error('Use imagens JPG, PNG, WebP ou AVIF.')
    if (file.size > 10 * 1024 * 1024) throw new Error('Cada imagem deve ter até 10 MB.')
  }
  const urls: string[] = []
  for (const file of files) {
    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const path = `${folder}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw error
    urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
  }
  return urls
}
