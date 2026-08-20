# SIGEP - Gateway Autenticado das Ferramentas do Assistente

## Objectivo

A Fase B.2 cria uma ponte HTTP autenticada entre o frontend e as ferramentas internas do Assistente SIGEP.

Ainda não existe integração com fornecedor de IA. O fluxo actual é apenas:

```text
React
  -> POST /api/assistant/query/
  -> JWT
  -> allowlist de ferramentas
  -> validação de argumentos
  -> ferramenta interna
  -> PostgreSQL
  -> dados reais
```

## Endpoint

```text
POST /api/assistant/query/
```

O endpoint exige autenticação JWT e utilizador com perfil administrativo pedagógico.

## Payload

Ferramenta sem argumentos:

```json
{
  "tool": "school_summary",
  "arguments": {}
}
```

Ferramenta com filtros:

```json
{
  "tool": "pct_results",
  "arguments": {
    "ano_lectivo": "2026",
    "turma_id": 4,
    "disciplina_id": 2,
    "trimestre": "1"
  }
}
```

Análise PCT:

```json
{
  "tool": "pct_analysis",
  "arguments": {
    "analysis_type": "turma",
    "filters": {
      "ano_lectivo": "2026",
      "classe": "10",
      "turma": 4
    }
  }
}
```

## Ferramentas Permitidas

O gateway só executa ferramentas presentes em `ASSISTANT_READ_TOOLS`.

Ferramentas disponíveis:

- `school_summary`
- `professores_summary`
- `professor`
- `professor_activity`
- `disciplinas_summary`
- `disciplina`
- `turmas_summary`
- `turma`
- `alunos_summary`
- `aluno`
- `leccionacoes_summary`
- `leccionacoes`
- `planificacoes_summary`
- `planificacoes`
- `controlo_aulas_summary`
- `controlo_aulas`
- `pct_summary`
- `pct_results`
- `pct_analysis`
- `ocorrencias_summary`
- `ocorrencias`
- `reunioes_summary`

Não existe execução por `getattr`, `eval`, `exec`, import dinâmico ou SQL livre.

## Validação de Argumentos

Ferramentas de resumo não aceitam argumentos inesperados.

Ferramentas individuais exigem o respectivo identificador:

- `professor_id`
- `disciplina_id`
- `turma_id`
- `aluno_id`

Ferramentas com filtros aceitam apenas chaves explícitas:

- `professor`
- `professor_id`
- `disciplina`
- `disciplina_id`
- `turma`
- `turma_id`
- `ano_lectivo`
- `trimestre`
- `data_inicio`
- `data_fim`
- `pct`
- `pct_id`
- `aluno`
- `aluno_id`
- `classe`
- `categoria`
- `tipo`
- `tipo_id`

Chaves perigosas são rejeitadas, incluindo:

- `sql`
- `raw_sql`
- `command`
- `code`
- `python`
- `eval`
- `exec`
- `import`
- `importlib`
- `__import__`

## Resposta

Sucesso:

```json
{
  "ok": true,
  "data": {},
  "warnings": [],
  "metadata": {
    "source": "sigep",
    "generated_at": "...",
    "tool": "school_summary",
    "duration_ms": 12.4
  }
}
```

Erro:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_ARGUMENTS",
    "message": "Argumentos nao permitidos."
  }
}
```

## Códigos HTTP

- `200`: ferramenta executada correctamente.
- `400`: payload, ferramenta ou argumentos inválidos.
- `401`: utilizador não autenticado.
- `403`: utilizador sem permissão administrativa pedagógica.
- `404`: recurso solicitado não encontrado.
- `429`: limite temporário de chamadas atingido.
- `500`: erro interno sem exposição de traceback.

## Logging

O gateway regista apenas informação técnica mínima:

- id do utilizador;
- ferramenta chamada;
- sucesso/erro;
- duração aproximada.

Não regista passwords, tokens, API keys, credenciais ou dados pessoais completos.

## Limites

Foi criado um limite simples por utilizador:

```text
60 chamadas por 60 segundos
```

As próprias ferramentas também limitam listas internas para evitar respostas grandes.

## Segurança

O gateway:

- exige JWT;
- exige perfil pedagógico administrativo;
- usa allowlist explícita;
- valida argumentos;
- não aceita SQL;
- não executa código Python enviado pelo cliente;
- não cria, altera ou elimina registos;
- não envia dados a serviços externos;
- não expõe stack traces ao cliente.

## Exemplos de Teste Manual

Resumo geral:

```json
{
  "tool": "school_summary",
  "arguments": {}
}
```

Resumo PCT:

```json
{
  "tool": "pct_summary",
  "arguments": {}
}
```

Resumo de alunos:

```json
{
  "tool": "alunos_summary",
  "arguments": {}
}
```

