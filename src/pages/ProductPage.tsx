import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Badge,
  Check,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Truck,
  Weight,
} from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { brandLabel, categoryLabel, isVisibleProduct, salePrice } from '@/data/products'
import { FreightCalculator } from '@/components/FreightCalculator'
import { ProductCard } from '@/components/ProductCard'
import { ProductImageCarousel } from '@/components/ProductImageCarousel'
import { Button } from '@/components/ui/button'
import { currency } from '@/lib/utils'

export function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { products, categories, brands, addToCart, loading } = useStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedColorId, setSelectedColorId] = useState('')
  const [colorError, setColorError] = useState('')
  const product = products.find(
    (item) => item.slug === slug && isVisibleProduct(item, categories, brands),
  )
  useEffect(() => {
    setQuantity(1)
    setSelectedColorId('')
    setColorError('')
  }, [slug])
  if (loading)
    return (
      <main className="inner-page">
        <div className="container">Carregando produto...</div>
      </main>
    )
  if (!product)
    return (
      <main className="inner-page">
        <div className="container catalog-empty">
          <strong>PRODUTO NÃO ENCONTRADO.</strong>
          <Link to="/produtos">
            Voltar ao catálogo <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    )
  const related = products
    .filter(
      (item) =>
        isVisibleProduct(item, categories, brands) &&
        item.category === product.category &&
        item.id !== product.id,
    )
    .slice(0, 3)
  const selectedColor = product.colors.find((color) => color.id === selectedColorId)
  const galleryImages = selectedColor?.image
    ? [selectedColor.image, ...product.images.filter((image) => image !== selectedColor.image)]
    : product.images
  function buy() {
    if (product!.colors.length && !selectedColor) {
      setColorError('Selecione uma cor antes de adicionar ao carrinho.')
      return
    }
    addToCart(product!.id, quantity, selectedColor)
    navigate('/carrinho')
  }
  return (
    <main className="inner-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Início</Link>
          <ArrowRight size={14} />
          <Link to={`/categoria/${product.category}`}>
            {categoryLabel(product.category, categories)}
          </Link>
          <ArrowRight size={14} />
          <span>{product.name}</span>
        </div>
        <div className="product-detail">
          <ProductImageCarousel
            key={`${product.id}-${selectedColorId}`}
            images={galleryImages}
            productName={product.name}
            premium={product.premium}
          />
          <div className="product-info">
            <p className="eyebrow green">
              {categoryLabel(product.category, categories)} / {brandLabel(product.brand, brands)}
            </p>
            <h1>
              {product.name}
              <em>.</em>
            </h1>
            <p className="product-intro">{product.description}</p>
            <div className="product-price-block">
              <span>PREÇO</span>
              {product.promotionalPrice && (
                <small className="price-before">De {currency(product.price)}</small>
              )}
              <strong>{currency(salePrice(product))}</strong>
              <p>
                ou {product.installmentCount}x de{' '}
                {currency(salePrice(product) / product.installmentCount)}
              </p>
              <div className="product-pix-line">
                <span>PIX</span>
                <strong>{currency(product.pixPrice)}</strong>
                <small>à vista</small>
              </div>
            </div>
            {product.colors.length > 0 && (
              <div className="product-colors">
                <div className="product-color-heading">
                  <span>COR</span>
                  <strong>{selectedColor?.name || 'Selecione uma cor'}</strong>
                </div>
                <div className="product-color-swatches" role="group" aria-label="Cores disponíveis">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={selectedColorId === color.id ? 'selected' : ''}
                      onClick={() => {
                        setSelectedColorId(color.id)
                        setColorError('')
                      }}
                      title={color.name}
                      aria-label={color.name}
                      aria-pressed={selectedColorId === color.id}
                    >
                      {color.image ? (
                        <img src={color.image} alt="" />
                      ) : (
                        <span style={{ backgroundColor: color.hex }} />
                      )}
                    </button>
                  ))}
                </div>
                {colorError && (
                  <p className="field-error" role="alert">
                    {colorError}
                  </p>
                )}
              </div>
            )}
            <div className="product-actions">
              <div className="quantity-control">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={17} />
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={17} />
                </button>
              </div>
              <Button size="lg" onClick={buy}>
                Comprar agora <ShoppingBag size={18} />
              </Button>
            </div>
            <div className="product-delivery-note">
              <Truck size={18} /> Envio direto do centro de distribuição
            </div>
            <div className="product-freight">
              <h3>CALCULE SUA ENTREGA</h3>
              <FreightCalculator items={[{ id: product.id, quantity }]} compact />
            </div>
          </div>
        </div>
        <div className="product-specs">
          <div>
            <p className="eyebrow green">SOBRE A MESA</p>
            <h2>
              DETALHES QUE
              <br />
              <em>FAZEM O JOGO.</em>
            </h2>
            <p>{product.description}</p>
            <ul>
              {product.details.map((detail) => (
                <li key={detail}>
                  <Check size={17} /> {detail}
                </li>
              ))}
            </ul>
          </div>
          <div className="spec-card">
            <h3>MEDIDAS E TRANSPORTE</h3>
            <div>
              <Badge size={19} />
              <span>Marca</span>
              <strong>{brandLabel(product.brand, brands)}</strong>
            </div>
            <div>
              <Ruler size={19} />
              <span>Comprimento</span>
              <strong>{product.lengthCm} cm</strong>
            </div>
            <div>
              <Ruler size={19} />
              <span>Largura</span>
              <strong>{product.widthCm} cm</strong>
            </div>
            <div>
              <Ruler size={19} />
              <span>Altura</span>
              <strong>{product.heightCm} cm</strong>
            </div>
            <div>
              <Weight size={19} />
              <span>Peso</span>
              <strong>{product.weightKg} kg</strong>
            </div>
            <div>
              <Truck size={19} />
              <span>Volumes</span>
              <strong>{product.volumes}</strong>
            </div>
            <p>Confira as medidas do ambiente antes de comprar.</p>
          </div>
        </div>
        {related.length > 0 && (
          <section className="related-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow green">CONTINUE EXPLORANDO</p>
                <h2>
                  MAIS PARA <em>JOGAR.</em>
                </h2>
              </div>
              <Link className="text-link" to={`/categoria/${product.category}`}>
                Ver categoria <ArrowRight size={18} />
              </Link>
            </div>
            <div className="products-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
