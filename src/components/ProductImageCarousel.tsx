import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  productName: string
  premium?: boolean
}

export function ProductImageCarousel({ images, productName, premium = false }: Props) {
  const slides = images.length ? images : ['/images/sinuca-hero.webp']
  const [index, setIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const hasMultiple = slides.length > 1

  function show(next: number) {
    setIndex((next + slides.length) % slides.length)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMultiple) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      show(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      show(index + 1)
    }
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!hasMultiple || touchStart.current === null) return
    const distance = event.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (Math.abs(distance) < 45) return
    show(distance > 0 ? index - 1 : index + 1)
  }

  return (
    <div
      className="product-gallery"
      role="region"
      aria-label={`Galeria de imagens de ${productName}`}
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div
        className="product-main-image"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX
        }}
        onTouchEnd={handleTouchEnd}
      >
        <img src={slides[index]} alt={`${productName} — imagem ${index + 1} de ${slides.length}`} />
        {premium && <span className="product-label">LINHA PREMIUM</span>}
        {hasMultiple && (
          <>
            <button
              className="product-carousel-arrow previous"
              type="button"
              onClick={() => show(index - 1)}
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="product-carousel-arrow next"
              type="button"
              onClick={() => show(index + 1)}
              aria-label="Próxima imagem"
            >
              <ChevronRight size={24} />
            </button>
            <span className="product-carousel-count" aria-live="polite">
              {index + 1} / {slides.length}
            </span>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className="product-thumbnails" aria-label="Selecionar imagem">
          {slides.map((image, slideIndex) => (
            <button
              key={`${image}-${slideIndex}`}
              type="button"
              onClick={() => show(slideIndex)}
              className={slideIndex === index ? 'active' : ''}
              aria-current={slideIndex === index ? 'true' : undefined}
              aria-label={`Ver imagem ${slideIndex + 1} de ${slides.length}`}
            >
              <img src={image} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
