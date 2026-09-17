import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImagePicker } from '@/components/admin/ImagePicker'
import type { Product, StoreBrand, StoreCategory } from '@/data/products'

export function newProduct(category = '', brand = ''): Product {
  return {
    id: `new-${crypto.randomUUID()}`,
    name: '',
    slug: '',
    category,
    brand,
    description: '',
    details: [],
    price: 0,
    pixPrice: 0,
    promotionalPrice: null,
    installmentCount: 10,
    weightKg: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    volumes: 1,
    images: [],
    featured: false,
    premium: false,
    active: true,
  }
}

type Props = {
  product: Product
  categories: StoreCategory[]
  brands: StoreBrand[]
  onSave: (product: Product, brandName: string) => Promise<void>
  onCancel: () => void
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type DecimalInputProps = {
  value: number | null
  onChange: (value: number | null) => void
  required?: boolean
  optional?: boolean
}

function DecimalInput({ value, onChange, required = false, optional = false }: DecimalInputProps) {
  const [text, setText] = useState(() =>
    value === null || value === 0 ? '' : String(value).replace('.', ','),
  )

  return (
    <Input
      type="text"
      inputMode="decimal"
      required={required}
      placeholder={optional ? 'Opcional' : 'Ex.: 0,75'}
      value={text}
      onChange={(event) => {
        const next = event.target.value.replace(/\s/g, '')
        if (!/^\d*(?:[.,]\d{0,2})?$/.test(next)) return
        setText(next)
        if (!next) {
          onChange(optional ? null : 0)
          return
        }
        const parsed = Number(next.replace(',', '.'))
        if (Number.isFinite(parsed)) onChange(parsed)
      }}
      onBlur={() => {
        if (!text || text === ',' || text === '.') return
        const parsed = Number(text.replace(',', '.'))
        if (Number.isFinite(parsed)) setText(String(parsed).replace('.', ','))
      }}
    />
  )
}

export function ProductEditor({ product, categories, brands, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(product)
  const [brandName, setBrandName] = useState(
    () => brands.find((item) => item.slug === product.brand)?.name || product.brand,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isNew = product.id.startsWith('new-')

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (
      !draft.name.trim() ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) ||
      !categories.some((item) => item.slug === draft.category) ||
      !brandName.trim() ||
      !toSlug(brandName) ||
      !draft.description.trim() ||
      draft.price <= 0 ||
      draft.pixPrice <= 0 ||
      (draft.promotionalPrice !== null &&
        (draft.promotionalPrice <= 0 || draft.promotionalPrice >= draft.price)) ||
      draft.weightKg <= 0 ||
      draft.lengthCm <= 0 ||
      draft.widthCm <= 0 ||
      draft.heightCm <= 0 ||
      !Number.isInteger(draft.volumes) ||
      draft.volumes < 1 ||
      draft.volumes > 20 ||
      !Number.isInteger(draft.installmentCount) ||
      draft.installmentCount < 1 ||
      draft.installmentCount > 24 ||
      !draft.images.length
    ) {
      setError(
        'Confira nome, slug, categoria, marca, preços, descrição, imagem e medidas. O preço promocional deve ser menor que o preço normal.',
      )
      return
    }
    setSaving(true)
    setError('')
    try {
      const normalizedBrand = toSlug(brandName)
      const existingBrand = brands.find(
        (item) =>
          item.slug === normalizedBrand ||
          item.name.toLowerCase() === brandName.trim().toLowerCase(),
      )
      await onSave({ ...draft, brand: existingBrand?.slug || normalizedBrand }, brandName.trim())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-editor" onSubmit={(event) => void submit(event)}>
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow green">CATÁLOGO</p>
          <h2>{isNew ? 'NOVO PRODUTO' : 'EDITAR PRODUTO'}</h2>
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
            onChange={(event) => update('name', event.target.value)}
          />
        </label>
        <label>
          Slug
          <Input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(event) =>
              update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
            }
          />
        </label>
        <label>
          Marca
          <Input
            required
            list="product-brand-options"
            placeholder="Ex.: Klopf"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
          />
          <datalist id="product-brand-options">
            {brands.map((item) => (
              <option key={item.slug} value={item.name} />
            ))}
          </datalist>
        </label>
        <label>
          Categoria
          <select
            required
            value={draft.category}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">Selecione</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
                {item.active ? '' : ' (inativa)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preço normal (R$)
          <DecimalInput
            required
            value={draft.price}
            onChange={(value) => update('price', value ?? 0)}
          />
        </label>
        <label>
          Preço Pix (R$)
          <DecimalInput
            required
            value={draft.pixPrice}
            onChange={(value) => update('pixPrice', value ?? 0)}
          />
        </label>
        <label>
          Preço promocional (R$)
          <DecimalInput
            optional
            value={draft.promotionalPrice}
            onChange={(value) => update('promotionalPrice', value)}
          />
        </label>
        <label>
          Peso (kg)
          <DecimalInput
            required
            value={draft.weightKg}
            onChange={(value) => update('weightKg', value ?? 0)}
          />
        </label>
        <label>
          Comprimento (cm)
          <DecimalInput
            required
            value={draft.lengthCm}
            onChange={(value) => update('lengthCm', value ?? 0)}
          />
        </label>
        <label>
          Largura (cm)
          <DecimalInput
            required
            value={draft.widthCm}
            onChange={(value) => update('widthCm', value ?? 0)}
          />
        </label>
        <label>
          Altura (cm)
          <DecimalInput
            required
            value={draft.heightCm}
            onChange={(value) => update('heightCm', value ?? 0)}
          />
        </label>
        <label>
          Volumes
          <Input
            required
            type="number"
            min="1"
            max="20"
            step="1"
            value={draft.volumes}
            onChange={(event) => update('volumes', Number(event.target.value))}
          />
        </label>
        <label>
          Parcelas
          <Input
            required
            type="number"
            min="1"
            max="24"
            step="1"
            value={draft.installmentCount}
            onChange={(event) => update('installmentCount', Number(event.target.value))}
          />
        </label>
        <label className="span-2">
          Descrição
          <textarea
            required
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </label>
        <label className="span-2">
          Características (uma por linha)
          <textarea
            value={draft.details.join('\n')}
            onChange={(event) =>
              update(
                'details',
                event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </div>
      <ImagePicker
        images={draft.images}
        folder="products"
        onChange={(images) => update('images', images)}
        onAdd={(images) =>
          setDraft((current) => ({ ...current, images: [...current.images, ...images] }))
        }
      />
      <div className="admin-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(event) => update('featured', event.target.checked)}
          />{' '}
          Destaque
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.premium}
            onChange={(event) => update('premium', event.target.checked)}
          />{' '}
          Linha Premium
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => update('active', event.target.checked)}
          />{' '}
          Produto ativo
        </label>
      </div>
      {error && (
        <p className="field-error admin-form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        <Save size={17} /> {saving ? 'Salvando...' : 'Salvar produto'}
      </Button>
    </form>
  )
}
