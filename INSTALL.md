# Sprint A3 — Integração do Site Público com Aparência e Site Builder

## O que este pacote faz

O site público passa a aplicar as configurações salvas no Portfolio CMS:

- ordem e visibilidade das seções;
- layout do Hero;
- avatar, currículo, contato e redes sociais;
- estilo estrutural de cards, botões e navbar;
- largura e espaçamento;
- 2, 3 ou 4 colunas de projetos;
- paginação de projetos;
- filtros de categoria;
- tecnologias, cliente e data;
- visual de habilidades em cards, barras ou lista;
- agrupamento de habilidades;
- texto e controles do rodapé;
- tema público;
- novos campos e slides dos projetos.

## Instalação

1. Execute no SQL Editor do Supabase:

`modified/supabase/20260731_06_public_portfolio_content_rpc.sql`

2. Copie o conteúdo de `modified/` para a raiz do projeto do site público.

3. Abra o site por um servidor local, não diretamente como `file://`.

Exemplo com VS Code Live Server ou:

```powershell
python -m http.server 5500
```

4. Atualize `js/config/portfolio-config.js` somente se for necessário indicar
explicitamente o proprietário:

```javascript
ownerUserId: "UUID_DO_USUARIO"
```

Com apenas um perfil público, o SQL consegue selecionar automaticamente o
registro mais recente.

## Arquivos alterados

- `js/services/portfolio-api.js`
- `js/modules/builder.js`
- `js/modules/projects.js`
- `js/modules/skills.js`
- `css/theme.css`

## Observação

O pacote não altera a identidade visual base do site. Ele adiciona classes e
comportamentos para que o frontend obedeça ao CMS.
