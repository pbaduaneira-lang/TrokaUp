# 🚀 TrokaUp - Documentação Técnica Oficial & Registro de Produção

Documento central de engenharia, arquitetura, histórico de compilações, infraestrutura em nuvem e publicação do projeto **TrokaUp**.

---

## 📌 1. Identidade & Registro Oficial

| Item | Valor Oficial |
| :--- | :--- |
| **Nome da Plataforma** | **TrokaUp** |
| **Slogan Oficial** | *Transforme o que você tem no que você quer. Escambo moderno & sustentável.* |
| **Identificador do Pacote Android** | `com.trokaup.app` |
| **Versão Atual de Lançamento** | `1.0.0` (**versionCode 6**) |
| **EAS Project ID (Expo)** | `c034a9d3-bdc5-4116-8a7e-1d07aed5bce0` |
| **Conta Expo EAS** | `edmiltondefacio` (`pbaduaneira@gmail.com`) |
| **Keystore Oficial de Produção** | `Build Credentials 69aDtGY9fe` (SHA1: `98:AF:E3:48:E9:73:F6:3B:0C:C8:BB:2B:5A:CF:94:3F:54:CF:B9:A3`) |
| **Repositório Oficial no GitHub** | [https://github.com/pbaduaneira-lang/TrokaUp](https://github.com/pbaduaneira-lang/TrokaUp) |
| **Ambiente Web / Vercel** | [https://trokaup.vercel.app](https://trokaup.vercel.app) |
| **URL Oficial da Política de Privacidade** | `https://trokaup.vercel.app/privacy` *(e rota nativa `/privacy`)* |

---

## 📦 2. Registro do Pacote de Produção (.aab)

| Propriedade | Detalhe |
| :--- | :--- |
| **Arquivo Local** | `c:\Trokaup\TrokaUp-v1.0.0-build6.aab` |
| **Tamanho** | ~58.8 MB (58.800.107 bytes) |
| **Build ID no Expo** | `636e2133-3b6e-4124-95f3-43be46e874ad` |
| **Link Direto de Download** | [https://expo.dev/artifacts/eas/TBh1WQVMuxYRn1sIUkah4ucdsHkWnN0ZymsYYdydiQQ.aab](https://expo.dev/artifacts/eas/TBh1WQVMuxYRn1sIUkah4ucdsHkWnN0ZymsYYdydiQQ.aab) |
| **Painel de Builds** | [https://expo.dev/accounts/edmiltondefacio/projects/trokaup/builds](https://expo.dev/accounts/edmiltondefacio/projects/trokaup/builds) |

---

## 🗄️ 3. Infraestrutura de Banco de Dados (Supabase PostgreSQL)

O banco de dados opera na nuvem da AWS (São Paulo - `sa-east-1`) via Supabase, com suporte a *Connection Pooling* na porta 6543 e SSL.

- **Projeto Supabase:** `xfwvkjxpomynvoyylxhx` (São Paulo - `sa-east-1`)
- **String de Conexão Oficial:**
  `postgresql://postgres.xfwvkjxpomynvoyylxhx:trokaupedju1016@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`

### Esquema de Tabelas:
1. **`public.products`**: Anúncios de itens para troca (título, descrição, quer_em_troca, imagem_url, cidade, usuario_id, categoria, ativo, criado_em).
2. **`public.mensagens`**: Mensagens de texto trocadas em tempo real via chat (remetente_id, destinatario_id, texto, lida, produto_id, criado_em).
3. **`public.users`**: Perfis de usuários e cidades registradas.
4. **`public.ratings`**: Avaliações de 1 a 5 estrelas e comentários entre parceiros de troca.
5. **`public.reports`**: Sistema de denúncia de anúncios e usuários para moderação de conteúdo (Google Play UGC Compliance).

---

## 📱 4. Arquitetura de Telas & Frontend (Expo Router)

- **`app/index.tsx`**: Landing Page de Apresentação (Hero 3D, pilares da plataforma e links diretos da Política de Privacidade e Termos de Uso).
- **`app/privacy.tsx`**: Tela nativa dedicada de Política de Privacidade em conformidade total com LGPD e Google Play Data Safety.
- **`app/(tabs)/feed.js`**: Feed dinâmico com busca em tempo real, chips de categorias e seletor geográfico (`LocationModal`).
- **`app/(tabs)/publish.js`**: Cadastro de itens para troca com upload de imagens.
- **`app/(tabs)/explore.tsx`**: Painel de conversas e mensagens com ordenação e badge de não lidas.
- **`app/(tabs)/profile.js`**: Gerenciamento de perfil, links de termos/privacidade e botão de **Exclusão Permanente de Conta e Dados**.
- **`app/product/[id].js`**: Detalhes completos do item, proposta de troca e modal de denúncia.
- **`app/chat.js`**: Negociação em tempo real com avaliação por estrelas ao concluir a troca.

---

## 🛡️ 5. Google Play Store & Conformidade

1. **Política de Privacidade:**
   - URL cadastrada na seção *Conteúdo do app*: `https://trokaup.vercel.app/privacy`.
2. **UGC & Moderação de Conteúdo:**
   - Modais de denúncia em anúncios e no chat vinculados à tabela `public.reports` e endpoint `/api/reports`.
3. **Exclusão de Conta e Dados:**
   - Rota `DELETE /api/users/{user_id}` para exclusão total e irrevogável de dados a pedido do usuário.
4. **Assets Gráficos Oficiais:**
   - Ícone do App: `assets/images/playstore_icon_512.png` (512x512 px).
   - Banner de Destaque: `assets/images/playstore_feature_graphic.png` (1024x500 px).

---

## 🤝 6. Diretrizes de Atendimento & Padrão de Trabalho
- **Fluxo de Release:**
  1. Compilar pacote de produção assinado com a Keystore Oficial (`Build Credentials 69aDtGY9fe`).
  2. Fornecer o link direto de download do `.aab` para o usuário e armazenar a cópia local.
  3. Aguardar a confirmação de download pelo usuário.
  4. Instruir passo a passo a publicação e revisão no Google Play Console.

---

*Documento mantido por Antigravity (Gravi) em parceria contínua com Edmilton.*
