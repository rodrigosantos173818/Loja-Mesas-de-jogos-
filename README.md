# ARENA 08

Loja esportiva premium em React, TypeScript, Vite, Tailwind v4, componentes shadcn/ui, Supabase e Vercel. Inclui home, catálogo, categorias, detalhes de produto, carrinho, checkout por atendimento e painel administrativo.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem variáveis de ambiente, o catálogo público usa produtos de demonstração. O painel `/admin` permanece bloqueado até configurar o Supabase; alterações em `localStorage` não são uma forma segura de administrar a loja.

## Supabase

1. Crie um projeto e execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor. O arquivo também atualiza instalações que já usam a versão anterior do esquema.
2. Crie uma conta em Authentication. O gatilho do banco cria automaticamente uma linha em `profiles` com `role = 'customer'`. Para conceder acesso administrativo, altere somente esse perfil para `role = 'admin'` pelo SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Para a API de frete consultar os dados reais do catálogo, configure também `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente nas variáveis do servidor da Vercel. Nunca exponha a service role em `VITE_`.

O login fica em `/admin/login` e `/admin` é protegido por sessão e por `profiles.role = 'admin'`. A sessão é persistida pelo Supabase Auth; contas comuns são bloqueadas. Produtos, categorias, pedidos e imagens usam RLS e políticas de Storage. O bucket público `product-images` guarda as imagens de produtos e categorias; somente administradores autenticados podem enviar ou apagar arquivos. A primeira imagem do produto é a principal, e a ordem configurada no painel aparece na galeria pública.

O checkout registra um pedido no Supabase pela função `place_order` antes de abrir o WhatsApp. Visitantes podem criar pedidos por essa função, mas não conseguem ler ou alterar pedidos diretamente. O painel permite consultar clientes, entrega e itens e atualizar o status. Sem Supabase, o checkout mantém o fluxo de demonstração pelo WhatsApp, sem criar pedidos no painel.

As tabelas `products` e `categories` entram na publicação `supabase_realtime` para atualizar a vitrine em outras abas. A loja também refaz a consulta ao voltar para a aba. O esquema promove o usuário principal já criado para `profiles.role = 'admin'`. Para promover outro usuário, execute `update public.profiles set role = 'admin' where id = 'UUID';`. Não inclua a service role no frontend.

## Frete

`POST /api/frete` recebe `{ "cep": "01001000", "items": [{ "id": "...", "quantity": 1 }] }`. A função busca preço, peso e medidas no catálogo do servidor e solicita cotação por produtos ao Melhor Envio. Configure `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_ORIGIN_CEP` e `MELHOR_ENVIO_USER_AGENT` nas variáveis da Vercel. Sem credenciais ou sem transportadora disponível, a interface mostra **Frete sob consulta** e o link de WhatsApp.

No Vite local, a função `/api/frete` não é executada; use `vercel dev` para testar a função com as variáveis de servidor. O checkout abre o WhatsApp com os dados do pedido para a equipe confirmar entrega e pagamento; nenhuma cobrança automática é efetuada. Preencha `VITE_WHATSAPP_NUMBER` com o número comercial real antes de publicar.

## Publicar na Vercel

Conecte este projeto a uma conta Vercel, configure as variáveis de ambiente acima e faça o deploy. `vercel.json` reescreve as rotas da SPA para `index.html` e mantém `/api/frete` como função serverless.

## Verificação

```bash
npm run build
npm run typecheck
npm run test:freight
```

As fotografias de exemplo foram geradas para este projeto. Os PNGs originais ficam em `assets/source-images`; as versões WebP entregues pelo site ficam em `public/images`. Use `npm run optimize:images` para regenerar as versões leves. Substitua fotos, descrições, medidas e preços pelos dados comerciais reais antes de vender.
