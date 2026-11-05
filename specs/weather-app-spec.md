# Especificação do Produto — SDD Weather App

## Overview

Aplicação web de previsão do tempo para consultas individuais, sem autenticação. Permite buscar e selecionar uma cidade, consultar suas condições meteorológicas atuais e a previsão diária para cinco dias, além de alternar a unidade de temperatura entre Celsius e Fahrenheit.

A experiência prioriza consultas rápidas em dispositivos móveis e também atende quem planeja atividades para os próximos dias. A interface será em pt-BR. A fonte de dados adotada para a primeira versão é a Open-Meteo, sem chave de API. Para esta especificação, “cinco dias” significa hoje e os quatro dias seguintes.

## Functional Requirements

- **RF1 — Buscar cidade:** permitir que a pessoa pesquise uma cidade pelo nome e veja resultados que possam ser diferenciados por estado/região e país quando disponíveis.
- **RF2 — Selecionar cidade:** permitir selecionar um resultado para consultar os dados daquela localidade e identificar claramente a cidade selecionada.
- **RF3 — Exibir clima atual:** para a cidade selecionada, apresentar temperatura, condição meteorológica, umidade, vento, pressão e precipitação, quando os dados estiverem disponíveis.
- **RF4 — Exibir previsão de cinco dias:** apresentar um resumo diário para hoje e os quatro dias seguintes, incluindo temperaturas mínima e máxima, condição meteorológica e precipitação, quando disponíveis.
- **RF5 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit. Todas as temperaturas do clima atual e da previsão devem refletir a unidade escolhida. A unidade inicial é Celsius.
- **RF6 — Comunicar estados da consulta:** informar carregamento, ausência de resultados/dados e falha ao pesquisar ou carregar dados. Em caso de falha recuperável, oferecer uma ação para tentar novamente.

## User Stories

- **US1 — Consulta rápida:** Como pessoa que decide o dia a dia, quero buscar e selecionar minha cidade para consultar o clima atual e decidir como me preparar para o dia.
- **US2 — Planejamento:** Como viajante planejador, quero consultar a previsão de cinco dias para organizar atividades e deslocamentos.
- **US3 — Unidade familiar:** Como viajante planejador, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas com facilidade.
- **US4 — Uso móvel:** Como pessoa que consulta o clima pelo celular, quero usar os mesmos recursos em uma tela pequena para tomar decisões em movimento.
- **US5 — Recuperação de falhas:** Como pessoa que decide o dia a dia, quero receber uma mensagem clara e poder tentar novamente para entender e recuperar uma consulta que falhou.

## Acceptance Criteria

### RF1 — Buscar cidade (US1)

- **Dado** que a pessoa informou um nome de cidade válido, **quando** realizar a busca, **então** a aplicação apresenta resultados correspondentes com contexto de localização disponível para distinguir homônimos.
- **Dado** que a pessoa informou um nome sem resultados correspondentes, **quando** realizar a busca, **então** a aplicação informa que nenhuma cidade foi encontrada.

### RF2 — Selecionar cidade (US1, US2)

- **Dado** que há resultados de busca, **quando** a pessoa selecionar uma cidade, **então** a aplicação identifica essa localidade como selecionada e apresenta os dados meteorológicos correspondentes.
- **Dado** que os dados da cidade selecionada estão sendo carregados, **quando** a consulta ainda não terminou, **então** a aplicação comunica o estado de carregamento.

### RF3 — Exibir clima atual (US1)

- **Dado** que uma cidade foi selecionada e os dados atuais estão disponíveis, **quando** a consulta terminar, **então** a aplicação apresenta temperatura, condição, umidade, vento, pressão e precipitação.
- **Dado** que um ou mais desses dados não estão disponíveis, **quando** a aplicação apresenta o clima atual, **então** informa a indisponibilidade do campo sem impedir a leitura dos demais dados.

### RF4 — Exibir previsão de cinco dias (US2)

- **Dado** que uma cidade foi selecionada e a previsão está disponível, **quando** os dados forem apresentados, **então** a aplicação mostra exatamente cinco dias: hoje e os quatro dias seguintes.
- **Dado** que os dados de um dia estão disponíveis, **quando** a previsão diária for apresentada, **então** ela inclui mínimas, máximas, condição meteorológica e precipitação.
- **Dado** que um dado de previsão não está disponível, **quando** a aplicação apresenta aquele dia, **então** informa a indisponibilidade sem ocultar os outros dias ou interromper a tela.

### RF5 — Alternar unidade (US3)

- **Dado** que as temperaturas estão apresentadas em Celsius, **quando** a pessoa selecionar Fahrenheit, **então** todas as temperaturas do clima atual e da previsão passam a ser apresentadas em Fahrenheit.
- **Dado** que as temperaturas estão apresentadas em Fahrenheit, **quando** a pessoa selecionar Celsius, **então** todas as temperaturas do clima atual e da previsão passam a ser apresentadas em Celsius.
- **Dado** que a aplicação foi aberta sem uma preferência anterior definida, **quando** as temperaturas forem apresentadas, **então** a unidade exibida é Celsius.

### RF6 — Estados da consulta (US5)

- **Dado** que a busca ou consulta meteorológica está em andamento, **quando** os dados ainda não estiverem disponíveis, **então** a aplicação apresenta um estado de carregamento.
- **Dado** que a fonte de dados ou a rede retorna uma falha, **quando** a consulta não puder ser concluída, **então** a aplicação apresenta uma mensagem compreensível e uma ação de nova tentativa.
- **Dado** que a busca foi concluída sem resultados, **quando** a aplicação apresentar o resultado, **então** comunica o estado vazio sem confundi-lo com falha de rede.

### RNF1 — Responsividade (US4)

- **Dado** que a aplicação é aberta em uma tela de 320 px ou maior, **quando** a pessoa usa busca, seleção, consulta e alternância de unidade, **então** os controles e informações permanecem legíveis e utilizáveis sem perda das ações principais.

## Non-Functional Requirements

- **RNF1 — Responsividade:** experiência mobile-first, utilizável a partir de 320 px de largura até telas desktop.
- **RNF2 — Acessibilidade:** fluxos principais navegáveis por teclado; controles com nomes e rótulos compreensíveis por tecnologias assistivas; foco visível e contraste de texto compatível com WCAG AA básico.
- **RNF3 — Desempenho:** a carga inicial deve levar menos de 2 segundos em uma conexão típica. O tempo máximo para busca e consulta meteorológica ainda precisa de definição (ver Open Questions).
- **RNF4 — Resiliência:** falhas de rede ou da fonte de dados não devem travar a interface; o estado resultante deve ser comunicado e, quando aplicável, permitir nova tentativa.
- **RNF5 — Localização:** interface e mensagens em português do Brasil; datas, condições e unidades devem ser apresentadas de forma compreensível nesse contexto.
- **RNF6 — Fonte de dados:** usar Open-Meteo para geocodificação e previsão, sem exigir chave de API.
- **RNF7 — Compatibilidade:** a aplicação deve funcionar em navegadores modernos (evergreen); a lista exata de navegadores e versões permanece em aberto.

## Edge Cases

| Caso | Comportamento esperado |
| --- | --- |
| Campo de busca vazio ou contendo apenas espaços | Não iniciar uma busca; manter a orientação para informar uma cidade. |
| Cidade inexistente ou busca sem resultados | Apresentar estado vazio informativo, sem indicar falha de serviço. |
| Cidades homônimas | Apresentar contexto disponível, como estado/região e país, para ajudar na seleção correta. |
| Nome com acentos ou caracteres especiais | Tratar a entrada sem quebrar a busca; se não houver correspondência, apresentar estado vazio. |
| Falha de rede durante busca ou consulta meteorológica | Apresentar erro compreensível e ação para tentar novamente. |
| Consulta que não termina dentro do tempo esperado | Encerrar a espera com mensagem de falha recuperável e oferecer nova tentativa; o limite de tempo depende da decisão registrada em Open Questions. |
| Resposta meteorológica parcial ou campo ausente | Indicar que o dado específico não está disponível e manter visíveis as demais informações. |
| Falha ao obter previsão, mas busca de cidade concluída | Comunicar a falha da previsão sem apresentar a cidade como inexistente. |
| Alternância entre unidades com temperaturas visíveis | Atualizar todas as temperaturas de clima atual e previsão para a unidade selecionada. |

## Assumptions

- O produto é para uso individual e não requer conta ou autenticação.
- A pessoa tem acesso à internet na maioria das consultas.
- A pessoa seleciona a cidade pela busca; geolocalização automática não faz parte da primeira versão.
- A interface da primeira versão será em pt-BR.
- A unidade inicial é Celsius e a previsão de cinco dias inclui hoje e os quatro dias seguintes.
- O conteúdo diário da previsão inclui mínima, máxima, condição e precipitação; a primeira versão não inclui previsão horária.
- Os campos de clima atual seguem o conjunto definido nesta especificação: temperatura, condição, umidade, vento, pressão e precipitação.
- A cidade e a unidade não terão persistência em servidor; persistência local entre sessões ainda não foi decidida.
- Os critérios de 2 segundos, 320 px, navegadores evergreen e WCAG AA básico são os alvos de referência do workshop e devem ser confirmados como metas do produto.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Open-Meteo indisponível, lenta ou limitando consultas | Média | Alto | Apresentar estados claros de erro/carregamento, permitir nova tentativa e revisar limites e disponibilidade da fonte antes da entrega. |
| Seleção de cidade homônima incorreta | Alta | Médio | Exibir estado/região e país quando disponíveis nos resultados e identificar a localidade selecionada. |
| Falha de rede durante a consulta | Média | Médio | Não travar a interface, comunicar a falha e oferecer nova tentativa; definir se dados antigos poderão ser usados. |
| Dados com atualização, data ou fuso horário mal interpretados | Média | Alto | Identificar a cidade e esclarecer como a data/período dos dados é apresentado; decidir como comunicar a atualização dos dados. |
| Conversão ou alternância inconsistente de unidades | Baixa | Alto | Exigir atualização de todas as temperaturas em ambos os painéis e validar os casos de Celsius e Fahrenheit nos critérios de aceite. |
| Controles ou conteúdo difíceis de usar em telas pequenas | Média | Médio | Validar os fluxos principais em telas móveis, incluindo largura mínima de 320 px e interação por toque/teclado. |

## Out of Scope

- Autenticação, contas de usuário ou sincronização de preferências em servidor.
- Geolocalização automática.
- Favoritos, histórico de cidades ou persistência entre sessões na primeira versão, enquanto a decisão de persistência local estiver em aberto.
- Previsão horária ou intradiária.
- Idiomas além de pt-BR.
- Notificações push, alertas meteorológicos ou recomendações personalizadas.
- Garantia de uso offline; comportamento com dados em cache permanece em aberto.

## Open Questions

1. **A cidade e a unidade escolhidas devem persistir localmente após fechar ou recarregar a aplicação?** Impacto: define a continuidade entre visitas e expectativas de privacidade. Não haverá persistência em servidor.
2. **Em caso de falha de rede após uma consulta bem-sucedida, deve ser apresentada a última informação disponível?** Impacto: melhora a continuidade, mas dados antigos podem ser confundidos com condições atuais; se forem exibidos, sua idade precisa estar clara.
3. **Como e com que precisão a aplicação deve informar a atualização dos dados e o fuso horário da cidade?** Impacto: evita que dados desatualizados ou datas locais sejam interpretados incorretamente.
4. **Quais são os tempos máximos aceitáveis para busca de cidade e consulta meteorológica?** Impacto: sem limites, os estados de timeout e as metas de desempenho não são totalmente verificáveis.
5. **Quais navegadores e versões específicos devem ser suportados além do alvo geral de navegadores evergreen?** Impacto: define a matriz de compatibilidade e testes.
6. **A busca deve apresentar resultados enquanto a pessoa digita ou apenas após uma ação explícita, e há limite de resultados?** Impacto: altera o fluxo de seleção, a velocidade percebida e a desambiguação.