# Banco de dados do portfólio público

A fonte canônica do banco pertence ao repositório **NT Studio CMS**.

Migration final:

```text
supabase/migrations/20260801_02_public_portfolio_api_final.sql
```

Este projeto público não deve manter uma segunda definição das funções:

- `get_public_portfolio_content(uuid)`
- `get_public_portfolio_theme(text, uuid)`
- `get_public_portfolio_builder(uuid)`

A migration final:

- bloqueia todo o conteúdo quando o perfil está privado;
- remove `user_id` e `storage_path` do retorno público;
- retorna apenas projetos e conteúdos publicados;
- fornece somente as configurações públicas necessárias do Google Analytics.
