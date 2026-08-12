# SIGEP - Sistema Integrado de Gestao Pedagogica

SIGEP e um sistema de apoio ao Gabinete Pedagogico de escolas angolanas.
O sistema nao e um ERP escolar completo: o foco desta versao e apoiar o
Subdiretor/Diretor Pedagogico na organizacao e acompanhamento dos processos
pedagogicos definidos no diagrama funcional de referencia.

## Escopo atual

- Interface administrativa completa.
- Design system reutilizavel com botoes, cards, tabelas, modais, badges, breadcrumbs e formularios.
- Login visual/local sem ligacao ao backend.
- Dashboard administrativo para o Subdiretor/Diretor Pedagogico.
- Navegacao completa para os modulos pedagogicos do diagrama.
- Paginas visuais preparadas para receber dados da API no futuro.

Nesta etapa nao ha CRUD, nao ha novas APIs e o frontend nao executa chamadas ao backend.

## Perfil de acesso

Nesta versao existe apenas um perfil administrativo:

- Administrador: Subdiretor/Diretor Pedagogico.

A estrutura do modelo de utilizador possui campo de perfil para permitir novos
perfis no futuro sem redesenhar a autenticacao.

## Tecnologias

- Frontend: React, Bootstrap 5, React Router, Axios, Vite
- Icones: Bootstrap Icons
- Backend: Python, Django, Django REST Framework
- Autenticacao: JWT com `djangorestframework-simplejwt`
- Base de dados: PostgreSQL
- Controlo de versao: Git

## Estrutura principal

```text
SIGEP/
|-- frontend/
|-- backend/
|-- database/
|-- docs/
|-- docker-compose.yml
|-- README.md
`-- LICENSE
```

Veja `docs/ESTRUTURA.md` para a funcao de cada pasta.

## Modulos preparados

- Professores
- Turmas
- Alunos
- Planificacoes
- Controlo de Aulas
- PCT (Provas Comuns Trimestrais)
- Ocorrencias
- Tipos de Ocorrencias
- Reunioes
- Relatorios

Os modulos ainda nao possuem CRUD nem regras de negocio. Apenas a navegacao e a
organizacao base foram criadas.

## Interface frontend

Principais areas criadas:

```text
frontend/src/components/ui
frontend/src/config
frontend/src/context
frontend/src/layouts
frontend/src/pages
frontend/src/routes
frontend/src/styles
```

Componentes reutilizaveis:

- `PageHeader`
- `StatCard`
- `Toolbar`
- `DataTable`
- `Pagination`
- `EntityModal`
- `FakeChart`
- `CalendarPanel`

Paginas visuais:

- Dashboard
- Professores
- Turmas
- Alunos
- Planificacoes
- Controlo de Aulas
- PCT (Provas Comuns Trimestrais)
- Ocorrencias
- Tipos de Ocorrencias
- Reunioes
- Relatorios
- Configuracoes

## Backend preparado

Endpoints de autenticacao:

```text
POST /api/auth/login/
POST /api/auth/refresh/
POST /api/auth/verify/
POST /api/auth/logout/
GET  /api/auth/me/
POST /api/auth/change-password/
POST /api/auth/password-reset/
POST /api/auth/password-reset/confirm/
```

Apps Django:

```text
users
professores
turmas
alunos
planificacoes
aulas
pct
ocorrencias
tipos_ocorrencias
reunioes
relatorios
dashboard
```

## Variaveis de ambiente

Backend (`backend/.env`):

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
POSTGRES_DB=sigep_db
POSTGRES_USER=sigep_user
POSTGRES_PASSWORD=sigep_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Instalar e executar

1. Instalar dependencias do frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

2. Instalar dependencias do backend:

```powershell
cd ..\backend
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Iniciar PostgreSQL com Docker:

```powershell
cd ..
docker compose up -d
```

4. Aplicar migracoes:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
```

5. Criar o administrador:

```powershell
python manage.py createsuperuser
```

Use o e-mail do Subdiretor/Diretor Pedagogico como credencial principal.

6. Executar o backend:

```powershell
python manage.py runserver
```

7. Executar o frontend:

```powershell
cd ..\frontend
npm run dev
```

URLs locais:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## Decisoes de arquitetura

- O frontend e o backend foram mantidos separados para respeitar a arquitetura
  Cliente-Servidor.
- A autenticacao backend usa JWT porque combina bem com APIs REST e com frontend React.
- A autenticacao usada na interface atual e local/demo para manter navegacao funcional sem backend.
- O utilizador autentica por e-mail, adequado a um sistema administrativo.
- O campo `role` prepara novos perfis sem criar complexidade nesta versao.
- As rotas privadas no frontend centralizam a protecao de acesso.
- Os modulos seguem a organizacao do diagrama e ficam prontos para receber
  modelos, serializers, views e paginas especificas nas proximas etapas.
- Os dados ficticios estao centralizados em `frontend/src/config/mockData.js`, para serem substituidos por chamadas API sem redesenhar as paginas.
