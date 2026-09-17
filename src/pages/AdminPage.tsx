import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Badge,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryEditor, newCategory } from '@/components/admin/CategoryEditor'
import { ColorEditor, newColor } from '@/components/admin/ColorEditor'
import { ProductEditor, newProduct } from '@/components/admin/ProductEditor'
import {
  brandLabel,
  categoryLabel,
  salePrice,
  type Product,
  type StoreCategory,
  type StoreColor,
} from '@/data/products'
import { useStore } from '@/context/StoreContext'
import { useAdminAuth } from '@/context/AdminAuthContext'
import {
  fetchOrders,
  orderStatuses,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/lib/admin'
import { currency } from '@/lib/utils'

type Section = 'dashboard' | 'products' | 'categories' | 'colors' | 'orders'
const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'colors', label: 'Cores', icon: Palette },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
] as const

const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  )
const orderCode = (number: number) => `#${String(number).padStart(5, '0')}`
const errorMessage = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

export function AdminPage() {
  const {
    products,
    categories,
    brands,
    colors,
    saveProduct,
    deleteProduct,
    reorderProducts,
    saveCategory,
    deleteCategory,
    saveBrand,
    saveColor,
    deleteColor,
  } = useStore()
  const { signOut } = useAdminAuth()
  const [section, setSection] = useState<Section>('dashboard')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [editingColor, setEditingColor] = useState<StoreColor | null>(null)
  const [originalCategorySlug, setOriginalCategorySlug] = useState<string | undefined>()
  const [orders, setOrders] = useState<Order[]>([])
  const [notice, setNotice] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('all')
  const [productBrand, setProductBrand] = useState('all')
  const [productStatus, setProductStatus] = useState('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryStatus, setCategoryStatus] = useState('all')
  const [colorSearch, setColorSearch] = useState('')
  const [colorStatus, setColorStatus] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [openOrder, setOpenOrder] = useState<string | null>(null)
  const [changingOrder, setChangingOrder] = useState<string | null>(null)
  const [reorderingProducts, setReorderingProducts] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const next = await fetchOrders()
        if (alive) setOrders(next)
      } catch (cause) {
        if (alive) setNotice(errorMessage(cause, 'Não foi possível carregar os pedidos.'))
      }
    }
    void load()
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      alive = false
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  function navigate(next: Section) {
    setSection(next)
    setEditingProduct(null)
    setEditingCategory(null)
    setEditingColor(null)
    setNotice('')
  }

  async function persistProduct(product: Product, brandName: string) {
    if (!brands.some((item) => item.slug === product.brand)) {
      await saveBrand({
        slug: product.brand,
        name: brandName,
        description: '',
        order: brands.length + 1,
        active: true,
      })
    }
    await saveProduct(product)
    setEditingProduct(null)
    setNotice('Produto salvo. A loja pública já foi atualizada.')
  }

  async function persistCategory(category: StoreCategory, originalSlug?: string) {
    await saveCategory(category, originalSlug)
    setEditingCategory(null)
    setOriginalCategorySlug(undefined)
    setNotice('Categoria salva. A loja pública já foi atualizada.')
  }

  async function persistColor(color: StoreColor) {
    await saveColor(color)
    setEditingColor(null)
    setNotice('Cor salva. As variações da loja já foram atualizadas.')
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Excluir o produto “${product.name}”?`)) return
    try {
      await deleteProduct(product.id)
      setNotice('Produto excluído.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível excluir o produto.'))
    }
  }

  async function removeCategory(category: StoreCategory) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return
    try {
      await deleteCategory(category.slug)
      setNotice('Categoria excluída.')
    } catch (cause) {
      setNotice(
        (cause as { code?: string })?.code === '23503'
          ? 'Mova os produtos desta categoria antes de excluí-la.'
          : errorMessage(cause, 'Não foi possível excluir a categoria.'),
      )
    }
  }

  async function removeColor(color: StoreColor) {
    if (!window.confirm(`Excluir a cor “${color.name}”? Ela será removida dos produtos.`)) return
    try {
      await deleteColor(color.id)
      setNotice('Cor excluída.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível excluir a cor.'))
    }
  }

  async function toggleProduct(product: Product) {
    try {
      await saveProduct({ ...product, active: !product.active })
      setNotice(product.active ? 'Produto desativado.' : 'Produto ativado.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível alterar o status.'))
    }
  }

  async function moveProduct(productId: string, step: -1 | 1) {
    const filteredIndex = filteredProducts.findIndex((item) => item.id === productId)
    const target = filteredProducts[filteredIndex + step]
    if (filteredIndex < 0 || !target || reorderingProducts) return
    const next = [...products]
    const sourceIndex = next.findIndex((item) => item.id === productId)
    const targetIndex = next.findIndex((item) => item.id === target.id)
    const moved = next[sourceIndex]
    next[sourceIndex] = next[targetIndex]
    next[targetIndex] = moved
    setReorderingProducts(true)
    try {
      await reorderProducts(next.map((item) => item.id))
      setNotice('Ordem dos produtos atualizada automaticamente.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível atualizar a ordem dos produtos.'))
    } finally {
      setReorderingProducts(false)
    }
  }

  async function toggleCategory(category: StoreCategory) {
    try {
      await saveCategory({ ...category, active: !category.active }, category.slug)
      setNotice(category.active ? 'Categoria desativada.' : 'Categoria ativada.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível alterar o status.'))
    }
  }

  async function toggleColor(color: StoreColor) {
    try {
      await saveColor({ ...color, active: !color.active })
      setNotice(color.active ? 'Cor desativada.' : 'Cor ativada.')
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível alterar o status da cor.'))
    }
  }

  async function changeOrderStatus(order: Order, status: OrderStatus) {
    setChangingOrder(order.id)
    try {
      await updateOrderStatus(order.id, status)
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status } : item)),
      )
      setNotice(`${orderCode(order.number)} atualizado.`)
    } catch (cause) {
      setNotice(errorMessage(cause, 'Não foi possível atualizar o pedido.'))
    } finally {
      setChangingOrder(null)
    }
  }

  const filteredProducts = products.filter(
    (item) =>
      `${item.name} ${item.slug} ${item.category} ${item.brand}`
        .toLowerCase()
        .includes(productSearch.toLowerCase()) &&
      (productCategory === 'all' || item.category === productCategory) &&
      (productBrand === 'all' || item.brand === productBrand) &&
      (productStatus === 'all' || (productStatus === 'active' ? item.active : !item.active)),
  )
  const filteredCategories = categories.filter(
    (item) =>
      `${item.name} ${item.slug}`.toLowerCase().includes(categorySearch.toLowerCase()) &&
      (categoryStatus === 'all' || (categoryStatus === 'active' ? item.active : !item.active)),
  )
  const filteredColors = colors.filter(
    (item) =>
      `${item.name} ${item.hex}`.toLowerCase().includes(colorSearch.toLowerCase()) &&
      (colorStatus === 'all' || (colorStatus === 'active' ? item.active : !item.active)),
  )
  const filteredOrders = orders.filter(
    (item) =>
      `${item.number} ${item.customer_name} ${item.customer_email} ${item.customer_phone}`
        .toLowerCase()
        .includes(orderSearch.toLowerCase()) &&
      (orderStatus === 'all' || item.status === orderStatus),
  )

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          ARENA <em>08</em>
          <small>ADMINISTRAÇÃO</small>
        </Link>
        <nav aria-label="Navegação do painel">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={section === id ? 'selected' : ''}
              onClick={() => navigate(id)}
            >
              <Icon size={19} /> {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={17} /> Ver loja
          </Link>
          <button type="button" onClick={() => void signOut()}>
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-dot" /> PAINEL ARENA 08
          </div>
          <Link to="/" target="_blank" rel="noopener noreferrer">
            Abrir loja <ExternalLink size={15} />
          </Link>
        </header>
        <div className="admin-content-inner">
          <div className="admin-page-heading">
            <div>
              <p className="eyebrow green">GERENCIE SUA LOJA</p>
              <h1>
                {sections.find((item) => item.id === section)?.label.toUpperCase()}
                <em>.</em>
              </h1>
              <p>
                {section === 'dashboard'
                  ? 'Visão rápida da operação.'
                  : section === 'products'
                    ? 'Seu catálogo, preços e imagens.'
                    : section === 'categories'
                      ? 'Organize a vitrine da loja.'
                      : section === 'colors'
                        ? 'Cadastre as opções de acabamento dos produtos.'
                        : 'Acompanhe os pedidos recebidos.'}
              </p>
            </div>
            {section === 'products' && !editingProduct && (
              <Button
                onClick={() =>
                  setEditingProduct(
                    newProduct(
                      categories.find((item) => item.active)?.slug || '',
                      brands.find((item) => item.active)?.slug || '',
                    ),
                  )
                }
              >
                <Plus size={17} /> Novo produto
              </Button>
            )}
            {section === 'categories' && !editingCategory && (
              <Button
                onClick={() => {
                  setOriginalCategorySlug(undefined)
                  setEditingCategory(newCategory(categories.length + 1))
                }}
              >
                <Plus size={17} /> Nova categoria
              </Button>
            )}
            {section === 'colors' && !editingColor && (
              <Button onClick={() => setEditingColor(newColor())}>
                <Plus size={17} /> Nova cor
              </Button>
            )}
            {section === 'orders' && (
              <Button
                variant="outline"
                onClick={() =>
                  void fetchOrders()
                    .then(setOrders)
                    .catch((cause) => setNotice(errorMessage(cause, 'Não foi possível atualizar.')))
                }
              >
                <RefreshCw size={16} /> Atualizar
              </Button>
            )}
          </div>
          {notice && (
            <div className="admin-notice" role="status">
              {notice}
            </div>
          )}

          {section === 'dashboard' && (
            <>
              <div className="admin-stat-grid">
                <div>
                  <span>PRODUTOS ATIVOS</span>
                  <strong>{products.filter((item) => item.active).length}</strong>
                  <small>de {products.length} cadastrados</small>
                </div>
                <div>
                  <span>CATEGORIAS ATIVAS</span>
                  <strong>{categories.filter((item) => item.active).length}</strong>
                  <small>de {categories.length} cadastradas</small>
                </div>
                <div>
                  <span>MARCAS ATIVAS</span>
                  <strong>{brands.filter((item) => item.active).length}</strong>
                  <small>de {brands.length} cadastradas</small>
                </div>
                <div>
                  <span>TOTAL DE PEDIDOS</span>
                  <strong>{orders.length}</strong>
                  <small>registrados na loja</small>
                </div>
              </div>
              <div className="admin-dashboard-panels">
                <section className="admin-panel">
                  <div className="admin-section-heading">
                    <h2>PEDIDOS RECENTES</h2>
                    <button type="button" onClick={() => navigate('orders')}>
                      Ver todos <ArrowRight size={16} />
                    </button>
                  </div>
                  {orders.slice(0, 5).map((item) => (
                    <div className="admin-recent-row" key={item.id}>
                      <strong>{orderCode(item.number)}</strong>
                      <span>{item.customer_name}</span>
                      <small>{date(item.created_at)}</small>
                      <b>{currency(item.subtotal)}</b>
                    </div>
                  ))}
                  {!orders.length && <p className="admin-empty">Nenhum pedido registrado ainda.</p>}
                </section>
                <section className="admin-panel">
                  <div className="admin-section-heading">
                    <h2>CATÁLOGO</h2>
                    <button type="button" onClick={() => navigate('products')}>
                      Gerenciar <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="admin-panel-copy">
                    Produtos e categorias salvos no painel aparecem automaticamente na loja pública.
                    Desative um item para removê-lo da vitrine sem apagar seus dados.
                  </p>
                  <div className="admin-catalog-summary">
                    <Package size={22} />
                    <span>{products.filter((item) => !item.active).length} produtos inativos</span>
                  </div>
                  <div className="admin-catalog-summary">
                    <Tags size={22} />
                    <span>
                      {categories.filter((item) => !item.active).length} categorias inativas
                    </span>
                  </div>
                  <div className="admin-catalog-summary">
                    <Badge size={22} />
                    <span>{brands.filter((item) => !item.active).length} marcas inativas</span>
                  </div>
                </section>
              </div>
            </>
          )}

          {section === 'products' &&
            (editingProduct ? (
              <ProductEditor
                key={editingProduct.id}
                product={editingProduct}
                categories={categories}
                brands={brands}
                colors={colors}
                onSave={persistProduct}
                onCancel={() => setEditingProduct(null)}
              />
            ) : (
              <>
                <div className="admin-toolbar">
                  <span>
                    {filteredProducts.length} DE {products.length} PRODUTOS
                  </span>
                  <div className="admin-filters">
                    <label className="admin-search">
                      <Search size={16} />
                      <Input
                        placeholder="Buscar produto..."
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filtrar por categoria"
                      value={productCategory}
                      onChange={(event) => setProductCategory(event.target.value)}
                    >
                      <option value="all">Todas as categorias</option>
                      {categories.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filtrar por marca"
                      value={productBrand}
                      onChange={(event) => setProductBrand(event.target.value)}
                    >
                      <option value="all">Todas as marcas</option>
                      {brands.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filtrar por status"
                      value={productStatus}
                      onChange={(event) => setProductStatus(event.target.value)}
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativos</option>
                      <option value="inactive">Inativos</option>
                    </select>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>PRODUTO</th>
                        <th>CATEGORIA</th>
                        <th>MARCA</th>
                        <th>PREÇO</th>
                        <th>PIX</th>
                        <th>ORDEM</th>
                        <th>STATUS</th>
                        <th>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="admin-product-cell">
                              <img src={item.images[0] || '/images/sinuca-hero.webp'} alt="" />
                              <div>
                                <strong>{item.name}</strong>
                                <small>{item.slug}</small>
                              </div>
                            </div>
                          </td>
                          <td>{categoryLabel(item.category, categories)}</td>
                          <td>{brandLabel(item.brand, brands)}</td>
                          <td>
                            {currency(salePrice(item))}
                            {item.promotionalPrice && (
                              <small className="admin-price-before">{currency(item.price)}</small>
                            )}
                          </td>
                          <td>{currency(item.pixPrice)}</td>
                          <td>
                            <div className="admin-order-controls">
                              <span>{item.displayOrder ?? '—'}</span>
                              <button
                                type="button"
                                disabled={reorderingProducts || filteredProducts[0]?.id === item.id}
                                onClick={() => void moveProduct(item.id, -1)}
                                title="Mover para cima"
                                aria-label={`Mover ${item.name} para cima`}
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  reorderingProducts ||
                                  filteredProducts[filteredProducts.length - 1]?.id === item.id
                                }
                                onClick={() => void moveProduct(item.id, 1)}
                                title="Mover para baixo"
                                aria-label={`Mover ${item.name} para baixo`}
                              >
                                <ArrowDown size={15} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={item.active ? 'status-active' : 'status-inactive'}>
                              {item.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                aria-label={`Editar ${item.name}`}
                                title="Editar"
                                onClick={() => setEditingProduct(item)}
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                aria-label={`${item.active ? 'Desativar' : 'Ativar'} ${item.name}`}
                                title={item.active ? 'Desativar' : 'Ativar'}
                                onClick={() => void toggleProduct(item)}
                              >
                                {item.active ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                              <button
                                type="button"
                                aria-label={`Excluir ${item.name}`}
                                title="Excluir"
                                onClick={() => void removeProduct(item)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredProducts.length && (
                    <p className="admin-empty">Nenhum produto encontrado.</p>
                  )}
                </div>
              </>
            ))}

          {section === 'categories' &&
            (editingCategory ? (
              <CategoryEditor
                key={originalCategorySlug || 'new'}
                category={editingCategory}
                originalSlug={originalCategorySlug}
                onSave={persistCategory}
                onCancel={() => setEditingCategory(null)}
              />
            ) : (
              <>
                <div className="admin-toolbar">
                  <span>
                    {filteredCategories.length} DE {categories.length} CATEGORIAS
                  </span>
                  <div className="admin-filters">
                    <label className="admin-search">
                      <Search size={16} />
                      <Input
                        placeholder="Buscar categoria..."
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filtrar categorias por status"
                      value={categoryStatus}
                      onChange={(event) => setCategoryStatus(event.target.value)}
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativas</option>
                      <option value="inactive">Inativas</option>
                    </select>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>CATEGORIA</th>
                        <th>DESCRIÇÃO</th>
                        <th>ORDEM</th>
                        <th>STATUS</th>
                        <th>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((item) => (
                        <tr key={item.slug}>
                          <td>
                            <div className="admin-product-cell">
                              <img src={item.image || '/images/sinuca-hero.webp'} alt="" />
                              <div>
                                <strong>{item.name}</strong>
                                <small>{item.slug}</small>
                              </div>
                            </div>
                          </td>
                          <td className="admin-description-cell">{item.description || '—'}</td>
                          <td>{item.order}</td>
                          <td>
                            <span className={item.active ? 'status-active' : 'status-inactive'}>
                              {item.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                aria-label={`Editar ${item.name}`}
                                title="Editar"
                                onClick={() => {
                                  setOriginalCategorySlug(item.slug)
                                  setEditingCategory(item)
                                }}
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                aria-label={`${item.active ? 'Desativar' : 'Ativar'} ${item.name}`}
                                title={item.active ? 'Desativar' : 'Ativar'}
                                onClick={() => void toggleCategory(item)}
                              >
                                {item.active ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                              <button
                                type="button"
                                aria-label={`Excluir ${item.name}`}
                                title="Excluir"
                                onClick={() => void removeCategory(item)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredCategories.length && (
                    <p className="admin-empty">Nenhuma categoria encontrada.</p>
                  )}
                </div>
              </>
            ))}

          {section === 'colors' &&
            (editingColor ? (
              <ColorEditor
                key={editingColor.id}
                color={editingColor}
                onSave={persistColor}
                onCancel={() => setEditingColor(null)}
              />
            ) : (
              <>
                <div className="admin-toolbar">
                  <span>
                    {filteredColors.length} DE {colors.length} CORES
                  </span>
                  <div className="admin-filters">
                    <label className="admin-search">
                      <Search size={16} />
                      <Input
                        placeholder="Buscar cor..."
                        value={colorSearch}
                        onChange={(event) => setColorSearch(event.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filtrar cores por status"
                      value={colorStatus}
                      onChange={(event) => setColorStatus(event.target.value)}
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativas</option>
                      <option value="inactive">Inativas</option>
                    </select>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>COR</th>
                        <th>HEX</th>
                        <th>STATUS</th>
                        <th>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredColors.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="admin-color-cell">
                              <span
                                className="color-swatch"
                                style={{ backgroundColor: item.hex }}
                              />
                              <strong>{item.name}</strong>
                            </div>
                          </td>
                          <td>{item.hex}</td>
                          <td>
                            <span className={item.active ? 'status-active' : 'status-inactive'}>
                              {item.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                aria-label={`Editar ${item.name}`}
                                title="Editar"
                                onClick={() => setEditingColor(item)}
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                aria-label={`${item.active ? 'Desativar' : 'Ativar'} ${item.name}`}
                                title={item.active ? 'Desativar' : 'Ativar'}
                                onClick={() => void toggleColor(item)}
                              >
                                {item.active ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                              <button
                                type="button"
                                aria-label={`Excluir ${item.name}`}
                                title="Excluir"
                                onClick={() => void removeColor(item)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredColors.length && <p className="admin-empty">Nenhuma cor encontrada.</p>}
                </div>
              </>
            ))}

          {section === 'orders' && (
            <>
              <div className="admin-toolbar">
                <span>
                  {filteredOrders.length} DE {orders.length} PEDIDOS
                </span>
                <div className="admin-filters">
                  <label className="admin-search">
                    <Search size={16} />
                    <Input
                      placeholder="Buscar número ou cliente..."
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrar pedidos por status"
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                  >
                    <option value="all">Todos os status</option>
                    {orderStatuses.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PEDIDO</th>
                      <th>CLIENTE</th>
                      <th>DATA</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                      <th>DETALHES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong className="admin-order-code">{orderCode(item.number)}</strong>
                        </td>
                        <td>
                          <div className="admin-customer-cell">
                            <strong>{item.customer_name}</strong>
                            <small>{item.customer_email}</small>
                          </div>
                        </td>
                        <td>{date(item.created_at)}</td>
                        <td>{currency(item.subtotal)}</td>
                        <td>
                          <select
                            className="admin-status-select"
                            aria-label={`Status do pedido ${orderCode(item.number)}`}
                            value={item.status}
                            disabled={changingOrder === item.id}
                            onChange={(event) =>
                              void changeOrderStatus(item, event.target.value as OrderStatus)
                            }
                          >
                            {orderStatuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="admin-details-button"
                            type="button"
                            aria-expanded={openOrder === item.id}
                            onClick={() => setOpenOrder(openOrder === item.id ? null : item.id)}
                          >
                            {openOrder === item.id ? 'Fechar' : 'Ver pedido'}{' '}
                            <ArrowRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredOrders.length && <p className="admin-empty">Nenhum pedido encontrado.</p>}
              </div>
              {openOrder &&
                (() => {
                  const item = orders.find((order) => order.id === openOrder)
                  if (!item) return null
                  return (
                    <section className="admin-order-detail">
                      <div className="admin-section-heading">
                        <div>
                          <p className="eyebrow green">PEDIDO {orderCode(item.number)}</p>
                          <h2>DETALHES DO PEDIDO</h2>
                        </div>
                        <button type="button" onClick={() => setOpenOrder(null)}>
                          Fechar
                        </button>
                      </div>
                      <div className="admin-order-detail-grid">
                        <div>
                          <h3>CLIENTE</h3>
                          <strong>{item.customer_name}</strong>
                          <span>{item.customer_email}</span>
                          <span>{item.customer_phone}</span>
                        </div>
                        <div>
                          <h3>ENTREGA</h3>
                          <strong>
                            {item.address}, {item.address_number}
                            {item.complement ? `, ${item.complement}` : ''}
                          </strong>
                          <span>
                            {item.city}/{item.state} · CEP {item.cep}
                          </span>
                          {item.note && <p>Observações: {item.note}</p>}
                        </div>
                      </div>
                      <h3 className="admin-order-items-title">ITENS</h3>
                      {item.order_items.map((line) => (
                        <div className="admin-order-line" key={line.id}>
                          <img src={line.image || '/images/sinuca-hero.webp'} alt="" />
                          <div>
                            <strong>{line.product_name}</strong>
                            {line.color_name && (
                              <small className="admin-order-color">
                                <span
                                  className="color-swatch"
                                  style={{ backgroundColor: line.color_hex }}
                                />
                                {line.color_name}
                              </small>
                            )}
                            <span>
                              {line.quantity} × {currency(line.unit_price)}
                            </span>
                          </div>
                          <b>{currency(line.line_total)}</b>
                        </div>
                      ))}
                      <div className="admin-order-total">
                        <span>Subtotal dos produtos</span>
                        <strong>{currency(item.subtotal)}</strong>
                      </div>
                    </section>
                  )
                })()}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
