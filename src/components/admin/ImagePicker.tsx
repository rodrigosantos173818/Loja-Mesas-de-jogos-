import { useState, type ChangeEvent } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadStoreImages } from '@/lib/admin'

type Props = {
  images: string[]
  folder: 'products' | 'categories'
  single?: boolean
  onChange: (images: string[]) => void
  onAdd: (images: string[]) => void
}

export function ImagePicker({ images, folder, single = false, onChange, onAdd }: Props) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      onAdd(await uploadStoreImages(single ? files.slice(0, 1) : files, folder))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar as imagens.')
    } finally {
      setUploading(false)
    }
  }

  function move(index: number, step: number) {
    const target = index + step
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const moved = next[index]
    next[index] = next[target]
    next[target] = moved
    onChange(next)
  }

  function makePrimary(index: number) {
    const next = [...images]
    next.unshift(...next.splice(index, 1))
    onChange(next)
  }

  return (
    <div className="admin-images">
      <div className="admin-section-heading">
        <div>
          <h3>{single ? 'IMAGEM DA CATEGORIA' : 'IMAGENS DO PRODUTO'}</h3>
          <p>
            {single ? 'A imagem aparece na vitrine.' : 'A primeira imagem é a principal na loja.'}
          </p>
        </div>
        <label className="admin-upload-button">
          <ImagePlus size={17} />{' '}
          {uploading ? 'Enviando...' : single ? 'Enviar imagem' : 'Enviar imagens'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={!single}
            disabled={uploading}
            onChange={(event) => void upload(event)}
          />
        </label>
      </div>
      <div className="admin-image-grid">
        {images.map((image, index) => (
          <div className="admin-image-tile" key={`${image}-${index}`}>
            <img src={image} alt={`Prévia da imagem ${index + 1}`} />
            {!single && (
              <span className="admin-image-position">
                {index === 0 ? 'PRINCIPAL' : `#${index + 1}`}
              </span>
            )}
            <div className="admin-image-actions">
              {!single && index > 0 && (
                <button
                  type="button"
                  onClick={() => makePrimary(index)}
                  title="Definir como principal"
                  aria-label={`Definir imagem ${index + 1} como principal`}
                >
                  <Star size={15} />
                </button>
              )}
              {!single && index > 0 && (
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  title="Mover para esquerda"
                  aria-label={`Mover imagem ${index + 1} para esquerda`}
                >
                  <ArrowLeft size={15} />
                </button>
              )}
              {!single && index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  title="Mover para direita"
                  aria-label={`Mover imagem ${index + 1} para direita`}
                >
                  <ArrowRight size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, position) => position !== index))}
                title="Remover imagem"
                aria-label={`Remover imagem ${index + 1}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!images.length && <div className="admin-image-empty">Nenhuma imagem adicionada.</div>}
      </div>
      <div className="admin-image-url">
        <Input
          type="url"
          placeholder="Ou cole uma URL https://..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-label="URL da imagem"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!/^https:\/\//i.test(url.trim())) {
              setError('Informe uma URL HTTPS válida.')
              return
            }
            onAdd([url.trim()])
            setUrl('')
            setError('')
          }}
        >
          Adicionar URL
        </Button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
