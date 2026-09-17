import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StoreBrand } from '@/data/products'

export function newBrand(order: number): StoreBrand {
  return { slug: '', name: '', description: '', order, active: true }
}

type Props = {
  brand: StoreBrand
  originalSlug?: string
  onSave: (brand: StoreBrand, originalSlug?: string) => Promise<void>
  onCancel: () => void
}

export function BrandEditor({ brand, originalSlug, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(brand)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (
      !draft.name.trim() ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) ||
      !Number.isInteger(draft.order)
    ) {
      setError('Preencha nome, slug e ordem da marca.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(draft, originalSlug)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a marca.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={(event) => void submit(event)}>
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow green">CATÁLOGO</p>
          <h2>{originalSlug ? 'EDITAR MARCA' : 'NOVA MARCA'}</h2>
        </div>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      <div className="admin-form-grid">
        <label>
          Nome
          <Input
            required
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          Slug
          <Input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              }))
            }
          />
        </label>
        <label>
          Ordem
          <Input
            required
            type="number"
            step="1"
            value={draft.order}
            onChange={(event) =>
              setDraft((current) => ({ ...current, order: Number(event.target.value) }))
            }
          />
        </label>
        <label className="span-2">
          Descrição
          <textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="admin-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) =>
              setDraft((current) => ({ ...current, active: event.target.checked }))
            }
          />{' '}
          Marca ativa
        </label>
      </div>
      {error && (
        <p className="field-error admin-form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        <Save size={17} /> {saving ? 'Salvando...' : 'Salvar marca'}
      </Button>
    </form>
  )
}
