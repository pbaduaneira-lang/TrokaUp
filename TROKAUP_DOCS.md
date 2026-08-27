# 🚀 TrokaUp - Documentação Técnica Oficial & Registro de Produção

Documento central de engenharia, arquitetura, infraestrutura em nuvem e publicação do projeto **TrokaUp**.

---

## 📌 1. Identidade & Registro Oficial

| Item | Valor Oficial |
| :--- | :--- |
| **Nome da Plataforma** | **TrokaUp** |
| **Slogan Oficial** | *Transforme o que você tem no que você quer. Escambo moderno & sustentável.* |
| **Identificador do Pacote Android** | `com.trokaup.app` |
| **Versão Inicial de Lançamento** | `1.0.0` (Code `2`) |
| **EAS Project ID (Expo)** | `c034a9d3-bdc5-4116-8a7e-1d07aed5bce0` |
| **Conta Expo EAS** | `edmiltondefacio` (`pbaduaneira@gmail.com`) |
| **Repositório Oficial no GitHub** | [https://github.com/pbaduaneira-lang/TrokaUp](https://github.com/pbaduaneira-lang/TrokaUp) |
| **Ambiente Web / Vercel** | [https://trokaup.vercel.app](https://trokaup.vercel.app) *(DNS configurado)* |

---

## 🗄️ 2. Infraestrutura de Banco de Dados (Supabase PostgreSQL)

O banco de dados foi migrado de ambiente local para a nuvem da AWS (São Paulo) no Supabase, com suporte a pooling de conexões (*Connection Pooling* na porta 6543) e SSL.

- **Projeto Supabase:** `xfwvkjxpomynvoyylxhx` (São Paulo - `sa-east-1`)
- **String de Conexão Oficial:**
  `postgresql://postgres.xfwvkjxpomynvoyylxhx:trokaupedju1016@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`

### Esquema de Tabelas Criadas:
1. **`public.products`**: Anúncios de itens para troca (título, descrição, quer_em_troca, imagem_url, cidade, usuario_id, categoria, ativo, criado_em).
2. **`public.mensagens`**: Mensagens de texto trocadas em tempo real via chat (remetente_id, destinatario_id, texto, lida, produto_id, criado_em).
3. **`public.users`**: Perfis de usuários e cidades registradas.
4. **`public.ratings`**: Avaliações de 1 a 5 estrelas e comentários entre parceiros de troca.
5. **`public.reports`**: Sistema de denúncia de anúncios e usuários para moderação de conteúdo (Google Play UGC Compliance).

---

## 📱 3. Recursos de UI/UX e Estrutura Frontend

### Arquitetura de Telas (Expo Router):
- **`app/index.tsx`**: Landing Page de Apresentação (Hero com ilustração 3D, 3 pilares do escambo moderno, botão `COMEÇAR A TROCAR AGORA` e botão de mesmo tamanho em azul claro `INFORME A LOCALIZAÇÃO`).
- **`app/(tabs)/feed.js`**: Feed dinâmico de trocas com busca em tempo real, chips de categorias e seletor de localização (`LocationModal`).
- **`app/(tabs)/publish.js`**: Criação de novo anúncio com upload de fotos e validação de perfil.
- **`app/(tabs)/explore.tsx`**: Painel de conversas e mensagens com ordenação e badge de não lidas.
- **`app/(tabs)/profile.js`**: Gerenciamento de nome, cidade, avatar, termos de uso, política de privacidade e botão de exclusão permanente de dados.
- **`app/product/[id].js`**: Detalhes completos do item para troca, reputação do anunciante, proposta de troca e denúncia.
- **`app/chat.js`**: Negociação em tempo real com avaliação por estrelas ao concluir a troca.

### Componentes Chave:
- **`components/BrandLogo.tsx`**: Logotipo oficial com a seta UP e elo circular com gradiente azul/ciano.
- **`components/LocationModal.tsx`**: Modal com busca por País, Estado, Município ou Bairro e cidades em destaque.
- **`components/TradeCard.js`**: Card responsivo (horizontal no desktop web e vertical no mobile).

---

## 🛡️ 4. Políticas de Segurança e Google Play Store

1. **Cadastro Progressivo (Navegação Livre):**
   - Usuários podem navegar, pesquisar e ver detalhes de todos os produtos sem cadastro prévio.
   - Ao tentar **Propor Troca** ou **Publicar**, o app exibe modal convidando a preencher Nome e Cidade.
2. **Conformidade UGC (Conteúdo Gerado pelo Usuário):**
   - Modais de denúncia em anúncios e chat (`/api/reports`).
   - Bloqueio de usuários indesejados localmente.
   - Rota de exclusão permanente de conta e dados (`DELETE /api/users/{user_id}`).
3. **Assets Oficiais da Loja:**
   - Ícone do App: `assets/images/playstore_icon_512.png` (512x512 px).
   - Banner de Destaque: `assets/images/playstore_feature_graphic.png` (1024x500 px, sem marcas d'água).
   - Pacote de Produção: [TrokaUp .aab](https://expo.dev/artifacts/eas/Vswhk8uL7hdzjhnUDlUo5chSUKs07tdgKaGosX80Nes.aab).

---

*Documento gerado e mantido por Antigravity (Gravi) em parceria com Edmilton.*
