# SIGEP - Sistema Integrado de Gestao Pedagogica

SIGEP e uma base profissional para um sistema de gestao pedagogica destinado a escolas angolanas. Nesta fase, o projeto contem apenas a estrutura inicial, configuracoes e ambiente de desenvolvimento, sem paginas, APIs ou funcionalidades de negocio.

## Tecnologias

- Frontend: React, Bootstrap 5, React Router, Axios, Vite
- Backend: Python, Django, Django REST Framework
- Base de dados: PostgreSQL
- Versao: Git
- Arquitetura: Cliente-Servidor, com `frontend` e `backend` separados

## Estrutura

```text
SIGEP/
├── frontend/
├── backend/
├── database/
├── docs/
├── .gitignore
├── docker-compose.yml
├── README.md
└── LICENSE
```

Veja `docs/ESTRUTURA.md` para a funcao de cada pasta.

## Requisitos

- Node.js e npm
- Python 3.13+
- Docker Desktop ou PostgreSQL instalado localmente
- Git

## Configuracao inicial

1. Clone ou abra o projeto:

```powershell
cd C:\Users\ASUS\Documents\GitHub\sigep
```

2. Configure o frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

3. Configure o backend:

```powershell
cd ..\backend
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

4. Suba o PostgreSQL com Docker:

```powershell
cd ..
docker compose up -d
```

5. Aplique as migracoes iniciais do Django:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
```

## Executar localmente

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

Frontend:

```powershell
cd frontend
npm run dev
```

URLs padrao:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

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

## Estado atual

- Estrutura Cliente-Servidor criada.
- React instalado e preparado com Bootstrap, React Router e Axios.
- Django criado e preparado com Django REST Framework.
- PostgreSQL configurado por variaveis de ambiente.
- Apps Django dos modulos pedagogicos criados, ainda sem funcionalidades.
- Git preparado com `.gitignore`.

## Proximos passos sugeridos

1. Definir modelo de autenticacao e perfis de utilizador.
2. Modelar entidades principais: escola, ano lectivo, turma, aluno, professor e disciplina.
3. Criar APIs REST por modulo.
4. Construir layouts e navegacao do frontend.
