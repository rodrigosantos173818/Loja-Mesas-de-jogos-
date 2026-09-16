import { Link } from 'react-router-dom'
import { ArrowUpRight, Instagram, MessageCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { whatsappUrl } from '@/lib/utils'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Logo />
          <p>
            Mesas que transformam o espaço.
            <br />
            Partidas que ficam na memória.
          </p>
          <span className="footer-tag">PLAY BIG. LIVE MORE.</span>
        </div>
        <div className="footer-links">
          <h4>EXPLORAR</h4>
          <Link to="/produtos">Todos os produtos</Link>
          <Link to="/categoria/sinuca">Sinuca</Link>
          <Link to="/categoria/futmesa">Futmesa</Link>
          <Link to="/categoria/ping-pong">Ping-Pong</Link>
          <Link to="/categoria/pebolim">Pebolim</Link>
        </div>
        <div className="footer-links">
          <h4>SUA ARENA</h4>
          <Link to="/carrinho">Carrinho</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/admin">Admin</Link>
          <a href="/#faq">Dúvidas frequentes</a>
        </div>
        <div className="footer-contact">
          <h4>VAMOS CONVERSAR?</h4>
          <p>Ajuda para escolher a mesa ideal ou planejar uma área de jogos.</p>
          <a
            href={whatsappUrl('Olá! Quero conversar sobre uma mesa da ARENA 08.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chamar no WhatsApp <ArrowUpRight size={18} />
          </a>
          <div className="footer-social">
            <MessageCircle size={18} />
            <Instagram size={18} />
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} ARENA 08. Todos os direitos reservados.</span>
        <span>Envio direto do centro de distribuição</span>
      </div>
    </footer>
  )
}
