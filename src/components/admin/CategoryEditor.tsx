import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImagePicker } from '@/components/admin/ImagePicker'
import type { StoreCategory } from '@/data/products'

export function newCategory(order: number): StoreCategory {
  return { slug: '', name: '', image: '', description: '', order, active: true }
}

type Props = {
  category: StoreCategory
  originalSlug?: string
  onSave: (category: StoreCategory, originalSlug?: string) => Promise<void>
  onCancel: () => void
}

export function CategoryEditor({ category, originalSlug, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (
      !draft.name.trim() ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) ||
      !draft.image ||
      !Number.isInteger(draft.order)
    ) {
      setError('Preencha nome, slug, imagem e ordem da categoria.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(draft, originalSlug)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a categoria.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={(event) => void submit(event)}>
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow green">CATÁLOGO</p>
          <h2>{originalSlug ? 'EDITAR CATEGORIA' : 'NOVA CATEGORIA'}</h2>
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
      <ImagePicker
        images={draft.image ? [draft.image] : []}
        folder="categories"
        single
        onChange={(images) => setDraft((current) => ({ ...current, image: images[0] || '' }))}
        onAdd={(images) => setDraft((current) => ({ ...current, image: images[0] || '' }))}
      />
      <div className="admin-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) =>
              setDraft((current) => ({ ...current, active: event.target.checked }))
            }
          />{' '}
          Categoria ativa
        </label>
      </div>
      {error && (
        <p className="field-error admin-form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        <Save size={17} /> {saving ? 'Salvando...' : 'Salvar categoria'}
      </Button>
    </form>
  )
}
