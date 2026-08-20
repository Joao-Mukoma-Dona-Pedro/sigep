# SIGEP - Ferramentas Internas do Assistente IA

## Objectivo

Este documento descreve a Fase B.1 do Assistente SIGEP: uma camada backend de ferramentas internas, somente leitura, para consultas controladas aos dados reais do SIGEP.

Não há integração com IA externa nesta fase.

## Estrutura Criada

```text
backend/assistant/
  __init__.py
  permissions.py
  schemas.py
  tools.py
  tests.py
```

Esta estrutura é um pacote Python reutilizável, não uma app Django com Models. A decisão evita migrations e mantém a camada isolada.

## Regras de Segurança

- Todas as ferramentas são somente leitura.
- Nenhuma ferramenta aceita SQL como argumento.
- Nenhuma ferramenta executa SQL arbitrário.
- Nenhuma ferramenta cria, edita ou apaga dados.
- Todas as ferramentas exigem utilizador autenticado.
- A lista de ferramentas permitidas é explícita em `ASSISTANT_READ_TOOLS`.
- Não é permitido executar funções por nomes livres fornecidos pelo utilizador.
- Dados pessoais são minimizados nos retornos.

## Estrutura de Resposta

Sucesso:

```json
{
  "ok": true,
  "data": {},
  "warnings": [],
  "metadata": {
    "source": "sigep",
    "generated_at": "..."
  }
}
```

Erro controlado:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_FILTER",
    "message": "..."
  },
  "metadata": {
    "source": "sigep",
    "generated_at": "..."
  }
}
```

## Ferramentas Disponíveis

### `school_summary`

Resumo geral do SIGEP.

Dados:

- professores;
- disciplinas;
- turmas;
- alunos;
- planificações;
- controlo de aulas;
- PCT;
- ocorrências;
- reuniões.

### `professores_summary`

Resumo dos professores.

Retorna:

- total;
- activos;
- inactivos.

### `professor`

Argumento:

- `professor_id`

Retorna:

- id;
- nome;
- estado;
- quantidade de leccionações;
- quantidade de planificações;
- quantidade de controlo de aulas;
- quantidade de PCT.

### `professor_activity`

Argumento:

- `professor_id`

Retorna actividade pedagógica agregada do professor.

### `disciplinas_summary`

Retorna:

- total;
- activas;
- inactivas.

### `disciplina`

Argumento:

- `disciplina_id`

Retorna dados essenciais da disciplina e número de leccionações.

### `turmas_summary`

Retorna:

- total;
- distribuição por classe;
- distribuição por ano lectivo.

### `turma`

Argumento:

- `turma_id`

Retorna:

- turma;
- classe;
- sala;
- ano lectivo;
- período;
- turno;
- quantidade real de alunos;
- director de turma.

### `alunos_summary`

Retorna:

- total;
- distribuição por turma;
- distribuição por classe.

### `aluno`

Argumento:

- `aluno_id`

Retorna apenas contexto necessário:

- nome;
- número;
- turma;
- classe;
- estado;
- total de resultados PCT;
- total de ocorrências.

Não retorna telefone do encarregado, data de nascimento ou outros dados pessoais não necessários.

### `leccionacoes_summary`

Retorna:

- total;
- distribuição por professor;
- distribuição por disciplina;
- distribuição por turma;
- distribuição por ano lectivo.

### `leccionacoes`

Filtros controlados:

- `professor_id`;
- `disciplina_id`;
- `turma_id`;
- `ano_lectivo`.

Valida incompatibilidade entre turma e ano lectivo.

### `planificacoes_summary`

Retorna:

- total;
- entregues;
- não entregues;
- pendentes;
- registos sem leccionação;
- distribuição por professor.

Usa a relação:

```text
Planificação -> Leccionação -> Professor / Disciplina / Turma / Ano Lectivo
```

### `planificacoes`

Filtros controlados:

- `professor_id`;
- `disciplina_id`;
- `turma_id`;
- `ano_lectivo`;
- `trimestre`.

### `controlo_aulas_summary`

Retorna:

- total;
- aulas assistidas;
- aulas não assistidas;
- distribuição por professor;
- disciplina;
- turma;
- período.

### `controlo_aulas`

Filtros controlados:

- `professor_id`;
- `disciplina_id`;
- `turma_id`;
- `ano_lectivo`;
- `data_inicio`;
- `data_fim`.

Não cria horários.

### `pct_summary`

Retorna:

- total de PCT;
- distribuição por trimestre;
- distribuição por ano lectivo;
- PCT com resultados;
- PCT sem resultados;
- PCT parcialmente lançadas;
- PCT completamente lançadas.

O estado das notas é calculado a partir de `ResultadoPCT`, não apenas pelo campo `nota_lancada`.

### `pct_results`

Filtros controlados:

- `pct`;
- `aluno`;
- `turma`;
- `classe`;
- `disciplina`;
- `trimestre`;
- `ano_lectivo`.

Nunca transforma ausência de nota em zero.

### `pct_analysis`

Argumentos:

- `analysis_type`;
- filtros da análise.

Tipos suportados:

- `individual`;
- `turma`;
- `classe`;
- `ano_lectivo`.

Reutiliza a lógica oficial de `backend/pct/analytics.py`.

### `ocorrencias_summary`

Retorna:

- total;
- distribuição por categoria;
- distribuição por tipo;
- distribuição por turma;
- distribuição por período.

### `ocorrencias`

Filtros controlados:

- `aluno_id`;
- `turma_id`;
- `categoria`;
- `tipo_id`;
- `professor_id`;
- `data_inicio`;
- `data_fim`.

Quando a consulta não é individual, o nome do aluno não é retornado.

### `reunioes_summary`

Filtros:

- `data_inicio`;
- `data_fim`.

Retorna:

- total;
- distribuição por período;
- assuntos;
- decisões registadas.

## Ferramentas Proibidas

Não existem e não devem ser criadas nesta fase:

- ferramenta de SQL livre;
- ferramenta de criação de aluno;
- ferramenta de edição de notas;
- ferramenta de eliminação de PCT;
- ferramenta de alteração de planificações;
- ferramenta de envio de dados para IA externa;
- ferramenta de execução dinâmica de funções.

## Uso Futuro

Na Fase B.2, uma camada de Assistente poderá chamar apenas funções presentes em `ASSISTANT_READ_TOOLS`, depois de validar utilizador, intenção e filtros.

O modelo de IA deverá receber apenas os dados estruturados retornados por estas ferramentas e transformar esses dados em linguagem natural, sem inventar informação.

