# Integração do portfólio com o NT Studio CMS — Etapa 1

Esta etapa conecta somente a seção **Formação**. O restante do portfólio continua estático e funcionando normalmente.

## 1. Execute a query no Supabase

Nome da query:

`Portfolio - Public Education Access`

Arquivo:

`supabase/01-portfolio-public-education.sql`

## 2. Configure a conexão pública

Abra:

`js/config/portfolio-config.js`

Preencha:

- `supabaseUrl`: Project URL do Supabase.
- `supabaseAnonKey`: chave `anon` / `publishable` do projeto.
- `ownerUserId`: opcional. Pode ficar vazio enquanto houver apenas um usuário no CMS.

Nunca coloque a chave `service_role` nesse arquivo.

## 3. Publique uma formação

No CMS, cadastre uma formação e defina o status como `Publicado`.

## 4. Teste localmente

Como o código utiliza módulos JavaScript, abra o projeto por um servidor local. Exemplos:

- extensão Live Server do VS Code;
- `npx serve .`;
- servidor local equivalente.

Não abra o `index.html` diretamente pelo protocolo `file://`.

## Comportamento seguro

Se o Supabase não estiver configurado, estiver indisponível ou não houver registros publicados, os cartões estáticos atuais permanecem visíveis. Dessa forma, esta integração não deixa a seção vazia nem quebra o restante do site.
