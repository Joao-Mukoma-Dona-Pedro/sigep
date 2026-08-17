# Analises de Desempenho das PCT

Este documento descreve a primeira fase do backend de analise das PCT (Provas Comuns Trimestrais).

## Fonte dos dados

As analises sao calculadas em tempo real a partir de `ResultadoPCT`.

Contexto da prova:

```text
ResultadoPCT -> PCT -> Lecionacao -> Professor / Disciplina / Turma / Ano Lectivo
```

Contexto do aluno:

```text
ResultadoPCT -> Aluno -> Turma -> Classe
```

Nao existem tabelas de metricas agregadas nesta fase.

## Endpoints

Todos os endpoints exigem JWT e `IsAuthenticated`.

```text
GET /api/pct-analises/individual/
GET /api/pct-analises/turma/
GET /api/pct-analises/classe/
GET /api/pct-analises/ano-lectivo/
```

## Filtros

Individual:

```text
ano_lectivo, aluno, disciplina, trimestre, pct
```

Turma:

```text
ano_lectivo, classe, turma, disciplina, trimestre, pct
```

Classe:

```text
ano_lectivo, classe, disciplina, trimestre, pct
```

Ano lectivo:

```text
ano_lectivo, trimestre, classe, disciplina, pct
```

## Regras matematicas

Media:

```text
soma das notas existentes / quantidade de notas existentes
```

Evolucao:

```text
valor atual - valor anterior
```

Diferencas entre PCTs:

```text
PCT2 - PCT1
PCT3 - PCT2
PCT3 - PCT1
```

Ausencia de nota nunca e convertida em zero.

## Dados incompletos

As respostas incluem avisos quando:

- nao existem resultados para os filtros;
- o lancamento esta parcial;
- nao existem alunos/PCT suficientes para calcular cobertura.

A cobertura e calculada sempre que houver uma quantidade esperada de resultados.

## Estrutura geral das respostas

As respostas incluem:

- `filtros`: filtros aplicados;
- `resumo`: media, maior nota, menor nota e quantidades;
- listas de evolucao/comparacao conforme o nivel;
- `avisos`: mensagens sobre dados insuficientes ou parciais.

Nao ha regras de aprovacao/reprovacao nem classificacao automatica nesta fase.
