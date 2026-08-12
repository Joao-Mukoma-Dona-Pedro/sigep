# Modelagem da Base de Dados - SIGEP

Este documento define a primeira fase da modelagem de dados do SIGEP, limitada a:

- Professores
- Turmas
- Alunos
- Disciplinas como estrutura minima de suporte

Os modulos Planificacoes, Controlo de Aulas, PCT (Provas Comuns Trimestrais), Ocorrencias, Reunioes e Relatorios serao modelados posteriormente.

## 1. Entidades

### Disciplina

Entidade minima necessaria para evitar duplicacao textual de disciplinas em professores, turmas e futuros modulos.

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| id | BigAutoField | Sim | Chave primaria |
| nome | CharField(120) | Sim | Nome da disciplina |
| codigo | CharField(20) | Nao | A confirmar se a escola utiliza codigo oficial |
| estado | CharField(10) | Sim | Ativo/Inativo |
| observacao | TextField | Nao | Observacoes administrativas |
| created_at | DateTimeField | Sim | Auditoria tecnica |
| updated_at | DateTimeField | Sim | Auditoria tecnica |

### Professor

Entidade para gestao pedagogica dos professores.

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| id | BigAutoField | Sim | Chave primaria |
| nome | CharField(150) | Sim | Nome completo |
| telefone | CharField(30) | Nao | Contacto telefonico |
| email | EmailField | Nao | Unico quando informado |
| data_entrada | DateField | Nao | Data de entrada na escola |
| estado | CharField(10) | Sim | Ativo/Inativo |
| observacao | TextField | Nao | Observacoes pedagogicas |
| created_at | DateTimeField | Sim | Auditoria tecnica |
| updated_at | DateTimeField | Sim | Auditoria tecnica |

Campos a confirmar para versoes futuras:

- Numero mecanografico ou codigo interno do professor.
- Grau academico/formacao.
- Categoria profissional.

### Turma

Entidade para organizacao das turmas acompanhadas pelo Gabinete Pedagogico.

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| id | BigAutoField | Sim | Chave primaria |
| classe | CharField(20) | Sim | Ex.: 10, 11, 12 |
| sala | CharField(30) | Sim | Ex.: A, B, C ou sala fisica |
| periodo | CharField(20) | Sim | Manha/Tarde/Noite |
| ano_lectivo | CharField(20) | Sim | Ex.: 2026 |
| turno | CharField(30) | Nao | Preservado porque aparece na referencia original; significado a confirmar |
| capacidade | PositiveSmallIntegerField | Nao | Capacidade da turma |
| diretor_turma | ForeignKey(Professor) | Nao | Professor responsavel pela turma |
| estado | CharField(10) | Sim | Ativo/Inativo |
| observacao | TextField | Nao | Observacoes administrativas |
| created_at | DateTimeField | Sim | Auditoria tecnica |
| updated_at | DateTimeField | Sim | Auditoria tecnica |

Campos a confirmar:

- Diferenca real entre periodo e turno.
- Se o Diretor de Turma e obrigatorio no registo inicial.

### Aluno

Entidade para acompanhamento pedagogico dos alunos.

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| id | BigAutoField | Sim | Chave primaria |
| turma | ForeignKey(Turma) | Sim | Turma atual do aluno |
| numero | PositiveIntegerField | Nao | Numero do aluno dentro da turma |
| nome | CharField(150) | Sim | Nome completo |
| data_nascimento | DateField | Nao | Conforme referencia visual |
| sexo | CharField(1) | Nao | M/F; a confirmar se deve incluir outra opcao |
| encarregado_educacao | CharField(150) | Nao | Nome do encarregado |
| telefone_encarregado | CharField(30) | Nao | Contacto do encarregado |
| estado | CharField(10) | Sim | Ativo/Inativo |
| observacao | TextField | Nao | Observacoes pedagogicas |
| created_at | DateTimeField | Sim | Auditoria tecnica |
| updated_at | DateTimeField | Sim | Auditoria tecnica |

Campos a confirmar:

- Numero de processo/matricula.
- Morada.
- Documento de identificacao.
- Historico de transferencias entre turmas.

### Lecionacao

Entidade associativa oficial para representar corretamente a relacao Professor + Disciplina + Turma.

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| id | BigAutoField | Sim | Chave primaria |
| professor | ForeignKey(Professor) | Sim | Professor que leciona |
| disciplina | ForeignKey(Disciplina) | Sim | Disciplina lecionada |
| turma | ForeignKey(Turma) | Sim | Turma onde a disciplina e lecionada |
| ano_lectivo | CharField(20) | Sim | Ano lectivo da associacao |
| estado | CharField(10) | Sim | Ativo/Inativo |
| observacao | TextField | Nao | Observacoes administrativas |
| created_at | DateTimeField | Sim | Auditoria tecnica |
| updated_at | DateTimeField | Sim | Auditoria tecnica |

## 2. Relacionamentos

### Professor -> Disciplina -> Turma

Relacionamento associativo oficial da primeira fase.

Um professor pode lecionar varias disciplinas em varias turmas. Uma disciplina pode ser lecionada por varios professores em varias turmas.

Implementacao:

- `Lecionacao.professor = ForeignKey(Professor)`
- `Lecionacao.disciplina = ForeignKey(Disciplina)`
- `Lecionacao.turma = ForeignKey(Turma)`
- `Lecionacao.ano_lectivo = CharField(20)`

Decisao aprovada:

- `Professor.disciplinas` foi removido para evitar duplicacao de relacionamento.
- `Lecionacao` e a fonte oficial para responder: Professor X leciona Disciplina Y na Turma Z.

### Turma -> Aluno

Relacionamento um-para-muitos.

Uma turma possui varios alunos. Um aluno pertence a uma turma atual.

Implementacao:

- `Aluno.turma = ForeignKey(Turma)`

### Professor -> Turma como Diretor de Turma

Relacionamento opcional um-para-muitos.

Um professor pode ser diretor de varias turmas ao longo do tempo ou em anos diferentes. Uma turma possui no maximo um diretor de turma atual.

Implementacao:

- `Turma.diretor_turma = ForeignKey(Professor, null=True, blank=True)`

## 3. Representacao textual

A estrutura real nao e uma cadeia linear simples. A representacao correta e:

```text
Professor
   |\
   | \-- pode ser Diretor de Turma --> Turma
   |
   `-- Lecionacao -- Disciplina
          |
          `-- Turma
                |
                `-- Aluno
```

Forma resumida:

```text
Professor
   |
Lecionacao
   |
Disciplina + Turma
                 |
               Aluno
```

## 4. Regras de negocio iniciais

- O SIGEP acompanha a turma atual do aluno nesta primeira fase.
- Aluno deve pertencer a uma turma.
- Aluno.numero e opcional e unico dentro da turma quando informado.
- Professor pode existir sem turma associada.
- Turma pode existir sem diretor de turma definido no momento do registo.
- Disciplina deve existir como entidade minima para evitar repeticao textual.
- Lecionacao e a unica fonte oficial da relacao Professor + Disciplina + Turma.
- Lecionacao deve impedir duplicacao da mesma combinacao professor/disciplina/turma/ano lectivo.
- Estados iniciais: Ativo e Inativo.

## 5. Chaves primarias

- Todas as entidades usam `id` como chave primaria automatica.
- Codigos funcionais como numero de aluno, codigo de disciplina ou numero interno de professor ficam a confirmar.

## 6. Chaves estrangeiras

- `Turma.diretor_turma -> Professor`
- `Aluno.turma -> Turma`
- `Lecionacao.professor -> Professor`
- `Lecionacao.disciplina -> Disciplina`
- `Lecionacao.turma -> Turma`

## 7. Restricoes

- `Disciplina.nome` unico.
- `Disciplina.codigo` unico apenas quando informado.
- `Professor.email` unico apenas quando informado.
- `Turma` unica por `classe`, `sala`, `periodo` e `ano_lectivo`.
- `Aluno.numero` unico por `turma` quando informado.
- `Lecionacao` unica por `professor`, `disciplina`, `turma` e `ano_lectivo`.

## 8. Decisoes preservadas temporariamente

- `Turma.periodo` e `Turma.turno` permanecem no modelo porque ambos aparecem na referencia original do SIGEP.
- O significado exato de cada campo ainda deve ser definido antes de regras de validacao mais fortes.

## 9. Campos opcionais

Campos opcionais nesta fase por nao estarem suficientemente definidos:

- Codigo interno do professor.
- Grau academico do professor.
- Categoria profissional do professor.
- Numero de processo do aluno.
- Morada do aluno.
- Documento de identificacao do aluno.
- Historico de alteracao de turma.
- Regras oficiais de codificacao de disciplinas.
