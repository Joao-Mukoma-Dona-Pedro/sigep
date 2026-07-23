# Estrutura do SIGEP

O SIGEP segue arquitetura Cliente-Servidor, com frontend e backend separados.

## Frontend

- `frontend/src`: codigo-fonte React.
- `frontend/public`: ficheiros publicos servidos pelo Vite.
- `frontend/components`: reserva para componentes reutilizaveis.
- `frontend/pages`: reserva para paginas ou vistas.
- `frontend/layouts`: reserva para layouts da aplicacao.
- `frontend/services`: reserva para integracoes externas e cliente HTTP.
- `frontend/hooks`: reserva para hooks React reutilizaveis.
- `frontend/assets`: reserva para imagens, icones e outros recursos visuais.
- `frontend/routes`: reserva para configuracao de rotas.
- `frontend/utils`: reserva para funcoes utilitarias.

Tambem existem equivalentes dentro de `frontend/src`, que serao usados pelo
codigo React quando os modulos forem implementados.

## Backend

- `backend/config`: configuracao global do projeto Django.
- `backend/users`: modulo de utilizadores e autenticacao futura.
- `backend/alunos`: modulo de gestao de alunos.
- `backend/professores`: modulo de gestao de professores.
- `backend/turmas`: modulo de gestao de turmas.
- `backend/disciplinas`: modulo de gestao de disciplinas.
- `backend/planificacoes`: modulo de planificacoes pedagogicas.
- `backend/aulas`: modulo de gestao de aulas.
- `backend/pct`: modulo de Plano Curricular de Turma.
- `backend/ocorrencias`: modulo de ocorrencias pedagogicas.
- `backend/tipos_ocorrencias`: modulo de classificacao de ocorrencias.
- `backend/reunioes`: modulo de reunioes.
- `backend/relatorios`: modulo de relatorios.
- `backend/dashboard`: modulo de indicadores e visao geral.

## Pastas de apoio

- `database`: scripts, notas e artefatos de base de dados.
- `docs`: documentacao tecnica e funcional do projeto.
