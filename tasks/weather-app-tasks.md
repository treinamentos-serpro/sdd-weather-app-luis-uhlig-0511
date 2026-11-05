# Backlog de Tarefas — SDD Weather App

Derivado de [plans/weather-app-plan.md](../plans/weather-app-plan.md) e da [especificação](../specs/weather-app-spec.md).

Tipos: **Infra**, **Data**, **UI**, **Test**.

## Convenções transversais

- Componentes: um por arquivo em `src/components/`, com `export default` e props tipadas explicitamente.
- Sem `any`; efeitos colaterais apenas em hooks ou serviços.
- Testes: `tests/unit/*.test.ts(x)` e `tests/e2e/*.spec.ts`; mocks apenas na camada `src/services/`; consultas por role e label.
- Testes cobrem caminho feliz, erro, vazio e conversão de unidade quando aplicável.

## Entrega 1 — Base do projeto

### T-01 — Definir tipos compartilhados do domínio
- **Descrição:** criar `TemperatureUnit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherSnapshot`, `AsyncState` e `WeatherError`.
- **Critérios de aceite:** tipos exportados em `src/types/weather.ts`; campos meteorológicos opcionais aceitam `null`; `pnpm build` sem erros de tipo.
- **Dependências:** nenhuma.
- **Arquivos:** `src/types/weather.ts`.
- **Tipo:** Data. **Requisitos:** RF3, RF4, RF6.

### T-02 — Conversão e formatação de temperatura
- **Descrição:** funções puras de Celsius para Fahrenheit e formatação pt-BR.
- **Critérios de aceite:** 0 °C = 32 °F e 100 °C = 212 °F; `null` retorna indisponível.
- **Dependências:** T-01.
- **Arquivos:** `src/lib/temperature.ts`, `src/lib/format.ts`.
- **Tipo:** Data. **Requisitos:** RF5, RNF5.

### T-03 — Mapeamento de códigos meteorológicos
- **Descrição:** `weather_code` para rótulos em pt-BR.
- **Critérios de aceite:** código conhecido retorna rótulo; desconhecido ou `null` retorna rótulo genérico.
- **Dependências:** T-01.
- **Arquivos:** `src/lib/weatherCodes.ts`.
- **Tipo:** Data. **Requisitos:** RF3, RF4, RNF5.

### T-04 — Testes unitários de lib
- **Descrição:** cobrir conversão, formatação e mapeamento.
- **Critérios de aceite:** caminho feliz e conversão C/F; `null`, código desconhecido e vazio; `pnpm test` passa.
- **Dependências:** T-02, T-03.
- **Arquivos:** `tests/unit/temperature.test.ts`, `tests/unit/format.test.ts`, `tests/unit/weatherCodes.test.ts`.
- **Tipo:** Test. **Requisitos:** RF3, RF4, RF5.

## Entrega 2 — Integração com a Open-Meteo

### T-05 — Serviço de geocodificação
- **Descrição:** `searchCities(term)` com `name`, `count=10`, `language=pt`, `format=json`; normaliza para `City[]` com `admin1` e `country`. Busca disparada apenas por envio explícito (Open Question 6).
- **Critérios de aceite:** termo vazio não gera requisição; ausência de `results` retorna lista vazia; falha de rede ou HTTP retorna `WeatherError`.
- **Dependências:** T-01.
- **Arquivos:** `src/services/weatherService.ts`.
- **Tipo:** Data. **Requisitos:** RF1, RF6, RNF6.

### T-06 — Serviço de previsão e clima atual
- **Descrição:** `fetchWeather(city)` com parâmetros do plano (Celsius, km/h, mm, `timezone=auto`, `forecast_days=5`).
- **Critérios de aceite:** exatamente cinco dias; campo ausente vira `null` sem falha total; falhas retornam `WeatherError`.
- **Dependências:** T-01.
- **Arquivos:** `src/services/weatherService.ts`.
- **Tipo:** Data. **Requisitos:** RF2, RF3, RF4, RNF4, RNF6.

### T-07 — Timeout e cancelamento
- **Descrição:** `AbortController` com limites aprovados: 5 s para busca e 10 s para clima, em constantes nomeadas (Open Question 4).
- **Critérios de aceite:** excesso de tempo retorna `{ kind: 'timeout' }`; requisição cancelada não altera estado.
- **Dependências:** T-05, T-06.
- **Arquivos:** `src/services/weatherService.ts`.
- **Tipo:** Data. **Requisitos:** RNF3, RNF4, RF6.

### T-08 — Testes unitários do serviço
- **Descrição:** `fetch` simulado, sem depender da Open-Meteo real.
- **Critérios de aceite:** caminho feliz de cidades e previsão de cinco dias; endpoints e parâmetros verificados; lista vazia, campos ausentes, rede, HTTP, timeout e resposta inválida cobertos.
- **Dependências:** T-05, T-06, T-07.
- **Arquivos:** `tests/unit/weatherService.test.ts`.
- **Tipo:** Test. **Requisitos:** RF1 a RF4, RF6.

## Entrega 3 — Estado e busca

### T-09 — Hook `useWeather`
- **Descrição:** busca, seleção, consulta, unidade e retry; descarta respostas de operações anteriores.
- **Critérios de aceite:** seleção dispara consulta; troca de unidade não dispara requisição; retry repete só a operação que falhou; unidade inicial Celsius.
- **Dependências:** T-05, T-06, T-07.
- **Arquivos:** `src/hooks/useWeather.ts`.
- **Tipo:** Data. **Requisitos:** RF2, RF5, RF6, US5.

### T-10 — Testes do hook
- **Descrição:** transições de estado com serviço simulado.
- **Critérios de aceite:** caminho feliz, erro, vazio e conversão de unidade cobertos; respostas tardias descartadas; unidade não refaz consulta; retries independentes.
- **Dependências:** T-09.
- **Arquivos:** `tests/unit/useWeather.test.tsx`.
- **Tipo:** Test. **Requisitos:** RF5, RF6, RNF4.

### T-11 — Componente de busca
- **Descrição:** campo com label, botão e orientação para entrada vazia.
- **Critérios de aceite:** operável só por teclado; Enter e botão funcionam; entrada vazia não busca.
- **Dependências:** T-09.
- **Arquivos:** `src/components/SearchBar.tsx`.
- **Tipo:** UI. **Requisitos:** RF1, RNF2.

### T-12 — Resultados e seleção de cidade
- **Descrição:** lista com região e país; estado vazio sem mensagem de falha.
- **Critérios de aceite:** homônimos distinguíveis; cidade selecionada identificada visual e acessivelmente; sem resultados mostra estado vazio.
- **Dependências:** T-11.
- **Arquivos:** `src/components/states/EmptyState.tsx`, `src/App.tsx`.
- **Tipo:** UI. **Requisitos:** RF1, RF2, RF6, US1.

## Entrega 4 — Exibição do clima

### T-13 — Clima atual
- **Descrição:** temperatura, condição, umidade, vento, pressão e precipitação.
- **Critérios de aceite:** seis campos quando disponíveis; `null` não oculta os demais; unidade respeitada; horário da observação (`current.time`) no fuso da cidade (Open Question 3).
- **Dependências:** T-02, T-03, T-09.
- **Arquivos:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI. **Requisitos:** RF3, RF5, US1.

### T-14 — Previsão de cinco dias
- **Descrição:** cinco cartões com mínima, máxima, condição e precipitação.
- **Critérios de aceite:** exatamente hoje + quatro dias; dia com dado ausente mantém a data; unidade respeitada.
- **Dependências:** T-02, T-03, T-09.
- **Arquivos:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`.
- **Tipo:** UI. **Requisitos:** RF4, RF5, US2.

### T-15 — Alternância de unidade
- **Descrição:** controle Celsius/Fahrenheit com estado pressionado acessível.
- **Critérios de aceite:** operável por teclado e mouse; padrão Celsius; atualiza todas as temperaturas.
- **Dependências:** T-09.
- **Arquivos:** `src/components/UnitToggle.tsx`.
- **Tipo:** UI. **Requisitos:** RF5, US3, RNF2.

### T-16 — Loading e erro com retry
- **Descrição:** estados separados para busca e clima.
- **Critérios de aceite:** loading anunciado a tecnologias assistivas; erro de clima preserva a cidade; retry executa só a operação que falhou.
- **Dependências:** T-09.
- **Arquivos:** `src/components/states/LoadingState.tsx`, `src/components/states/ErrorState.tsx`.
- **Tipo:** UI. **Requisitos:** RF6, RNF4, US5.

### T-17 — Composição e layout responsivo
- **Descrição:** tela montada em `App.tsx`, mobile-first, tema dark glassmorphism.
- **Critérios de aceite:** sem rolagem horizontal em 320 px; contraste compatível com WCAG AA básico; controles acessíveis por toque e teclado.
- **Dependências:** T-12, T-13, T-14, T-15, T-16.
- **Arquivos:** `src/App.tsx`, `src/styles/index.css`, `tailwind.config.js`.
- **Tipo:** UI. **Requisitos:** RNF1, RNF2, US4.

## Entrega 5 — Testes integrados e qualidade

### T-18 — Testes de componentes
- **Descrição:** Testing Library para busca, seleção, clima, previsão e unidade.
- **Critérios de aceite:** caminhos feliz, erro, vazio e conversão cobertos; estados verificados por roles; troca de unidade sem nova requisição; `pnpm test` passa.
- **Dependências:** T-11 a T-16.
- **Arquivos:** `tests/unit/SearchBar.test.tsx`, `tests/unit/UnitToggle.test.tsx`, `tests/unit/App.test.tsx`.
- **Tipo:** Test. **Requisitos:** RF1 a RF6, RNF2.

### T-19 — Testes E2E com Playwright
- **Descrição:** fluxos principais com a Open-Meteo interceptada.
- **Critérios de aceite:** buscar, selecionar, ver clima e cinco dias, alternar unidade; busca sem resultados; retry; viewport de 320 px; teclado. `pnpm test:e2e` passa.
- **Dependências:** T-17, T-18.
- **Arquivos:** `tests/e2e/weather.spec.ts`.
- **Tipo:** Test. **Requisitos:** US1 a US5, RNF1, RNF2.

### T-20 — Checagem final
- **Descrição:** lint, build e testes.
- **Critérios de aceite:** `pnpm lint`, `pnpm build` e `pnpm test` sem erros.
- **Dependências:** T-19.
- **Arquivos:** nenhum novo.
- **Tipo:** Infra.

## Ordem sugerida

T-01 → (T-02, T-03) → T-04 → (T-05, T-06) → T-07 → T-08 → T-09 → T-10 → (T-11, T-15, T-16) → T-12 → (T-13, T-14) → T-17 → T-18 → T-19 → T-20.

## Fora do backlog

Decisões aprovadas (Open Questions da spec):

- Persistência local: não há; cidade e unidade não são salvas (unidade inicial Celsius).
- Dados antigos em falha: não exibidos; mostra erro com nova tentativa.
- Atualização e fuso: horário da observação e datas no fuso retornado pela API (`timezone=auto`).
- Limites de tempo: 5 s para busca e 10 s para clima.
- Navegadores: duas últimas versões de Chrome, Edge, Firefox e Safari.
- Busca: envio explícito (Enter ou botão), no máximo 10 resultados, sem busca enquanto digita.
