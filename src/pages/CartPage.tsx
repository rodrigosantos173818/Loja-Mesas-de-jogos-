import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { isVisibleProduct, salePrice } from '@/data/products'
import { FreightCalculator } from '@/components/FreightCalculator'
import { currency } from '@/lib/utils'

export function CartPage() {
  const { products, categories, brands, cart, updateQuantity, loading } = useStore()
  if (loading)
    return (
      <main className="inner-page">
        <div className="container catalog-empty">Carregando carrinho...</div>
      </main>
    )
  const lines = cart
    .map((item) => ({
      item,
      product: products.find(
        (product) => product.id === item.productId && isVisibleProduct(product, categories, brands),
      ),
    }))
    .filter((line) => line.product !== undefined)
  const subtotal = lines.reduce(
    (sum, line) => sum + salePrice(line.product!) * line.item.quantity,
    0,
  )
  return (
    <main className="inner-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Início</Link>
          <ArrowRight size={14} />
          <span>Carrinho</span>
        </div>
        <div className="page-title-row">
          <div>
            <p className="eyebrow green">SUA PRÓXIMA PARTIDA</p>
            <h1>
              MEU CARRINHO<em>.</em>
            </h1>
            <p>Confira os produtos e calcule sua entrega.</p>
          </div>
          <span className="catalog-count">{lines.length.toString().padStart(2, '0')} PRODUTOS</span>
        </div>
        {!lines.length ? (
          <div className="empty-cart">
            <ShoppingBag size={45} />
            <h2>SUA ARENA AINDA ESTÁ VAZIA.</h2>
            <p>Escolha a mesa que vai começar a próxima partida.</p>
            <Link className="link-button primary" to="/produtos">
              Explorar produtos <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {lines.map(({ item, product }) => (
                <div className="cart-item" key={`${item.productId}-${item.colorId || 'default'}`}>
                  <Link to={`/produto/${product!.slug}`}>
                    <img
                      src={
                        item.colorImage ||
                        product!.colors.find((color) => color.id === item.colorId)?.image ||
                        product!.images[0]
                      }
                      alt={product!.name}
                    />
                  </Link>
                  <div className="cart-item-main">
                    <span className="eyebrow green">{product!.category}</span>
                    <Link to={`/produto/${product!.slug}`} className="cart-item-title">
                      {product!.name}
                    </Link>
                    {item.colorId && (
                      <span className="cart-item-color">
                        Cor:{' '}
                        {item.colorName ||
                          product!.colors.find((color) => color.id === item.colorId)?.name}
                      </span>
                    )}
                    <span className="cart-item-unit">
                      {currency(salePrice(product!))} / unidade
                    </span>
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.colorId)
                        }
                        aria-label={`Diminuir quantidade de ${product!.name}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.colorId)
                        }
                        aria-label={`Aumentar quantidade de ${product!.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-side">
                    <strong>{currency(salePrice(product!) * item.quantity)}</strong>
                    <button
                      onClick={() => updateQuantity(item.productId, 0, item.colorId)}
                      aria-label={`Remover ${product!.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
              <Link to="/produtos" className="continue-link">
                ← Continuar comprando
              </Link>
            </div>
            <div className="cart-summary">
              <h2>RESUMO DO PEDIDO</h2>
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{currency(subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Entrega</span>
                <span>Calcule abaixo</span>
              </div>
              <div className="summary-total">
                <span>Total dos produtos</span>
                <strong>{currency(subtotal)}</strong>
              </div>
              <div className="summary-freight">
                <h3>
                  <Truck size={18} /> CALCULE O FRETE
                </h3>
                <FreightCalculator
                  items={lines.map((line) => ({
                    id: line.item.productId,
                    quantity: line.item.quantity,
                  }))}
                  compact
                />
              </div>
              <Link className="link-button primary full" to="/checkout">
                Ir para o checkout <ArrowRight size={18} />
              </Link>
              <p>
                O valor final da entrega e a forma de pagamento são confirmados no atendimento do
                pedido.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
