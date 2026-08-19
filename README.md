# Treino da Jennifer

App de treino instalável na tela inicial do celular (PWA). Dois planos de treino com
três divisões cada, marcação de exercícios, progresso do dia e histórico semanal
automático. Tudo salvo no próprio aparelho — sem login, sem servidor, funciona offline.

## Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | markup das duas telas e meta tags de PWA do iOS |
| `styles.css` | tema (verde escuro com destaque dourado) |
| `data.js` | os dois planos: 2 x 3 treinos x 5 exercícios |
| `app.js` | estado, persistência, progresso e histórico |
| `sw.js` | service worker: cache do app para abrir offline |
| `manifest.webmanifest` | nome, cores e ícones do app instalado |
| `tools/gen-icons.mjs` | gera os PNGs de `icons/` sem dependências |

## Rodar localmente

```
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. O service worker funciona em `localhost` mesmo sem HTTPS.

## Publicar no GitHub Pages

```
git push origin main
```

Habilitar o Pages uma vez (Settings > Pages, branch `main`, pasta raiz) ou via CLI:

```
gh api -X POST repos/oviniciusdovale/treinojennifer/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

URL final: <https://oviniciusdovale.github.io/treinojennifer/>

Todos os caminhos do projeto são relativos (`./`) justamente porque o app não fica na
raiz do domínio, e sim em `/treinojennifer/`.

**Ao publicar uma mudança**, subir o número da versão em `sw.js` (`CACHE = "treino-v1"`).
Sem isso o celular continua servindo a versão antiga do cache.

## Instalar no iPhone

1. Abrir a URL no **Safari** (o Chrome do iOS não instala PWA)
2. Botão Compartilhar
3. Adicionar à Tela de Início

O app passa a abrir em tela cheia, sem barra de endereço.

## Como funciona o histórico

O treino entra no histórico de duas formas:

- **Automático**: ao marcar o quinto exercício
- **Manual**: botão "Finalizar treino", para quando ela não conseguir fazer todos
  (máquina ocupada, tempo curto) e ainda assim quiser contar o dia

Um treino só gera um registro por dia — refinalizar atualiza o registro existente em vez
de duplicar. O botão "Reiniciar treino de hoje" (dois toques, para evitar acidente) limpa
as marcações **e** remove o registro daquele dia, já que o treino recomeçou do zero.

## Onde os dados ficam

No `localStorage` do próprio navegador/app:

| Chave | Conteúdo |
|---|---|
| `tj.marcados.<data>.<plano>.<treino>` | exercícios marcados naquele dia |
| `tj.historico` | lista de treinos concluídos |
| `tj.ultimoPlano` / `tj.ultimoTreino` | onde ela parou |

Consequência: o histórico é **local**. Ele não vai junto ao trocar de celular, e apagar os
dados do site no Safari apaga o histórico.

## Sobre os exercícios de core

A Jennifer tem diástase abdominal em recuperação. Os exercícios de core dos dois planos
foram escolhidos por serem seguros nessa condição — ativação de transverso, anti-extensão e
anti-rotação (dead bug, bird dog, prancha lateral modificada). **Nada de crunch ou prancha
completa sem controle.** Manter essa mesma lógica ao adicionar exercícios de core em `data.js`.
