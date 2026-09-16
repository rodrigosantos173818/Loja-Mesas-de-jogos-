import { Link } from 'react-router-dom'
import * as Accordion from '@radix-ui/react-accordion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Headphones,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Trophy,
  Truck,
  Users,
  Zap,
} from 'lucide-react'
import { useStore } from '@/context/StoreContext'
import { isVisibleProduct } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { FreightCalculator } from '@/components/FreightCalculator'
import { whatsappUrl } from '@/lib/utils'

const benefits = [
  { icon: Truck, title: 'ENTREGA PARA TODO O BRASIL', text: 'Consulte valor e prazo pelo CEP' },
  { icon: ShieldCheck, title: 'COMPRA COM CONFIANÇA', text: 'Atendimento em cada etapa' },
  { icon: Headphones, title: 'SUPORTE ESPECIALIZADO', text: 'A mesa certa para seu espaço' },
]
const faqs = [
  {
    q: 'Como funciona a entrega?',
    a: 'Os produtos são enviados direto do centro de distribuição. Informe seu CEP na página do produto ou no carrinho para consultar opções de transporte. Quando não houver cotação automática, nossa equipe confirma valor e prazo pelo WhatsApp.',
  },
  {
    q: 'Posso consultar o frete antes de comprar?',
    a: 'Sim. Use a calculadora de entrega nesta página ou nas páginas de produto e carrinho. A cotação considera CEP, peso, dimensões e quantidade.',
  },
  {
    q: 'Como escolher a mesa certa para meu espaço?',
    a: 'Confira as medidas na página de cada produto e reserve espaço para circulação e para os jogadores. Se precisar, nossa equipe ajuda a avaliar o ambiente pelo WhatsApp.',
  },
  {
    q: 'Vocês atendem empresas e condomínios?',
    a: 'Sim. Podemos ajudar a planejar salas de jogos, áreas comuns e espaços de convivência. Entre em contato para conversar sobre o projeto e a entrega.',
  },
  {
    q: 'Quais são as formas de pagamento?',
    a: 'Os preços à vista no Pix e as opções de parcelamento estão indicados em cada produto. A confirmação da forma de pagamento é feita no atendimento do pedido.',
  },
]

export function HomePage() {
  const { products, categories, loading } = useStore()
  const activeCategories = categories.filter((category) => category.active)
  const featured = products
    .filter((product) => isVisibleProduct(product, categories) && product.featured)
    .slice(0, 4)
  const premium =
    products.find((product) => isVisibleProduct(product, categories) && product.premium) ||
    products.find((product) => isVisibleProduct(product, categories))
  return (
    <main>
      <section className="hero">
        <img
          className="hero-photo"
          src="/images/sinuca-hero.webp"
          alt="Mesa de sinuca em sala de jogos premium"
          fetchPriority="high"
        />
        <div className="hero-scrim" />
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="pulse-dot" /> SUA PRÓXIMA PARTIDA COMEÇA AQUI
            </p>
            <h1>
              ELEVE O NÍVEL
              <br />
              DA SUA <em>DIVERSÃO.</em>
            </h1>
            <p className="hero-subtitle">
              Mesas que transformam espaços em arenas. Para jogar, competir e reunir quem importa.
            </p>
            <div className="hero-buttons">
              <Link className="link-button primary" to="/produtos">
                Explorar produtos <ArrowUpRight size={19} />
              </Link>
              <a className="link-button secondary" href="#entrega">
                Calcular entrega <ArrowRight size={19} />
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <strong>{activeCategories.length.toString().padStart(2, '0')}</strong>
                <span>MODALIDADES</span>
              </div>
              <div>
                <strong>01</strong>
                <span>NOVA ARENA</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>BOAS PARTIDAS</span>
              </div>
            </div>
          </div>
          <div className="hero-side-label">
            PLAY BIG <span>•</span> LIVE MORE
          </div>
        </div>
        <a href="#categorias" className="hero-scroll">
          EXPLORE A ARENA <ArrowDown size={16} />
        </a>
        <div className="hero-corner">
          08 <span>/</span> ARENA
        </div>
      </section>

      <div className="benefit-bar">
        <div className="container benefit-bar-inner">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="benefit-bar-item">
              <Icon size={25} strokeWidth={1.5} />
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section id="categorias" className="section categories-section">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow green">ESCOLHA SUA MODALIDADE</p>
              <h2>
                O JOGO COMEÇA <em>AQUI.</em>
              </h2>
            </div>
            <p>
              {activeCategories.length} formas de desafiar a rotina.
              <br />
              Uma só vontade de jogar mais.
            </p>
          </div>
          <div className="category-grid">
            {activeCategories.map((category, index) => (
              <Link
                key={category.slug}
                to={`/categoria/${category.slug}`}
                className="category-card"
                data-reveal
              >
                <img src={category.image} alt={`Mesa para ${category.name}`} loading="lazy" />
                <div className="category-overlay" />
                <span className="category-index">
                  {String(index + 1).padStart(2, '0')} /{' '}
                  {String(activeCategories.length).padStart(2, '0')}
                </span>
                <div className="category-card-bottom">
                  <div>
                    <small>{category.description}</small>
                    <strong>{category.name}</strong>
                  </div>
                  <span className="round-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bestseller-section">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow green">SELEÇÃO ARENA 08</p>
              <h2>
                MAIS <em>VENDIDOS.</em>
              </h2>
            </div>
            <Link className="text-link" to="/produtos">
              Ver todos os produtos <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="products-grid">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div className="product-skeleton" key={index} aria-hidden="true" />
                ))
              : featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <div className="section-end-link">
            <Link className="link-button secondary" to="/produtos">
              Explorar toda a coleção <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="environment-section">
        <div className="container">
          <div className="environment-intro" data-reveal>
            <p className="eyebrow green">PARA ONDE A PARTIDA TE LEVAR</p>
            <h2>
              SUA ARENA.
              <br />
              <em>SEU ESPAÇO.</em>
            </h2>
            <p>Uma mesa muda o clima do lugar. Escolha a experiência certa para cada ambiente.</p>
          </div>
          <div className="environment-grid">
            <Link
              to={
                activeCategories.some((item) => item.slug === 'sinuca')
                  ? '/categoria/sinuca'
                  : '/produtos'
              }
              className="environment-card large"
              data-reveal
            >
              <img
                src="/images/sinuca-hero.webp"
                alt="Sala de jogos com mesa de sinuca"
                loading="lazy"
              />
              <span className="environment-card-content">
                <small>01 / EM CASA</small>
                <strong>
                  O MELHOR LUGAR
                  <br />
                  DA CASA.
                </strong>
                <span>
                  Descubra a coleção <ArrowUpRight size={17} />
                </span>
              </span>
            </Link>
            <Link
              to={
                activeCategories.some((item) => item.slug === 'ping-pong')
                  ? '/categoria/ping-pong'
                  : '/produtos'
              }
              className="environment-card"
              data-reveal
            >
              <img
                src="/images/ping-pong.webp"
                alt="Mesa de ping-pong para área de convivência"
                loading="lazy"
              />
              <span className="environment-card-content">
                <small>02 / ÁREAS DE CONVIVÊNCIA</small>
                <strong>
                  MAIS GENTE.
                  <br />
                  MAIS JOGO.
                </strong>
                <span>
                  Descubra a coleção <ArrowUpRight size={17} />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section id="entrega" className="section delivery-section">
        <div className="container delivery-layout">
          <div className="delivery-copy" data-reveal>
            <p className="eyebrow green">ONDE VOCÊ JOGA?</p>
            <h2>
              A PARTIDA CHEGA
              <br />
              <em>ATÉ VOCÊ.</em>
            </h2>
            <p>
              Calcule a entrega pelo CEP. O frete considera o peso, as dimensões e a quantidade do
              produto escolhido.
            </p>
            <div className="delivery-points">
              <span>
                <MapPin size={18} /> Entrega para todo o Brasil
              </span>
              <span>
                <PackageCheck size={18} /> Envio direto do centro de distribuição
              </span>
            </div>
          </div>
          <div className="delivery-panel" data-reveal>
            <div className="delivery-panel-top">
              <Truck size={29} />
              <span>
                CÁLCULO DE ENTREGA <small>01 / 02</small>
              </span>
            </div>
            <h3>SEU JOGO NÃO TEM FRONTEIRAS.</h3>
            <p>
              Consulte o frete para a mesa em destaque. No carrinho, calcule o total dos produtos
              selecionados.
            </p>
            {loading ? (
              <div className="shipping-loading">Carregando a mesa em destaque...</div>
            ) : (
              <FreightCalculator items={premium ? [{ id: premium.id, quantity: 1 }] : []} />
            )}
            <div className="delivery-panel-foot">
              <Clock3 size={16} /> Valor e prazo aparecem quando houver cotação disponível.
            </div>
          </div>
        </div>
      </section>

      <section className="section store-benefits">
        <div className="container">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow green">MAIS QUE UMA MESA</p>
              <h2>
                FEITA PARA <em>JOGAR GRANDE.</em>
              </h2>
            </div>
          </div>
          <div className="benefits-grid">
            {[
              {
                icon: Trophy,
                number: '01',
                title: 'ESCOLHA DE CAMPEÃO',
                text: 'Mesas selecionadas pelo design, presença e experiência de jogo.',
              },
              {
                icon: Zap,
                number: '02',
                title: 'ENERGIA EM CADA DETALHE',
                text: 'Produtos para transformar qualquer encontro em uma partida.',
              },
              {
                icon: Users,
                number: '03',
                title: 'JOGO PARA TODOS',
                text: 'De casa à área comum, uma modalidade para cada espaço.',
              },
              {
                icon: Headphones,
                number: '04',
                title: 'ATENDIMENTO DE VERDADE',
                text: 'Converse com quem ajuda a escolher e planejar sua arena.',
              },
            ].map(({ icon: Icon, number, title, text }) => (
              <div className="benefit-tile" key={number} data-reveal>
                <span>{number} / 04</span>
                <Icon size={30} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="container premium-layout">
          <div className="premium-image" data-reveal>
            <img
              src={premium?.images[0] || '/images/futmesa.webp'}
              alt={premium?.name || 'Mesa da Linha Premium'}
              loading="lazy"
            />
            <span className="premium-image-tag">ARENA 08 / PREMIUM</span>
          </div>
          <div className="premium-copy" data-reveal>
            <p className="eyebrow green">
              <Sparkles size={16} /> LINHA PREMIUM
            </p>
            <h2>
              NÃO É SÓ
              <br />
              UMA MESA.
              <br />
              <em>É PRESENÇA.</em>
            </h2>
            <p>
              Equipamentos que chamam para o jogo antes mesmo do primeiro ponto. Para quem quer
              elevar o espaço e a experiência.
            </p>
            <ul>
              <li>
                <Check size={18} /> Design que marca o ambiente
              </li>
              <li>
                <Check size={18} /> Estrutura para partidas memoráveis
              </li>
              <li>
                <Check size={18} /> Experiência de jogo em outro nível
              </li>
            </ul>
            <Link className="link-button primary" to="/produtos?linha=premium">
              Conhecer a Linha Premium <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="business-section">
        <div className="container business-inner" data-reveal>
          <div>
            <p className="eyebrow">ARENAS COMPARTILHADAS</p>
            <h2>
              EMPRESAS E<br />
              <em>CONDOMÍNIOS.</em>
            </h2>
            <p>
              Seu espaço de convivência pode virar o ponto de encontro favorito de todo mundo. Vamos
              planejar a próxima partida?
            </p>
            <a
              className="link-button dark-on-green"
              href={whatsappUrl('Olá! Quero falar sobre mesas para empresa ou condomínio.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Conversar sobre meu projeto <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="business-graphic">
            <span>JOGO</span>
            <strong>08</strong>
            <span>COLETIVO</span>
          </div>
        </div>
      </section>

      <section className="section reviews-section">
        <div className="container reviews-layout">
          <div data-reveal>
            <p className="eyebrow green">AVALIAÇÕES</p>
            <h2>
              A EXPERIÊNCIA
              <br />
              <em>FAZ O PLACAR.</em>
            </h2>
            <p>
              Queremos ouvir cada história de jogo. As avaliações verificadas de compradores
              aparecerão aqui conforme forem recebidas.
            </p>
          </div>
          <div className="review-empty" data-reveal>
            <span className="review-quote">“</span>
            <h3>SUA PRÓXIMA PARTIDA PODE INSPIRAR A PRÓXIMA ARENA.</h3>
            <p>Depois da entrega, conte para nós como ficou o seu espaço.</p>
            <a
              href={whatsappUrl('Olá! Quero compartilhar minha experiência com a ARENA 08.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Compartilhar experiência <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="container faq-layout">
          <div className="faq-heading" data-reveal>
            <p className="eyebrow green">DÚVIDAS FREQUENTES</p>
            <h2>
              ANTES DO JOGO,
              <br />
              <em>TUDO CLARO.</em>
            </h2>
            <p>Mais alguma pergunta? Nossa equipe está a uma mensagem de distância.</p>
            <a
              className="text-link"
              href={whatsappUrl('Olá! Tenho uma dúvida sobre os produtos da ARENA 08.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com a equipe <ArrowUpRight size={18} />
            </a>
          </div>
          <Accordion.Root className="faq-list" type="single" collapsible>
            {faqs.map((faq, index) => (
              <Accordion.Item value={`item-${index}`} className="faq-item" key={faq.q}>
                <Accordion.Header>
                  <Accordion.Trigger className="faq-trigger">
                    <span>0{index + 1}</span>
                    {faq.q}
                    <ChevronDown size={21} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="faq-answer">
                  <p>{faq.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow green">O PRÓXIMO PONTO É SEU</p>
            <h2>
              PRONTO PARA
              <br />
              <em>JOGAR GRANDE?</em>
            </h2>
          </div>
          <Link className="link-button primary" to="/produtos">
            Encontre sua mesa <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  )
}
