import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useStore } from '@/context/StoreContext'
import { whatsappUrl } from '@/lib/utils'

export function Header() {
  const [open, setOpen] = useState(false)
  const { cartCount, categories } = useStore()
  const nav = [
    { to: '/produtos', label: 'Produtos' },
    ...categories
      .filter((category) => category.active)
      .map((category) => ({ to: `/categoria/${category.slug}`, label: category.name })),
  ]
  return (
    <>
      <div className="announcement">
        <span>ENVIO DIRETO DO CENTRO DE DISTRIBUIÇÃO</span>
        <span className="announcement-dot" />
        <span>JOGUE GRANDE. VIVA MAIS.</span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Navegação principal">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <a
              className="header-contact"
              href={whatsappUrl('Olá! Quero falar com a ARENA 08.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fale com um especialista <ArrowUpRight size={15} />
            </a>
            <Link
              to="/carrinho"
              className="cart-icon"
              aria-label={`Carrinho com ${cartCount} itens`}
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
            <button
              className="mobile-menu-button"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
            >
              {open ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          <div className="container">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link to="/carrinho" onClick={() => setOpen(false)}>
              Carrinho <ShoppingBag size={18} />
            </Link>
          </div>
        </nav>
      )}
    </>
  )
}
