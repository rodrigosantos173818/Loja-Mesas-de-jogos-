import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { type Product, categoryLabel, salePrice } from '@/data/products'
import { useStore } from '@/context/StoreContext'
import { currency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, categories } = useStore()
  const navigate = useNavigate()
  function buy() {
    addToCart(product.id)
    navigate('/carrinho')
  }
  return (
    <article className="product-card">
      <Link
        to={`/produto/${product.slug}`}
        className="product-image-wrap"
        aria-label={`Ver ${product.name}`}
      >
        <img
          src={product.images[0] || '/images/sinuca-hero.webp'}
          alt={product.name}
          loading="lazy"
        />
        <span className="product-view">
          <ArrowUpRight size={19} />
        </span>
        {product.premium && <span className="product-label">LINHA PREMIUM</span>}
      </Link>
      <div className="product-body">
        <span className="eyebrow">{categoryLabel(product.category, categories)}</span>
        <Link to={`/produto/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        {product.promotionalPrice && (
          <small className="price-before">De {currency(product.price)}</small>
        )}
        <div className="product-price">{currency(salePrice(product))}</div>
        <p className="product-installment">
          ou {product.installmentCount}x de{' '}
          {currency(salePrice(product) / product.installmentCount)}
        </p>
        <p className="product-pix">
          <strong>{currency(product.pixPrice)}</strong> no Pix
        </p>
        <Button onClick={buy} className="w-full mt-5">
          Comprar <ShoppingBag size={17} />
        </Button>
      </div>
    </article>
  )
}
