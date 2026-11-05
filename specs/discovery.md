# Discovery — Aplicação de Previsão do Tempo

## Contexto

O briefing solicita uma aplicação web de previsão do tempo que permita buscar cidades, consultar o clima atual e a previsão para cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis. O objetivo é apoiar decisões rápidas do dia a dia e o planejamento dos próximos dias.

A experiência deve funcionar tanto para quem quer uma consulta rápida pelo celular quanto para quem planeja atividades com alguns dias de antecedência. O briefing não define fonte de dados, nível de detalhe da previsão, localidades e idiomas suportados ou regras de persistência; as decisões adotadas para destravar o treinamento estão registradas em **Decisões**.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que a pessoa informe o nome de uma cidade e selecione a localidade desejada quando houver resultados correspondentes.
- **RF2 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e apresentar as temperaturas na unidade escolhida.
- **RF5 — Informar estados da consulta:** comunicar quando os dados estão carregando, quando não há dados para apresentar ou quando a consulta falha, oferecendo uma forma de tentar novamente quando aplicável.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** oferecer uma experiência utilizável em dispositivos móveis e em telas maiores, sem perda de conteúdo ou das ações principais.
- **RNF2 — Acessibilidade:** permitir navegação por teclado, usar rótulos e controles compreensíveis por tecnologias assistivas e manter contraste legível.
- **RNF3 — Desempenho:** apresentar resultados em tempo adequado para consultas de clima e busca de cidades; o limite aceitável ainda precisa ser definido.
- **RNF4 — Resiliência:** lidar com indisponibilidade da rede ou da fonte de dados sem deixar a pessoa sem explicação sobre o resultado da consulta.
- **RNF5 — Clareza:** apresentar nomes de localidades, unidades e mensagens de erro de forma compreensível e consistente.
- **RNF6 — Compatibilidade:** funcionar nos navegadores e versões de dispositivos que forem definidos como suportados.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limitação de requisições da fonte meteorológica | Média | Alto | Comunicar falhas e demora, permitir nova tentativa e avaliar limites e disponibilidade antes de fechar a fonte de dados. |
| Busca retornar cidades homônimas ou uma localidade diferente da pretendida | Alta | Médio | Apresentar informações de contexto, como estado/região e país, para ajudar a pessoa a distinguir resultados. |
| Falha de rede impedir a busca ou atualização da previsão | Média | Médio | Exibir estado de erro claro e oferecer nova tentativa; decidir se dados previamente consultados poderão ser usados. |
| Previsão ou dados atuais serem interpretados com data, horário ou localidade incorretos | Média | Alto | Apresentar a localidade selecionada e esclarecer fuso horário e período dos dados conforme as regras de produto forem definidas. |
| Conversão ou apresentação de Celsius/Fahrenheit divergir entre clima atual e previsão | Baixa | Alto | Definir que a unidade escolhida se aplica a todas as temperaturas e validar consistência nos critérios de aceite. |
| Layout ou controles ficarem difíceis de usar em telas pequenas | Média | Médio | Priorizar o uso móvel e validar os fluxos principais em diferentes larguras de tela e com interação por toque. |

## Perguntas em Aberto (Open Questions)

1. **Quais informações devem aparecer no clima atual e em cada dia da previsão?** Impacto: define o conteúdo necessário para a pessoa decidir e o espaço ocupado nas telas.
2. **A previsão de cinco dias deve mostrar apenas um resumo diário ou também períodos/horários ao longo do dia?** Impacto: altera o nível de detalhe, a leitura e a quantidade de dados apresentada.
3. **Quais países, regiões e idiomas de busca devem ser suportados?** Impacto: influencia a relevância dos resultados e a desambiguação de cidades.
4. **Como a busca deve se comportar enquanto a pessoa digita e quantos resultados deve apresentar?** Impacto: afeta velocidade percebida, facilidade de seleção e tratamento de nomes incompletos.
5. **Quando os dados meteorológicos foram atualizados e como essa informação deve ser comunicada?** Impacto: sem contexto de atualização, dados antigos podem ser confundidos com condições atuais.
6. **A cidade e a unidade escolhidas devem continuar selecionadas após fechar ou recarregar a aplicação?** Impacto: define a expectativa de continuidade entre visitas e o comportamento de privacidade.
7. **Se a rede falhar após uma consulta bem-sucedida, deve ser apresentada a última informação disponível?** Impacto: melhora a continuidade de uso, mas exige deixar clara a idade dos dados para não sugerir que são atuais.
8. **Quais navegadores, versões e tamanhos de tela são oficialmente suportados?** Impacto: determina a abrangência dos testes de compatibilidade e responsividade.
9. **Quais tempos máximos de espera são aceitáveis para buscar uma cidade e carregar o clima?** Impacto: sem limites mensuráveis, não é possível validar a expectativa de desempenho.

## Suposições (Assumptions)

- A aplicação é voltada a consultas individuais, sem necessidade de conta ou autenticação.
- A pessoa terá conexão com a internet para pesquisar cidades e consultar dados atualizados na maioria das vezes.
- A experiência deve priorizar decisões rápidas, especialmente em dispositivos móveis.
- A seleção da unidade deve afetar todas as temperaturas exibidas, tanto no clima atual quanto na previsão.
- Não haverá geolocalização automática na primeira versão; a pessoa escolhe a cidade pela busca.
- Os requisitos não fornecidos sobre desempenho, compatibilidade e conteúdo detalhado ainda são propostas a validar, não compromissos fechados do negócio.

## Personas

- **Pessoa que decide o dia a dia:** consulta rapidamente o clima atual pelo celular para decidir o que vestir ou se precisa levar proteção contra chuva.
- **Viajante planejador:** consulta a previsão dos próximos dias para organizar atividades e deslocamentos.

## Decisões

Decisões adotadas como referência pelo material do módulo 02 do workshop, para permitir que o fluxo SDD avance:

- **Fonte de dados:** Open-Meteo (geocoding e previsão), sem chave de API.
- **Interpretação de cinco dias:** hoje e os quatro dias seguintes.
- **Unidade inicial:** Celsius.
- **Conta e servidor:** sem autenticação e sem persistência de servidor.
- **Idioma da interface:** pt-BR.
- **Geolocalização automática:** fora do escopo da primeira versão.

Essas decisões não resolvem as demais perguntas em aberto, como o nível de detalhe da previsão, a persistência local das preferências e os limites mensuráveis de desempenho.