import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  seedBrands,
  seedCategories,
  seedProducts,
  type Product,
  type ProductColor,
  type StoreBrand,
  type StoreCategory,
  type StoreColor,
} from '@/data/products'
import {
  brandFromDb,
  brandToDb,
  categoryFromDb,
  categoryToDb,
  colorFromDb,
  colorToDb,
  fromDb,
  supabase,
  toDb,
} from '@/lib/supabase'

export type CartItem = {
  productId: string
  quantity: number
  colorId?: string
  colorName?: string
  colorHex?: string
  colorImage?: string
}
type StoreContextValue = {
  products: Product[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  loading: boolean
  cart: CartItem[]
  cartCount: number
  addToCart: (productId: string, quantity?: number, color?: ProductColor) => void
  updateQuantity: (productId: string, quantity: number, colorId?: string) => void
  clearCart: () => void
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  reorderProducts: (orderedIds: string[]) => Promise<void>
  refreshProducts: () => Promise<void>
  refreshCatalog: () => Promise<void>
  saveCategory: (category: StoreCategory, originalSlug?: string) => Promise<void>
  deleteCategory: (slug: string) => Promise<void>
  saveBrand: (brand: StoreBrand, originalSlug?: string) => Promise<void>
  saveColor: (color: StoreColor) => Promise<StoreColor>
}
const StoreContext = createContext<StoreContextValue | null>(null)
const PRODUCT_KEY = 'arena08-products'
const CART_KEY = 'arena08-cart'

function readLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(PRODUCT_KEY)
    return saved
      ? (JSON.parse(saved) as Product[]).map((item) => ({
          ...item,
          promotionalPrice: item.promotionalPrice ?? null,
          volumes: item.volumes ?? 1,
          displayOrder: item.displayOrder ?? null,
          brand: item.brand ?? 'arena-08',
          colors: item.colors ?? [],
        }))
      : seedProducts
  } catch {
    return seedProducts
  }
}
function readCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? (JSON.parse(saved) as CartItem[]) : []
  } catch {
    return []
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => (supabase ? [] : readLocalProducts()))
  const [categories, setCategories] = useState<StoreCategory[]>(() =>
    supabase ? [] : seedCategories,
  )
  const [brands, setBrands] = useState<StoreBrand[]>(() => (supabase ? [] : seedBrands))
  const [cart, setCart] = useState<CartItem[]>(readCart)
  const [loading, setLoading] = useState(Boolean(supabase))
  const broadcast = useRef<BroadcastChannel | null>(null)

  async function refreshCatalog() {
    if (!supabase) {
      setProducts(readLocalProducts())
      setCategories(seedCategories)
      setBrands(seedBrands)
      setLoading(false)
      return
    }
    const client = supabase
    try {
      const loadProducts = async () => {
        const ordered = await client
          .from('products')
          .select('*')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
        if (ordered.error && ordered.error.message.includes('display_order')) {
          return client.from('products').select('*').order('created_at', { ascending: true })
        }
        return ordered
      }
      const loadProductColors = async () => {
        const ordered = await client
          .from('product_colors')
          .select('product_id,color_id,image,sort_order')
          .order('sort_order', { ascending: true })
        if (ordered.error && ordered.error.message.includes('sort_order')) {
          return client.from('product_colors').select('product_id,color_id,image')
        }
        return ordered
      }
      const [productResult, categoryResult, brandResult, colorResult, productColorResult] =
        await Promise.all([
          loadProducts(),
          client.from('categories').select('*').order('sort_order', { ascending: true }),
          client.from('brands').select('*').order('sort_order', { ascending: true }),
          client.from('colors').select('*').order('name', { ascending: true }),
          loadProductColors(),
        ])
      const loadedColors =
        colorResult.data && !colorResult.error ? colorResult.data.map(colorFromDb) : []
      if (productResult.data && !productResult.error) {
        const relations =
          productColorResult.data && !productColorResult.error ? productColorResult.data : []
        setProducts(
          productResult.data.map((row) => {
            const product = fromDb(row)
            product.colors = relations
              .filter((relation) => String(relation.product_id) === product.id)
              .map((relation) => {
                const color = loadedColors.find((item) => item.id === String(relation.color_id))
                return color ? { ...color, image: String(relation.image || '') } : null
              })
              .filter((color): color is NonNullable<typeof color> => color !== null)
            return product
          }),
        )
      }
      if (categoryResult.data && !categoryResult.error)
        setCategories(categoryResult.data.map(categoryFromDb))
      else setCategories((current) => (current.length ? current : seedCategories))
      if (brandResult.data && !brandResult.error) setBrands(brandResult.data.map(brandFromDb))
      else setBrands((current) => (current.length ? current : seedBrands))
    } catch {
      // Mantém o último catálogo disponível durante uma falha temporária de rede.
    } finally {
      setLoading(false)
    }
  }
  const refreshProducts = refreshCatalog
  useEffect(() => {
    void refreshCatalog()
    if (!supabase) return
    const client = supabase
    const channel = client
      .channel('store-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void refreshCatalog()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        void refreshCatalog()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        void refreshCatalog()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'colors' }, () => {
        void refreshCatalog()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_colors' }, () => {
        void refreshCatalog()
      })
      .subscribe()
    const onFocus = () => void refreshCatalog()
    window.addEventListener('focus', onFocus)
    const poll = window.setInterval(() => void refreshCatalog(), 30_000)
    if ('BroadcastChannel' in window) {
      broadcast.current = new BroadcastChannel('arena08-catalog')
      broadcast.current.onmessage = () => void refreshCatalog()
    }
    const { data: authListener } = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => void refreshCatalog(), 0)
    })
    return () => {
      client.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(poll)
      broadcast.current?.close()
      broadcast.current = null
      authListener.subscription.unsubscribe()
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  function addToCart(productId: string, quantity = 1, color?: ProductColor) {
    setCart((current) => {
      const colorId = color?.id
      const existing = current.find(
        (item) => item.productId === productId && item.colorId === colorId,
      )
      return existing
        ? current.map((item) =>
            item.productId === productId && item.colorId === colorId
              ? {
                  ...item,
                  quantity: Math.min(20, item.quantity + quantity),
                  colorName: color?.name,
                  colorHex: color?.hex,
                  colorImage: color?.image,
                }
              : item,
          )
        : [
            ...current,
            {
              productId,
              quantity: Math.min(20, quantity),
              colorId,
              colorName: color?.name,
              colorHex: color?.hex,
              colorImage: color?.image,
            },
          ]
    })
  }
  function updateQuantity(productId: string, quantity: number, colorId?: string) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => !(item.productId === productId && item.colorId === colorId))
        : current.map((item) =>
            item.productId === productId && item.colorId === colorId
              ? { ...item, quantity: Math.min(20, quantity) }
              : item,
          ),
    )
  }
  function clearCart() {
    setCart([])
  }

  async function saveProduct(product: Product) {
    if (supabase) {
      const row = toDb(product)
      const result = product.id.startsWith('new-')
        ? await supabase.from('products').insert(row).select('id').single()
        : await supabase.from('products').update(row).eq('id', product.id).select('id').single()
      if (result.error) throw result.error
      const productId = product.id.startsWith('new-') ? String(result.data.id) : product.id
      const removed = await supabase.from('product_colors').delete().eq('product_id', productId)
      const colorsSchemaMissing =
        removed.error &&
        (removed.error.code === '42P01' ||
          removed.error.code === 'PGRST205' ||
          removed.error.message.includes('product_colors'))
      if (removed.error && !(colorsSchemaMissing && !product.colors.length)) throw removed.error
      if (product.colors.length) {
        let inserted = await supabase.from('product_colors').insert(
          product.colors.map((color, index) => ({
            product_id: productId,
            color_id: color.id,
            image: color.image,
            sort_order: index + 1,
          })),
        )
        if (inserted.error && inserted.error.message.includes('sort_order')) {
          inserted = await supabase.from('product_colors').insert(
            product.colors.map((color) => ({
              product_id: productId,
              color_id: color.id,
              image: color.image,
            })),
          )
        }
        if (inserted.error) throw inserted.error
      }
      await refreshCatalog()
      broadcast.current?.postMessage('changed')
    } else {
      const next = product.id.startsWith('new-')
        ? [{ ...product, id: crypto.randomUUID() }, ...products]
        : products.map((item) => (item.id === product.id ? product : item))
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(next))
      setProducts(next)
    }
  }
  async function deleteProduct(id: string) {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id).select('id').single()
      if (error) throw error
      await refreshCatalog()
      broadcast.current?.postMessage('changed')
    } else {
      const next = products.filter((item) => item.id !== id)
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(next))
      setProducts(next)
    }
  }
  async function reorderProducts(orderedIds: string[]) {
    if (supabase) {
      const { error } = await supabase.rpc('set_product_order', { product_ids: orderedIds })
      if (error) throw error
      await refreshCatalog()
      broadcast.current?.postMessage('changed')
    } else {
      const positions = new Map(orderedIds.map((id, index) => [id, index + 1]))
      const next = products
        .map((product) => ({ ...product, displayOrder: positions.get(product.id) ?? null }))
        .sort(
          (a, b) =>
            (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.displayOrder ?? Number.MAX_SAFE_INTEGER),
        )
      localStorage.setItem(PRODUCT_KEY, JSON.stringify(next))
      setProducts(next)
    }
  }
  async function saveCategory(category: StoreCategory, originalSlug?: string) {
    if (!supabase) throw new Error('Configure o Supabase para gerenciar categorias.')
    const row = categoryToDb(category)
    const result = originalSlug
      ? await supabase
          .from('categories')
          .update(row)
          .eq('slug', originalSlug)
          .select('slug')
          .single()
      : await supabase.from('categories').insert(row).select('slug').single()
    if (result.error) throw result.error
    await refreshCatalog()
    broadcast.current?.postMessage('changed')
  }
  async function deleteCategory(slug: string) {
    if (!supabase) throw new Error('Configure o Supabase para gerenciar categorias.')
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('slug', slug)
      .select('slug')
      .single()
    if (error) throw error
    await refreshCatalog()
    broadcast.current?.postMessage('changed')
  }
  async function saveBrand(brand: StoreBrand, originalSlug?: string) {
    if (!supabase) throw new Error('Configure o Supabase para gerenciar marcas.')
    const row = brandToDb(brand)
    const result = originalSlug
      ? await supabase.from('brands').update(row).eq('slug', originalSlug).select('slug').single()
      : await supabase.from('brands').insert(row).select('slug').single()
    if (result.error) throw result.error
    await refreshCatalog()
    broadcast.current?.postMessage('changed')
  }
  async function saveColor(color: StoreColor) {
    if (!supabase) throw new Error('Configure o Supabase para gerenciar cores.')
    const row = colorToDb(color)
    const result = color.id.startsWith('new-')
      ? await supabase.from('colors').insert(row).select('id').single()
      : await supabase.from('colors').update(row).eq('id', color.id).select('id').single()
    if (result.error) throw result.error
    const saved = {
      ...color,
      id: color.id.startsWith('new-') ? String(result.data.id) : color.id,
    }
    return saved
  }
  const value = useMemo(
    () => ({
      products,
      categories,
      brands,
      loading,
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      addToCart,
      updateQuantity,
      clearCart,
      saveProduct,
      deleteProduct,
      reorderProducts,
      refreshProducts,
      refreshCatalog,
      saveCategory,
      deleteCategory,
      saveBrand,
      saveColor,
    }),
    [products, categories, brands, loading, cart],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('StoreProvider ausente')
  return value
}
