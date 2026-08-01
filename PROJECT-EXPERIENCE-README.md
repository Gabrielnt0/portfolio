# ONRONT Project Experience v0.8.0

## Recursos incluídos
- Carrossel profissional nos cards de projetos.
- Autoplay com pausa no hover/foco.
- Setas, indicadores, teclado e gesto de arrastar.
- Fallback automático para projetos sem slides.
- Página individual em `project.html?slug=nome-do-projeto`.
- Galeria em tela ampla, informações, links e navegação entre projetos.
- SEO dinâmico básico por projeto.

## Estrutura de dados aceita
O portfólio reconhece slides em `project.slides` ou `project.project_slides` e os campos:
- `image_url` (preferencial)
- `url`
- `src`
- `alt_text`
- `alt`
- `sort_order`

A imagem de capa (`project.image_url`) é incluída como primeiro item e URLs duplicadas são removidas.

## Teste
1. Publique ao menos um projeto com dois ou mais slides.
2. Abra `index.html` e teste setas, dots, teclado e swipe.
3. Clique em **Ver detalhes**.
4. Confirme a galeria, links e navegação entre projetos.
