import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, MessageCircle, ShieldCheck } from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { isVisibleProduct, salePrice } from '@/data/products'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cleanCep, currency, formatCep, whatsappUrl } from '@/lib/utils'

export function CheckoutPage() {
  const { products, categories, brands, cart, loading } = useStore()
  const lines = useMemo(
    () =>
      cart
        .map((item) => ({
          item,
          product: products.find(
            (product) =>
              product.id === item.productId && isVisibleProduct(product, categories, brands),
          ),
        }))
        .filter((line) => line.product !== undefined),
    [cart, products, categories, brands],
  )
  const subtotal = lines.reduce(
    (sum, line) => sum + salePrice(line.product!) * line.item.quantity,
    0,
  )
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cep: '',
    city: '',
    state: '',
    address: '',
    number: '',
    complement: '',
    note: '',
  })
  const [error, setError] = useState('')
  if (loading)
    return (
      <main className="inner-page">
        <div className="container catalog-empty">Carregando pedido...</div>
      </main>
    )
  function change(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: field === 'cep' ? formatCep(value) : value }))
  }
  async function finish(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    if (!lines.length) {
      setError('Seu carrinho está vazio.')
      return
    }
    if (cleanCep(form.cep).length !== 8) {
      setError('Informe um CEP válido.')
      return
    }
    setError('')
    setSubmitting(true)
    let orderCode = ''
    if (supabase) {
      try {
        const { data, error: orderError } = await supabase.rpc('place_order', {
          customer: { ...form, cep: cleanCep(form.cep) },
          lines: lines.map((line) => ({ id: line.product!.id, quantity: line.item.quantity })),
        })
        if (orderError || !data) throw orderError || new Error('Pedido não criado.')
        orderCode = `#${String(data).padStart(5, '0')}`
      } catch {
        setError('Não foi possível registrar o pedido. Tente novamente ou fale com a equipe.')
        setSubmitting(false)
        return
      }
    }
    const productsText = lines
      .map(
        (line) =>
          `• ${line.product!.name} — ${line.item.quantity}x — ${currency(salePrice(line.product!) * line.item.quantity)}`,
      )
      .join('\n')
    const message = `Olá! Quero finalizar meu pedido na ARENA 08.\n\n${productsText}\n\nSubtotal: ${currency(subtotal)}\nFrete: confirmar para CEP ${form.cep}\n\nNome: ${form.name}\nE-mail: ${form.email}\nTelefone: ${form.phone}\nEntrega: ${form.address}, ${form.number}${form.complement ? `, ${form.complement}` : ''} — ${form.city}/${form.state} — CEP ${form.cep}${form.note ? `\nObservações: ${form.note}` : ''}\n\nGostaria de confirmar disponibilidade, entrega e pagamento.`
    const finalMessage = orderCode ? `${message}\n\nCódigo do pedido: ${orderCode}` : message
    if (supabase) window.location.assign(whatsappUrl(finalMessage))
    else window.open(whatsappUrl(finalMessage), '_blank', 'noopener,noreferrer')
    if (!supabase) setSubmitting(false)
  }
  return (
    <main className="inner-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Início</Link>
          <ArrowRight size={14} />
          <Link to="/carrinho">Carrinho</Link>
          <ArrowRight size={14} />
          <span>Checkout</span>
        </div>
        <div className="page-title-row">
          <div>
            <p className="eyebrow green">ÚLTIMO PASSO</p>
            <h1>
              CHECKOUT<em>.</em>
            </h1>
            <p>Preencha seus dados para confirmar o pedido com nossa equipe.</p>
          </div>
        </div>
        {!lines.length ? (
          <div className="empty-cart">
            <h2>SEU CARRINHO ESTÁ VAZIO.</h2>
            <Link className="link-button primary" to="/produtos">
              Explorar produtos <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <form id="checkout-form" onSubmit={finish} className="checkout-form">
              <div className="checkout-section">
                <h2>
                  <span>01</span> SEUS DADOS
                </h2>
                <div className="form-grid">
                  <label>
                    Nome completo
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => change('name', e.target.value)}
                      placeholder="Seu nome"
                    />
                  </label>
                  <label>
                    E-mail
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => change('email', e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </label>
                  <label>
                    Telefone / WhatsApp
                    <Input
                      required
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => change('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </label>
                </div>
              </div>
              <div className="checkout-section">
                <h2>
                  <span>02</span> ENDEREÇO DE ENTREGA
                </h2>
                <div className="form-grid">
                  <label>
                    CEP
                    <Input
                      required
                      inputMode="numeric"
                      maxLength={9}
                      value={form.cep}
                      onChange={(e) => change('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                  </label>
                  <label>
                    Cidade
                    <Input
                      required
                      value={form.city}
                      onChange={(e) => change('city', e.target.value)}
                      placeholder="Sua cidade"
                    />
                  </label>
                  <label>
                    Estado
                    <Input
                      required
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => change('state', e.target.value.toUpperCase())}
                      placeholder="UF"
                    />
                  </label>
                  <label className="span-2">
                    Endereço
                    <Input
                      required
                      value={form.address}
                      onChange={(e) => change('address', e.target.value)}
                      placeholder="Rua, avenida..."
                    />
                  </label>
                  <label>
                    Número
                    <Input
                      required
                      value={form.number}
                      onChange={(e) => change('number', e.target.value)}
                      placeholder="Número"
                    />
                  </label>
                  <label>
                    Complemento
                    <Input
                      value={form.complement}
                      onChange={(e) => change('complement', e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>
                  <label className="span-2">
                    Observações
                    <textarea
                      value={form.note}
                      onChange={(e) => change('note', e.target.value)}
                      placeholder="Algo que devemos saber sobre a entrega?"
                    />
                  </label>
                </div>
              </div>
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <div className="checkout-assurance">
                <ShieldCheck size={19} />
                <span>
                  Seus dados serão usados apenas para confirmar o pedido e a entrega no atendimento.
                </span>
              </div>
            </form>
            <aside className="checkout-summary">
              <h2>SEU PEDIDO</h2>
              {lines.map((line) => (
                <div className="checkout-line" key={line.item.productId}>
                  <img src={line.product!.images[0]} alt="" />
                  <div>
                    <strong>{line.product!.name}</strong>
                    <span>
                      {line.item.quantity}x {currency(salePrice(line.product!))}
                    </span>
                  </div>
                </div>
              ))}
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{currency(subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Entrega</span>
                <span>Sob confirmação</span>
              </div>
              <div className="summary-total">
                <span>Total dos produtos</span>
                <strong>{currency(subtotal)}</strong>
              </div>
              <p>
                Frete, prazo e pagamento são confirmados pela equipe antes da conclusão da compra.
              </p>
              <Button form="checkout-form" type="submit" className="w-full" disabled={submitting}>
                <MessageCircle size={18} />{' '}
                {submitting ? 'Registrando pedido...' : 'Finalizar pelo WhatsApp'}{' '}
                <ArrowRight size={18} />
              </Button>
              <div className="checkout-steps">
                <span>
                  <Check size={16} /> Envie seu pedido
                </span>
                <span>
                  <Check size={16} /> Confirme entrega e pagamento
                </span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
