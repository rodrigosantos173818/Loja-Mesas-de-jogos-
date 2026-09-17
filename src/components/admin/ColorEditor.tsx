import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StoreColor } from '@/data/products'

export const newColor = (): StoreColor => ({
  id: `new-${crypto.randomUUID()}`,
  name: '',
  hex: '#000000',
  active: true,
})

type Props = {
  color: StoreColor
  onSave: (color: StoreColor) => Promise<void>
  onCancel: () => void
}

export function ColorEditor({ color, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(color)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || !/^#[0-9A-F]{6}$/i.test(draft.hex)) {
      setError('Informe o nome e um código HEX válido, como #1A1A1A.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...draft, name: draft.name.trim(), hex: draft.hex.toUpperCase() })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a cor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-editor admin-color-editor" onSubmit={(event) => void submit(event)}>
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow green">VARIAÇÕES</p>
          <h2>{color.id.startsWith('new-') ? 'NOVA COR' : 'EDITAR COR'}</h2>
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
            placeholder="Ex.: Preto"
          />
        </label>
        <label>
          Código HEX
          <div className="admin-hex-field">
            <input
              type="color"
              value={draft.hex}
              onChange={(event) =>
                setDraft((current) => ({ ...current, hex: event.target.value.toUpperCase() }))
              }
              aria-label="Selecionar cor"
            />
            <Input
              required
              value={draft.hex}
              maxLength={7}
              pattern="#[0-9A-Fa-f]{6}"
              onChange={(event) =>
                setDraft((current) => ({ ...current, hex: event.target.value.toUpperCase() }))
              }
              placeholder="#000000"
            />
          </div>
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
          Cor ativa
        </label>
      </div>
      {error && <p className="field-error admin-form-error">{error}</p>}
      <Button type="submit" disabled={saving}>
        <Save size={17} /> {saving ? 'Salvando...' : 'Salvar cor'}
      </Button>
    </form>
  )
}
