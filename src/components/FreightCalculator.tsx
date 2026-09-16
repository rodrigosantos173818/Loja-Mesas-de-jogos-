import { useState, type FormEvent } from 'react'
import { ArrowRight, Clock3, MapPin, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cleanCep, currency, formatCep, whatsappUrl } from '@/lib/utils'

export type FreightItem = { id: string; quantity: number }
type Quote = { service: string; carrier: string; price: number; deliveryDays: number }

export function FreightCalculator({
  items,
  compact = false,
}: {
  items: FreightItem[]
  compact?: boolean
}) {
  const [cep, setCep] = useState('')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'quoted' | 'consult'>('idle')
  const [error, setError] = useState('')
  async function calculate(event: FormEvent) {
    event.preventDefault()
    if (cleanCep(cep).length !== 8) {
      setError('Digite um CEP com 8 números.')
      return
    }
    if (!items.length) {
      setError('Adicione um produto para calcular a entrega.')
      return
    }
    setError('')
    setStatus('loading')
    setQuotes([])
    try {
      const response = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cleanCep(cep), items }),
      })
      const result = (await response.json()) as { quotes?: Quote[] }
      if (response.ok && result.quotes?.length) {
        setQuotes(result.quotes)
        setStatus('quoted')
      } else setStatus('consult')
    } catch {
      setStatus('consult')
    }
  }
  return (
    <div className={compact ? 'freight-widget compact' : 'freight-widget'}>
      <form onSubmit={calculate}>
        <label htmlFor={compact ? 'cep-compact' : 'cep-main'}>
          <MapPin size={18} /> Digite seu CEP
        </label>
        <div className="freight-input-row">
          <Input
            id={compact ? 'cep-compact' : 'cep-main'}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            placeholder="00000-000"
            value={cep}
            onChange={(event) => {
              setCep(formatCep(event.target.value))
              setStatus('idle')
              setError('')
            }}
          />
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Calculando...' : 'Calcular'} <ArrowRight size={17} />
          </Button>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>
      {status === 'quoted' && (
        <div className="freight-results" aria-live="polite">
          {quotes.map((quote, index) => (
            <div className="freight-result" key={`${quote.service}-${index}`}>
              <span>
                <Truck size={17} /> {quote.carrier} · {quote.service}
              </span>
              <strong>{currency(quote.price)}</strong>
              <small>
                <Clock3 size={14} /> até {quote.deliveryDays} dias úteis
              </small>
            </div>
          ))}
        </div>
      )}
      {status === 'consult' && (
        <div className="freight-consult" aria-live="polite">
          <strong>Frete sob consulta</strong>
          <span>Nossa equipe confirma valor e prazo para sua região.</span>
          <a
            href={whatsappUrl(`Olá! Quero consultar o frete para o CEP ${formatCep(cep)}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar no WhatsApp <ArrowRight size={15} />
          </a>
        </div>
      )}
    </div>
  )
}
