# SIGEP - Arquitectura Futura do Assistente IA

## 1. Objectivo

Este documento prepara a arquitectura técnica para uma futura integração do Assistente IA do SIGEP.

Nesta fase não existe implementação de IA, chat, novos Models, migrations, SDKs ou alterações funcionais. O objectivo é definir onde a IA deverá encaixar, que dados poderá consultar e quais regras deverão proteger a coerência pedagógica e a privacidade do sistema.

O Assistente IA será uma ferramenta de apoio ao Subdirector ou Director Pedagógico. A primeira versão deverá ser de consulta, análise e explicação, sem escrita directa de dados.

## 2. Arquitectura Actual

O SIGEP funciona actualmente com a arquitectura:

```text
React
  -> Axios com JWT
  -> Django REST Framework
  -> PostgreSQL
```

As rotas autenticadas do frontend estão protegidas por `ProtectedRoute` e renderizadas dentro de `DashboardLayout`.

O backend expõe APIs REST protegidas por autenticação JWT. Os módulos principais já possuem ViewSets, serializers, paginação, filtros e validações próprias.

## 3. Arquitectura Pedagógica Actual

```text
Professor
  -> Leccionação
       -> Disciplina
       -> Turma
       -> Ano Lectivo
            -> Planificação
            -> Controlo de Aulas
            -> PCT
                 -> ResultadoPCT
                 -> Análise PCT

Turma
  -> Aluno

Aluno
  -> ResultadoPCT
  -> Ocorrência

Tipo de Ocorrência
  -> Ocorrência

Reunião
  -> registo administrativo independente

Relatórios
  -> consultas consolidadas dos módulos anteriores
```

Esta estrutura deve ser respeitada pelo futuro Assistente IA. A IA não deve criar relações paralelas nem duplicar dados já derivados de `Leccionação`.

## 4. Models Relevantes

- `Professor`: identificação e estado dos professores.
- `Disciplina`: disciplinas leccionadas.
- `Turma`: classe, sala, turno, período, ano lectivo e director de turma.
- `Aluno`: aluno pertencente a uma Turma.
- `Lecionacao`: relação oficial entre Professor, Disciplina, Turma e Ano Lectivo.
- `Planificacao`: entrega de planificações associada a uma Leccionação.
- `ControloAula`: registo simples de aula assistida, associado a uma Leccionação.
- `PCT`: Provas Comuns Trimestrais, associadas a uma Leccionação.
- `ResultadoPCT`: nota de um Aluno numa PCT.
- `TipoOcorrencia`: classificação das ocorrências.
- `Ocorrencia`: ocorrência de um Aluno, registada por Professor.
- `Reuniao`: reuniões pedagógicas e decisões.
- Relatórios e análise PCT: camada de consolidação e cálculo.

## 5. APIs Actuais Relevantes

O futuro Assistente IA deverá consultar dados através do backend, nunca directamente no PostgreSQL.

APIs já existentes que poderão ser reutilizadas:

- `/api/professores/`
- `/api/disciplinas/`
- `/api/turmas/`
- `/api/alunos/`
- `/api/lecionacoes/` e `/api/leccionacoes/`
- `/api/planificacoes/`
- `/api/controlo-aulas/`
- `/api/pct/`
- `/api/pct/analise/`, conforme endpoints existentes do módulo PCT
- `/api/ocorrencias/`
- `/api/tipos-ocorrencias/`
- `/api/reunioes/`
- `/api/relatorios/...`
- `/api/dashboard/`

Para a IA, recomenda-se não expor estas APIs directamente ao modelo. O backend deverá criar uma camada própria de ferramentas controladas.

## 6. Arquitectura Futura Recomendada

```text
React
  -> AssistantWidget global
  -> AssistantPanel global
  -> assistantService
  -> Django /api/assistente/
  -> Camada de intenções e ferramentas controladas
  -> Services de consulta pedagógica
  -> PostgreSQL
  -> Provedor IA
  -> Resposta explicada ao Director
```

O modelo de linguagem deverá receber apenas dados já filtrados, autorizados e resumidos pelo backend.

## 7. Integração Frontend

O melhor local para integrar o futuro botão flutuante é:

```text
frontend/src/layouts/DashboardLayout.jsx
```

Motivo:

- todas as páginas autenticadas passam por `DashboardLayout`;
- o assistente não aparece em Login ou Recuperação de Palavra-passe;
- a posição e estado do widget permanecem globais durante a navegação;
- evita duplicação em cada página.

Componentes futuros recomendados:

- `frontend/src/components/assistant/AssistantWidget.jsx`
- `frontend/src/components/assistant/AssistantPanel.jsx`
- `frontend/src/context/AssistantContext.jsx`
- `frontend/src/services/assistantService.js`
- `frontend/src/hooks/useDraggableAssistant.js`

Nesta etapa estes ficheiros não foram criados.

## 8. Botão Flutuante

O botão deverá iniciar discreto no canto inferior direito.

Regras futuras:

- posição fixa sobre o layout autenticado;
- arrastável com rato em desktop;
- arrastável com toque em mobile/tablet;
- nunca sair completamente do ecrã;
- manter margem mínima das bordas;
- adaptar-se a mudanças de resolução;
- preservar posição entre páginas;
- não ocupar espaço permanente da sidebar, navbar ou área principal.

## 9. Arrastar no Desktop e Mobile

Desktop:

- usar eventos `pointerdown`, `pointermove`, `pointerup`;
- evitar depender apenas de eventos de rato;
- usar `Pointer Events` para unificar rato, toque e caneta.

Mobile/tablet:

- usar os mesmos `Pointer Events`;
- impedir que o botão fique por baixo da navbar ou fora da área visível;
- aplicar limites com base em `window.innerWidth`, `window.innerHeight` e tamanho do botão.

Ao terminar o arrasto, a posição deve ser normalizada e guardada.

## 10. Estado Global

Recomendação:

- `React Context` para estado aberto/fechado, mensagens temporárias e contexto da página.
- `localStorage` apenas para posição do botão e preferências não sensíveis.
- Não guardar conversas sensíveis em `localStorage`.
- Se houver histórico persistente, deve ser guardado no backend com regras claras de privacidade e retenção.

Estados futuros:

- `isOpen`;
- `position`;
- `currentPageContext`;
- `conversationId`;
- `messages`;
- `isLoading`;
- `error`.

## 11. Contexto da Página

O assistente deverá conhecer a rota actual, mas não ficar limitado a ela.

Exemplos:

- `/professores`: contexto Professores.
- `/turmas`: contexto Turmas.
- `/alunos`: contexto Alunos.
- `/planificacoes`: contexto Planificações.
- `/controlo-aulas`: contexto Controlo de Aulas.
- `/pct`: contexto PCT.
- `/analise-pct`: contexto Análise PCT.
- `/ocorrencias`: contexto Ocorrências.
- `/relatorios`: contexto Relatórios.

No frontend, o contexto pode ser derivado de `useLocation()` e enviado ao backend em cada pergunta.

O backend deverá interpretar:

- rota actual;
- filtros activos, se forem enviados;
- permissões do utilizador autenticado;
- intenção da pergunta.

## 12. Fluxo da Pergunta

```text
Director escreve pergunta
  -> Frontend envia pergunta + contexto da rota
  -> Django autentica via JWT
  -> Backend identifica intenção
  -> Backend escolhe ferramenta controlada
  -> Backend consulta dados reais
  -> Backend calcula valores críticos
  -> Provedor IA recebe dados mínimos e validados
  -> IA redige explicação
  -> Frontend mostra resposta
```

## 13. Fluxo da Resposta

A resposta deve separar:

- factos consultados;
- cálculos realizados pelo backend;
- interpretação pedagógica;
- limitações dos dados.

Exemplo de regra:

```text
Se existirem resultados para 18 de 30 alunos, responder:
"Existem resultados lançados para 18 de 30 alunos. A análise ainda é parcial."
```

Nunca completar os 12 resultados em falta com estimativas.

## 14. Regras Contra Alucinação

A futura IA deve obedecer às seguintes regras:

- não inventar professores, alunos, turmas, notas ou ocorrências;
- não criar estatísticas sem consulta real;
- não assumir dados em falta;
- declarar quando os dados são insuficientes;
- informar quando uma análise é parcial;
- usar cálculos feitos pelo backend sempre que possível;
- responder "não existem dados suficientes" quando aplicável.

## 15. Segurança

O provedor IA nunca deve ter acesso directo ao PostgreSQL.

Não permitir:

- SQL arbitrário gerado pelo modelo;
- escrita directa de dados;
- eliminação de registos;
- alteração de notas, alunos, professores, PCT ou ocorrências;
- chamadas livres a qualquer endpoint.

A arquitectura deve usar uma camada de ferramentas controladas no backend.

Exemplos de ferramentas futuras seguras:

- `obter_totais_dashboard()`;
- `analisar_desempenho_pct(filtros)`;
- `listar_planificacoes_pendentes(filtros)`;
- `resumir_ocorrencias(filtros)`;
- `obter_relatorio_turma(filtros)`.

Cada ferramenta deve validar permissões, filtros e limites antes de consultar dados.

## 16. Protecção de Dados Pessoais

Dados sensíveis no SIGEP:

- nomes de alunos;
- datas de nascimento;
- encarregados de educação;
- telefones;
- notas;
- ocorrências disciplinares;
- observações pedagógicas;
- dados de professores;
- decisões de reuniões.

Princípio recomendado:

Enviar ao provedor IA apenas os dados necessários para responder.

Exemplos:

- Para calcular média de turma, enviar média, quantidade de alunos e cobertura; não enviar nomes completos se não forem necessários.
- Para identificar alunos abaixo da média, enviar apenas a lista estritamente necessária e a justificação.
- Para ocorrências, evitar detalhes sensíveis quando um resumo estatístico for suficiente.

## 17. Escrita de Dados

Primeira versão recomendada:

```text
Consulta + Análise + Explicação
```

Não permitir na primeira versão:

- criar aluno;
- criar professor;
- alterar notas;
- apagar PCT;
- alterar planificações;
- eliminar ocorrências;
- modificar reuniões;
- actualizar dados críticos.

Qualquer escrita futura deverá exigir confirmação explícita do Director e auditoria.

## 18. Backend Recomendado

Futura estrutura possível:

```text
backend/
  assistente/
    views.py
    serializers.py
    services/
      intent_router.py
      tools.py
      context_builder.py
      safety.py
      provider.py
```

Responsabilidades:

- `views.py`: endpoint autenticado do assistente.
- `serializers.py`: validação da pergunta e contexto.
- `intent_router.py`: identificar tipo de pergunta.
- `tools.py`: consultas controladas aos módulos do SIGEP.
- `context_builder.py`: preparar dados mínimos para IA.
- `safety.py`: regras contra dados inventados e exposição excessiva.
- `provider.py`: integração futura com fornecedor IA.

Não criar esta app antes da aprovação da implementação.

## 19. Endpoints Futuros Possíveis

Primeira versão:

- `POST /api/assistente/perguntar/`

Payload possível:

```json
{
  "mensagem": "Como está o desempenho da 10.ª A?",
  "rota": "/analise-pct",
  "filtros": {
    "ano_lectivo": "2026",
    "trimestre": "2",
    "turma": 1
  }
}
```

Resposta possível:

```json
{
  "resposta": "...",
  "dados_usados": {
    "fonte": "ResultadoPCT",
    "quantidade_resultados": 28,
    "quantidade_alunos": 30,
    "analise_parcial": true
  }
}
```

Endpoints auxiliares só devem ser criados se forem realmente necessários.

## 20. Provedor IA

Ainda não deve ser escolhido definitivamente.

Critérios de decisão:

- custo por utilização;
- privacidade dos dados;
- capacidade de receber contexto estruturado;
- suporte a ferramentas controladas;
- limites de tokens;
- facilidade de integração com Django;
- política de retenção de dados;
- fiabilidade em português.

Não instalar SDK antes desta decisão.

## 21. Tipos de Perguntas e Dados Necessários

Gerais:

- totais de professores, turmas e alunos;
- fonte: dashboard, professores, turmas, alunos.

PCT:

- desempenho por aluno, turma, classe, disciplina e ano lectivo;
- fonte: PCT, ResultadoPCT, `pct.analytics`.

Planificações:

- entregas e pendências por Leccionação, professor, disciplina, turma e trimestre;
- fonte: Planificacao -> Lecionacao.

Controlo de Aulas:

- aulas assistidas e não assistidas;
- fonte: ControloAula -> Lecionacao.

Ocorrências:

- ocorrências por aluno, turma, tipo, categoria e período;
- fonte: Ocorrencia, TipoOcorrencia, Aluno, Turma.

Relatórios:

- resumos consolidados por módulo;
- fonte: endpoints de Relatórios e services internos.

## 22. Decisões Pendentes

Antes de implementar a IA, é necessário aprovar:

1. Provedor IA.
2. Política de privacidade e retenção de conversas.
3. Se o histórico de conversa será persistente ou apenas temporário.
4. Quais perguntas serão suportadas na primeira versão.
5. Quais ferramentas backend serão criadas primeiro.
6. Se a IA poderá citar nomes de alunos em respostas ou apenas estatísticas.
7. Limites de dados por pergunta.
8. Se haverá registo/auditoria das perguntas feitas.
9. Texto de aviso ao utilizador sobre uso de IA.
10. Estratégia de custos e limites de utilização.

## 23. Recomendação de Primeira Implementação Futura

Começar por uma versão pequena:

1. Botão flutuante global em `DashboardLayout`.
2. Painel simples de conversa.
3. Endpoint único autenticado.
4. Ferramentas apenas de leitura.
5. Suporte inicial a perguntas sobre:
   - totais gerais;
   - análise PCT;
   - planificações pendentes;
   - ocorrências por turma/categoria.
6. Sem escrita de dados.
7. Sem SQL livre.
8. Sem exposição desnecessária de dados pessoais.

