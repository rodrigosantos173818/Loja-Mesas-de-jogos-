import { createClient } from '@supabase/supabase-js'

type ApiRequest = { method?: string; body?: { cep?: unknown; items?: unknown } }
type ApiResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => ApiResponse
  json: (body: unknown) => ApiResponse
}

type RequestItem = { id: string; quantity: number }
type FreightProduct = {
  id: string
  price: number
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

const fallbackProducts: FreightProduct[] = [
  { id: 'sinuca-pro-08', price: 7990, weightKg: 180, lengthCm: 260, widthCm: 145, heightCm: 85 },
  { id: 'futmesa-curve-08', price: 4990, weightKg: 95, lengthCm: 300, widthCm: 170, heightCm: 85 },
  {
    id: 'ping-pong-match-08',
    price: 3690,
    weightKg: 76,
    lengthCm: 274,
    widthCm: 152,
    heightCm: 76,
  },
  { id: 'pebolim-arena-08', price: 2890, weightKg: 72, lengthCm: 142, widthCm: 80, heightCm: 90 },
  { id: 'sinuca-club-08', price: 6490, weightKg: 160, lengthCm: 240, widthCm: 135, heightCm: 85 },
  { id: 'futmesa-play-08', price: 4290, weightKg: 88, lengthCm: 280, widthCm: 160, heightCm: 85 },
  {
    id: 'ping-pong-competition-08',
    price: 4190,
    weightKg: 82,
    lengthCm: 274,
    widthCm: 152,
    heightCm: 76,
  },
  { id: 'pebolim-club-08', price: 2490, weightKg: 68, lengthCm: 135, widthCm: 78, heightCm: 88 },
]
type MelhorEnvioResult = {
  name?: string
  company?: { name?: string }
  custom_price?: string | number
  price?: string | number
  custom_delivery_time?: number
  delivery_time?: number
  error?: string
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST')
    return response.status(405).json({ error: 'Método não permitido.' })
  const cep = String(request.body?.cep || '').replace(/\D/g, '')
  const items = request.body?.items as RequestItem[] | undefined
  if (
    !/^\d{8}$/.test(cep) ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 10 ||
    items.some(
      (item) =>
        typeof item.id !== 'string' ||
        item.id.length > 100 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20,
    )
  )
    return response.status(400).json({ error: 'CEP ou itens inválidos.' })
  const token = process.env.MELHOR_ENVIO_TOKEN
  const origin = (process.env.MELHOR_ENVIO_ORIGIN_CEP || '').replace(/\D/g, '')
  if (!token || !/^\d{8}$/.test(origin))
    return response.status(200).json({ quotes: [], consultation: true })
  try {
    let products: FreightProduct[] = []
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const { data, error } = await client
        .from('products')
        .select('id,category,price,promotional_price,weight_kg,length_cm,width_cm,height_cm,active')
        .in(
          'id',
          items.map((item) => item.id),
        )
      if (error) throw error
      const categorySlugs = [...new Set((data || []).map((row) => row.category))]
      const categoryResult = categorySlugs.length
        ? await client.from('categories').select('slug,active').in('slug', categorySlugs)
        : { data: [], error: null }
      if (categoryResult.error) throw categoryResult.error
      const activeCategories = new Set(
        (categoryResult.data || []).filter((row) => row.active).map((row) => row.slug),
      )
      products = (data || [])
        .filter((row) => row.active && activeCategories.has(row.category))
        .map((row) => ({
          id: row.id,
          price: Number(row.promotional_price ?? row.price),
          weightKg: Number(row.weight_kg),
          lengthCm: Number(row.length_cm),
          widthCm: Number(row.width_cm),
          heightCm: Number(row.height_cm),
        }))
    } else if (!process.env.SUPABASE_URL) {
      products = fallbackProducts
    }
    if (items.some((item) => !products.some((product) => product.id === item.id)))
      return response.status(200).json({ quotes: [], consultation: true })
    const payload = {
      from: { postal_code: origin },
      to: { postal_code: cep },
      products: items.map((item) => {
        const product = products.find((candidate) => candidate.id === item.id)!
        return {
          id: item.id,
          width: product.widthCm,
          height: product.heightCm,
          length: product.lengthCm,
          weight: product.weightKg,
          insurance_value: Math.round(product.price * 100) / 100,
          quantity: item.quantity,
        }
      }),
      options: { receipt: false, own_hand: false },
    }
    const carrierResponse = await fetch(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent':
            process.env.MELHOR_ENVIO_USER_AGENT || 'ARENA08 (suporte@seudominio.com.br)',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      },
    )
    if (!carrierResponse.ok) return response.status(200).json({ quotes: [], consultation: true })
    const data = (await carrierResponse.json()) as MelhorEnvioResult[]
    if (!Array.isArray(data)) return response.status(200).json({ quotes: [], consultation: true })
    const quotes = data
      .filter((quote) => !quote.error)
      .map((quote) => ({
        service: quote.name || 'Entrega',
        carrier: quote.company?.name || 'Transportadora',
        price: Number(quote.custom_price ?? quote.price),
        deliveryDays: Number(quote.custom_delivery_time ?? quote.delivery_time),
      }))
      .filter(
        (quote) =>
          Number.isFinite(quote.price) &&
          quote.price > 0 &&
          Number.isFinite(quote.deliveryDays) &&
          quote.deliveryDays > 0,
      )
      .sort((a, b) => a.price - b.price)
    return response.status(200).json({ quotes, consultation: !quotes.length })
  } catch {
    return response.status(200).json({ quotes: [], consultation: true })
  }
}
