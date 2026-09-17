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
  type StoreBrand,
  type StoreCategory,
} from '@/data/products'
import {
  brandFromDb,
  brandToDb,
  categoryFromDb,
  categoryToDb,
  fromDb,
  supabase,
  toDb,
} from '@/lib/supabase'

type CartItem = { productId: string; quantity: number }
type StoreContextValue = {
  products: Product[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  loading: boolean
  cart: CartItem[]
  cartCount: number
  addToCart: (productId: string, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  refreshProducts: () => Promise<void>
  refreshCatalog: () => Promise<void>
  saveCategory: (category: StoreCategory, originalSlug?: string) => Promise<void>
  deleteCategory: (slug: string) => Promise<void>
  saveBrand: (brand: StoreBrand, originalSlug?: string) => Promise<void>
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
          brand: item.brand ?? 'arena-08',
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
    try {
      const [productResult, categoryResult, brandResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('brands').select('*').order('sort_order', { ascending: true }),
      ])
      if (productResult.data && !productResult.error) setProducts(productResult.data.map(fromDb))
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

  function addToCart(productId: string, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      return existing
        ? current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(20, item.quantity + quantity) }
              : item,
          )
        : [...current, { productId, quantity: Math.min(20, quantity) }]
    })
  }
  function updateQuantity(productId: string, quantity: number) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.min(20, quantity) } : item,
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
      refreshProducts,
      refreshCatalog,
      saveCategory,
      deleteCategory,
      saveBrand,
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
