# Última Letra — Jornada

Extraia o ZIP e abra **index.html**. Funciona localmente e offline, sem instalar dependências.

## Visual do menu

A moldura gigante foi removida. Em telas de pelo menos 1000px de largura e 651px de altura, o menu usa uma composição em duas colunas: arte tipográfica geométrica em SVG, texto contextual, nível e pontuação à esquerda; conteúdo interativo à direita. O fundo recebeu um brilho discreto e os cards têm acabamento e seleção mais claros. A arte é local e não requer internet. Em telas menores, é ocultada para priorizar os controles. As abas mantêm a mesma área e continuam sem rolagem. A aparência ainda precisa de conferência em navegador.

## Painel uniforme entre abas

Todas as abas do menu agora compartilham o mesmo cabeçalho compacto, largura e painel central adaptado à viewport. A rolagem é bloqueada em todo o menu. A escolha de categorias fica centralizada no painel, sem necessidade de banner ou imagem externa. Conquistas e recompensas mostram dois itens por página, com anterior/próxima, preservando todos os itens. Apoio e Plus usam duas subabas no mesmo painel.

A verificação automatizada cobre a paginação completa e a preservação dos desbloqueios. O encaixe visual ainda precisa ser conferido em navegador, especialmente em telas pequenas.

## Menu inicial em uma tela

A aba Jogar foi compactada: título menor, categorias apenas com ícone e nome, controles de dificuldade e início, além de tutorial e troca de usuário. O placar grande, os textos repetidos e o bloco duplicado de regras não aparecem nessa aba. A viewport fica travada ao abrir Jogar; todas as abas usam o mesmo painel sem rolagem, com paginação nas listas. A conferência visual em navegador permanece pendente.

## Menu didático, tutorial e resultado sem rolagem

- A tela inicial após identificação mostra apenas os desafios. As abas Minha jornada, Conquistas, Ranking, Recompensas e Apoio/Plus mostram uma área por vez.
- O botão “Como jogar? Ver tutorial” apresenta quatro passos: escolha do desafio, letras, tambor e jornada. É possível voltar aos desafios a qualquer momento.
- Em telas altas, o painel de jogo pode crescer até 740px e os blocos têm intervalos maiores. O teclado continua junto ao conteúdo, sem margem automática.
- Resultado usa uma viewport travada com abas Resumo, Conquistas e recompensas e Parceiro demonstrativo. O rodapé da página não aparece nessa tela, e os botões de continuar ficam em uma linha própria.
- Novos desbloqueios são resumidos; a lista completa continua no menu. O Plus oculta a aba de anúncio.
- A conferência visual em navegador continua pendente; os testes de fluxo cobrem navegação e preservação do progresso.

## Ajuste de espaçamento do jogo

O teclado não é mais empurrado para o fundo do painel por uma margem automática. Palavra, progresso, tentativas e teclado ficam agrupados no topo, e o painel de desktop tem altura máxima de 640px (740px em telas altas), respeitando a altura disponível na viewport. As regras e os perfis não foram alterados. Ajuste conferido no CSS; conferência visual em navegador permanece pendente.

## Revisão de UX/UI — 14/10/2026

- Mantém a identidade escura com amarelo, os perfis e as regras existentes.
- A categoria selecionada tem marca de seleção textual e um resumo com dificuldade e quantidade de palavras.
- Menu e resultado mostram o progresso até a próxima recompensa e o próximo bônus por sequência.
- O resultado apresenta imediatamente pontos totais, sequência, atividade de sete dias e posição no ranking demonstrativo.
- O botão de apoio abre/recolhe o placeholder de QR Code, sem cobrança.
- No layout de celular em retrato, o gatilho ocupa uma área própria ao lado do tambor, sem sobreposição intencional.
- Nenhum serviço externo, pagamento ou dependência foi adicionado. A verificação visual em navegador continua pendente, conforme a seção de testes.

## O que mudou

A versão mantém o modo roleta e acrescenta identificação local, nove categorias, teclado QWERTY, barra de descoberta, pontuação, níveis, sequências, evolução visual, conquistas e recompensas demonstrativas.

Os arquivos principais continuam sendo `index.html`, `style.css` e `script.js`. Não foi adicionado framework, backend, serviço de anúncios ou pagamento. O scaffold Vite anterior permanece no pacote, mas não é necessário para jogar.

## Jornada

1. Informe nome e apelido opcional; ou continue com um perfil salvo.
2. Escolha Geral, Filmes, Música, Tecnologia, Esportes, Gastronomia, Viagens, Cultura ou Negócios.
3. Escolha dificuldade e inicie o desafio.
4. Acerte letras no teclado físico ou virtual. A barra conta posições descobertas, incluindo repetições.
5. Cada erro exige acionar o tambor; a primeira câmara é segura. Uma posição entre 2 e 6 é fatal, sorteada no início e mantida durante a partida.
6. Complete a palavra para vencer. O resultado mostra pontos, atividade, sequência e novos desbloqueios, antes de oferecer outra partida ou retorno ao menu.

O jogador pode habilitar o som no painel do tambor. Letras acentuadas são comparadas à letra base; C revela Ç. Letras repetidas e entradas inválidas não penalizam.

## Perfis e persistência

- Os perfis ficam no `localStorage`, sob `ultima-letra.jornada.v1`.
- Cada um possui nome, apelido, categoria, dificuldade, pontuação, placar, sequências, atividade, conquistas, recompensas e preferência Plus independentes.
- Trocar usuário permite criar outro perfil ou continuar um existente. Não é autenticação: qualquer pessoa que use o navegador pode escolher um perfil local.
- O primeiro perfil herda o placar de vitórias e derrotas da versão anterior. A jornada começa do zero, sem transformar esse histórico em pontos ou recompensas.
- A versão não apaga as chaves de placar antigas.
- Fechar ou recarregar uma partida em andamento conta como abandono na próxima abertura: uma derrota, sem pontos ou prêmios. Partidas não são retomadas pela metade.
- Reiniciar ou encerrar durante a partida conta como derrota. Encerrar pelo botão pede confirmação; reiniciar segue o comportamento anterior.
- Zerar placar limpa apenas os contadores de vitórias/derrotas deste perfil, mantendo a jornada. A confirmação explica isso.
- Se o armazenamento falhar, um aviso informa que os dados só durarão a sessão. Para manter o histórico, use o mesmo navegador e origem/local do arquivo. Limpar dados do navegador apaga os perfis.

## Progressão centralizada em CONFIG

| Regra | Fácil | Médio | Difícil |
|---|---:|---:|---:|
| Pontos base por vitória | 40 | 120 | 260 |
| Pontos por letra correta distinta | 2 | 5 | 9 |
| Atividade extra por vitória | 8 | 16 | 28 |
| Marcos por vitória | 1 | 2 | 4 |

- Bônus de vitória: 5 pontos por vitória anterior na sequência, limitado a 50.
- Cada 500 pontos concede um nível. Pontos de acerto e vitória são creditados uma única vez ao finalizar.
- Uma partida concluída com pelo menos uma tentativa rende 2 pontos de atividade, além de 1 por letra correta distinta e do bônus de vitória. Abandonos não dão pontos de jogo nem de atividade.
- Erro zera a sequência atual de letras. Derrota ou abandono zera a sequência de vitórias. Pontos e conquistas já obtidos permanecem.
- Marcos são um contador de vitórias ponderadas, não uma moeda. Recompensas surgem aos 5, 10, 25 e 50 marcos; sequências de 3, 7 e 14 vitórias concedem benefícios adicionais. Cada marco só desbloqueia uma vez.
- A jornada visual avança nos níveis 1, 3, 5, 8 e 12.
- Saúde Cognitiva é um **indicador lúdico de atividade**, não clínico. A barra usa os últimos sete dias, com meta ilustrativa de 200 pontos e máximo visual de 100%.

## Conquistas

Primeiro acerto; cinco letras corretas seguidas; dez vitórias; cem posições de letras descobertas; dez vitórias no Difícil. As conquistas são avaliadas ao concluir a partida, e a tela de resultado anuncia as novas.

## Demonstrações, sem serviços reais

- Ranking e presença usam o adaptador `DemoData`, com identificação visível de dados simulados. O ranking é geral e combina a pontuação local com participantes fictícios.
- Oportuni Clube mostra benefícios ilustrativos. “Ver recompensa” informa que não existe cupom nem parceiro real.
- O anúncio de exemplo só aparece na tela de resultado. Não há rastreamento, rede publicitária nem link externo.
- Apoio mostra um placeholder escrito, sem QR escaneável ou chave de pagamento.
- Plus é uma preferência local demonstrativa. Ativá-la oculta o anúncio de exemplo; não há cobrança. Os outros benefícios descritos são conceitos futuros.

## Organização didática

- `WORD_BANK` e `CATEGORIES`: dados de palavras e metadados. Para uma categoria nova, forneça nome, ícone, descrição e arrays `facil`, `medio`, `dificil`, com pelo menos duas palavras em cada nível.
- `CONFIG`, `ACHIEVEMENTS`, `DemoData`: regras ajustáveis, metas e dados de demonstração.
- `PlayerStorage`: leitura validada e persistência dos perfis.
- `GameRules`: validação, sorteio e processamento central de letras.
- `progressPlayer` e `unlockRewards`: evolução e desbloqueios.
- Funções `render*`, `showScreen` e eventos: DOM, navegação e entrada do usuário.
- O estado da rodada usa um `Set` para impedir tentativas duplicadas. A guarda `recorded` impede crédito duplo. Reinícios cancelam o temporizador anterior.

## Verificação

Execute com Node.js: `node --test tests/*.cjs`.

**29 testes passaram**, cobrindo regras da roleta, inicialização, identificação, retorno, troca de usuário, seleção de categoria, QWERTY, entradas físicas e virtuais, normalização, repetição, resultado, progressão, níveis, atividade, conquistas, recompensas, Plus, fechamento/reabertura simulados e falhas de armazenamento.

Os testes de fluxo usam DOM simulado e relógio controlado. A estrutura HTML também foi conferida, sem IDs repetidos nem tags desbalanceadas. A sintaxe do JavaScript foi validada.

**Limitação:** não foi possível instalar o navegador de teste. Portanto, a aparência, os alvos de toque e a ausência de rolagem real ainda precisam de conferência visual. A partida usa `100dvh`/`100vh`, `overflow: hidden` e adaptações para celular e paisagem; o menu pode rolar; o resultado usa abas na viewport. O build Vite não foi executado.

Sugestão para conferência manual: desktop 1440×900, tablet 768×1024, celular 375×667 e 320×568, paisagem 812×375. Verifique se palavra, risco, botão de gatilho e todas as teclas permanecem visíveis durante a partida.
