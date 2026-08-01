# Banco de dados do portfólio público

A definição canônica da função pública agora pertence ao repositório **NT Studio CMS**:

```text
supabase/migrations/20260801_01_public_portfolio_release_candidate.sql
```

Não mantenha uma segunda definição de `get_public_portfolio_content(uuid)` neste projeto.
Isso evita diferenças de privacidade e schema entre o CMS e o site público.
