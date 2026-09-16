import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider } from '@/context/StoreContext'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ProductPage } from '@/pages/ProductPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { AdminPage } from '@/pages/AdminPage'
import './index.css'

function RouteEffects() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
    else document.getElementById(location.hash.slice(1))?.scrollIntoView()
    document.title =
      location.pathname === '/'
        ? 'ARENA 08 — Eleve o nível da sua diversão'
        : `ARENA 08 — ${location.pathname.split('/').filter(Boolean).join(' / ')}`
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }),
      { threshold: 0.08 },
    )
    const frame = requestAnimationFrame(() =>
      document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element)),
    )
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [location.pathname, location.hash])
  return null
}

function AppRoutes() {
  const adminRoute = useLocation().pathname.startsWith('/admin')
  return (
    <>
      <RouteEffects />
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      {!adminRoute && <Header />}
      <div id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<CatalogPage />} />
          <Route path="/categoria/:category" element={<CatalogPage />} />
          <Route path="/produto/:slug" element={<ProductPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<CatalogPage />} />
        </Routes>
      </div>
      {!adminRoute && <Footer />}
    </>
  )
}

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
