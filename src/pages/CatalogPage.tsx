import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { brandLabel, categoryLabel, isVisibleProduct, type Category } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { useStore } from '@/context/StoreContext'

export function CatalogPage() {
  const { category: routeCategory } = useParams()
  const [searchParams] = useSearchParams()
  const { products, categories, brands, loading } = useStore()
  const activeCategories = categories.filter((item) => item.active)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('display')
  const category: Category | 'all' =
    routeCategory && activeCategories.some((item) => item.slug === routeCategory)
      ? (routeCategory as Category)
      : 'all'
  const premiumOnly = searchParams.get('linha') === 'premium'
  const listed = useMemo(() => {
    const result = products.filter(
      (item) =>
        isVisibleProduct(item, categories, brands) &&
        (category === 'all' || item.category === category) &&
        (!premiumOnly || item.premium) &&
        `${item.name} ${item.description} ${brandLabel(item.brand, brands)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    if (sort === 'display')
      result.sort(
        (a, b) =>
          (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER),
      )
    if (sort === 'lowest') result.sort((a, b) => a.price - b.price)
    if (sort === 'highest') result.sort((a, b) => b.price - a.price)
    if (sort === 'featured') result.sort((a, b) => Number(b.featured) - Number(a.featured))
    return result
  }, [products, categories, brands, category, premiumOnly, search, sort])
  const title = premiumOnly
    ? 'LINHA PREMIUM'
    : category === 'all'
      ? 'TODOS OS PRODUTOS'
      : categoryLabel(category, categories)
  return (
    <main className="inner-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Início</Link>
          <ArrowRight size={14} />
          <span>{title}</span>
        </div>
        <div className="page-title-row">
          <div>
            <p className="eyebrow green">EQUIPAMENTOS PARA JOGAR GRANDE</p>
            <h1>
              {title}
              <em>.</em>
            </h1>
            <p>
              {category === 'all'
                ? 'Escolha a mesa que transforma seu espaço na próxima arena.'
                : categories.find((item) => item.slug === category)?.description ||
                  'Escolha a mesa que transforma seu espaço na próxima arena.'}
            </p>
          </div>
          <span className="catalog-count">
            {listed.length.toString().padStart(2, '0')} PRODUTOS
          </span>
        </div>
        <div className="catalog-toolbar">
          <div className="catalog-categories">
            <Link to="/produtos" className={category === 'all' && !routeCategory ? 'selected' : ''}>
              Todos
            </Link>
            {activeCategories.map((item) => (
              <Link
                key={item.slug}
                to={`/categoria/${item.slug}`}
                className={category === item.slug ? 'selected' : ''}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="catalog-controls">
            <div className="catalog-search">
              <Search size={18} />
              <Input
                aria-label="Buscar produtos"
                placeholder="Buscar mesa..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <label className="sort-select">
              <SlidersHorizontal size={17} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Ordenar produtos"
              >
                <option value="display">Ordem da vitrine</option>
                <option value="featured">Destaques</option>
                <option value="lowest">Menor preço</option>
                <option value="highest">Maior preço</option>
              </select>
            </label>
          </div>
        </div>
        {loading && <p className="catalog-empty">Carregando produtos...</p>}
        {!loading && listed.length ? (
          <div className="products-grid catalog-grid">
            {listed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="catalog-empty">
              <strong>NENHUMA MESA ENCONTRADA.</strong>
              <p>Tente buscar por outra modalidade ou confira a coleção completa.</p>
              <Link to="/produtos">
                Ver todos os produtos <ArrowRight size={18} />
              </Link>
            </div>
          )
        )}
      </div>
    </main>
  )
}
