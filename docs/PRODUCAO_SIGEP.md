# Preparação do SIGEP para produção

Este documento descreve a preparação e o futuro processo de publicação. Não contém credenciais reais e não significa que o SIGEP já esteja publicado.

## 1. Arquitectura e requisitos

- Backend: Python, Django, Django REST Framework e JWT.
- Frontend: React e Vite, publicado como ficheiros estáticos.
- Base de dados: PostgreSQL.
- Processo WSGI/ASGI de produção: deve ser escolhido no deployment; `runserver` não deve ser utilizado.
- HTTPS obrigatório no ambiente público.
- Node.js é necessário para construir o frontend, mas não necessariamente para servir o conteúdo final.

As versões exactas estão em `backend/requirements.txt` e `frontend/package-lock.json`. Não foram actualizadas nesta preparação.

## 2. Variáveis do backend

| Variável | Obrigatória em produção | Finalidade |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Sim | Chave forte e exclusiva, com pelo menos 50 caracteres. |
| `DJANGO_DEBUG` | Sim | Deve ser `False`. |
| `DJANGO_ALLOWED_HOSTS` | Sim | Hosts reais do backend, separados por vírgulas. |
| `DATABASE_URL` | Sim | URL PostgreSQL fornecida pelo serviço cloud. |
| `DATABASE_CONN_MAX_AGE` | Não | Reutilização de ligações; valor inicial sugerido: `60`. |
| `CORS_ALLOWED_ORIGINS` | Sim | Origens HTTPS reais do frontend, separadas por vírgulas. |
| `CSRF_TRUSTED_ORIGINS` | Conforme hosting | Origens HTTPS confiáveis para administração Django e formulários. |
| `DJANGO_BEHIND_HTTPS_PROXY` | Conforme hosting | `True` apenas se o proxy define correctamente `X-Forwarded-Proto`. |
| `DJANGO_SECURE_SSL_REDIRECT` | Sim | Normalmente `True`. |
| `DJANGO_SESSION_COOKIE_SECURE` | Sim | Deve ser `True`. |
| `DJANGO_CSRF_COOKIE_SECURE` | Sim | Deve ser `True`. |
| `DJANGO_SECURE_HSTS_SECONDS` | Sim | Começar com valor reduzido e aumentar após validar HTTPS. |
| `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` | Não | Activar somente quando todos os subdomínios usam HTTPS. |
| `DJANGO_SECURE_HSTS_PRELOAD` | Não | Activar somente após decisão explícita sobre preload. |
| `DJANGO_LOG_LEVEL` | Não | Normalmente `INFO` ou `WARNING`. |
| `OPENAI_API_KEY` | Não | Chave do backend para activar o Assistente IA. |
| `OPENAI_MODEL` | Não | Modelo configurado para o Assistente. |

Como alternativa local a `DATABASE_URL`, o projecto continua a aceitar `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` e `POSTGRES_PORT`.

Nunca guardar `.env`, passwords, tokens ou chaves no Git. Caracteres especiais numa `DATABASE_URL` devem estar codificados como URL. O serviço PostgreSQL de produção normalmente exige `sslmode=require` na query da URL.

## 3. Django e segurança

Com `DEBUG=False`, a configuração:

- exige uma `SECRET_KEY` forte;
- exige `ALLOWED_HOSTS` e origens CORS explícitas;
- desactiva a Browsable API;
- activa redireccionamento HTTPS, cookies seguros e HSTS por defeito;
- define `STATIC_ROOT=backend/staticfiles`;
- mantém logs básicos sem registar passwords, tokens ou chaves.

Antes de publicar, executar com variáveis equivalentes às reais:

```powershell
python manage.py check --deploy
python manage.py collectstatic --noinput
```

O segundo comando gera ficheiros estáticos locais; deve ser executado no pipeline ou imagem de produção, não contra a base de dados.

## 4. PostgreSQL

O desenvolvimento usa PostgreSQL em `localhost:5432`, iniciado opcionalmente por `docker-compose.yml`. Esse container e as suas credenciais são apenas locais.

Produção deve utilizar uma instância PostgreSQL cloud separada. Ainda faltam:

1. criar a instância;
2. guardar `DATABASE_URL` no gestor de segredos da plataforma;
3. confirmar SSL, região, backups automáticos e retenção;
4. restaurar uma cópia validada da base local;
5. executar migrations no ambiente de produção durante uma janela controlada.

Nenhuma destas acções foi executada nesta fase.

## 5. Frontend

O frontend lê exclusivamente a URL pública da API através de:

```env
VITE_API_BASE_URL=https://URL-REAL-DO-BACKEND/api
```

Variáveis `VITE_*` são incorporadas no bundle e são públicas. Nunca colocar nelas chaves, passwords ou tokens. O fallback `http://localhost:8000/api` existe apenas para desenvolvimento.

No futuro deployment, definir `VITE_API_BASE_URL` antes de executar `npm run build`. A hospedagem deve encaminhar todas as rotas React desconhecidas para `index.html`.

## 6. CORS e hosts

- `DJANGO_ALLOWED_HOSTS` recebe apenas os hosts do backend, sem protocolo ou caminho.
- `CORS_ALLOWED_ORIGINS` recebe as origens completas do frontend, incluindo `https://`.
- Não utilizar `CORS_ALLOW_ALL_ORIGINS=True`.
- Se houver domínio separado para o Django Admin, incluir a origem apropriada em `CSRF_TRUSTED_ORIGINS`.

## 7. JWT

Configuração auditada:

- access token: 30 minutos;
- refresh token: 8 horas;
- rotação de refresh tokens activa;
- token anterior colocado em blacklist após rotação;
- autenticação por `Authorization: Bearer`;
- permissões globais autenticadas por defeito.

Não foi alterado o comportamento. Após o deployment devem ser testados login, refresh, expiração, logout e bloqueio de endpoints sem token.

## 8. Assistente IA

`OPENAI_API_KEY` permanece exclusivamente no backend. A chave não é exposta ao Vite. Sem a variável, o Assistente responde como indisponível e o restante SIGEP continua funcional.

Não foram realizadas chamadas externas, não foi criada chave e a arquitectura da IA não foi alterada.

## 9. Ficheiros, estáticos e uploads

Não foram encontrados `FileField` ou `ImageField` nos Models actuais. As importações de CSV/XLSX são processadas em memória e não criam biblioteca permanente de uploads.

`backend/media/` está ignorado preventivamente, mas não há armazenamento de media implementado. Se forem adicionados documentos no futuro, será necessário definir armazenamento persistente ou object storage; o disco efémero de muitas plataformas cloud não é adequado.

Os estáticos do Django serão reunidos em `backend/staticfiles/`, também ignorado pelo Git.

## 10. Backup local

Antes de qualquer migração:

1. interromper alterações administrativas ou definir uma janela de manutenção;
2. executar `scripts/backup_postgres.ps1` com as variáveis `POSTGRES_*` locais carregadas;
3. guardar o ficheiro `.dump` em local seguro e fora do Git;
4. verificar que o ficheiro não está vazio;
5. testar a restauração numa base temporária e isolada;
6. registar data, origem, versão PostgreSQL e responsável.

O script usa `pg_dump` em formato custom e não altera a base. Ele não foi executado nesta preparação.

Restauração futura, somente numa base vazia e explicitamente seleccionada:

```powershell
pg_restore --no-owner --no-privileges --dbname URL-DA-BASE-DESTINO ficheiro.dump
```

Nunca testar restauração sobre a base local principal ou sobre produção existente.

## 11. Processo futuro de deployment

1. Escolher hosting do backend, frontend e PostgreSQL.
2. Criar PostgreSQL cloud com backups automáticos.
3. Configurar segredos e variáveis na plataforma.
4. Realizar e validar backup local.
5. Restaurar os dados na base cloud.
6. Publicar backend com processo WSGI/ASGI apropriado.
7. Executar `collectstatic` e migrations controladas.
8. Construir frontend com a URL real da API.
9. Publicar o conteúdo de `frontend/dist` com fallback SPA.
10. Configurar DNS e HTTPS.
11. Executar as verificações pós-deploy.

## 12. Verificações pós-deploy

- `/admin/` e endpoints de API não expõem páginas de erro de debug.
- Login, refresh e logout JWT funcionam.
- Endpoints sem token devolvem acesso negado.
- CORS aceita somente o frontend real.
- Importação CSV/XLSX valida tamanho, formato e autenticação.
- Dashboard apresenta contagens reais.
- PCT, Análise PCT, Relatórios e Ocorrências mantêm os cálculos actuais.
- Logs não contêm tokens, passwords, chaves ou payloads pessoais.
- Backups automáticos e restauração foram confirmados.
- Assistente funciona com chave ou apresenta indisponibilidade sem chave.

## 13. Checklist de produção

- [ ] PostgreSQL cloud criado
- [ ] Backup local realizado
- [ ] Base de dados migrada
- [ ] Backend publicado
- [ ] Frontend publicado
- [ ] CORS configurado
- [ ] ALLOWED_HOSTS configurado
- [ ] DEBUG=False
- [ ] SECRET_KEY configurada
- [ ] DATABASE_URL configurada
- [ ] VITE_API_URL configurada
- [ ] JWT testado
- [ ] Login testado
- [ ] Importação de alunos testada
- [ ] Relatórios testados
- [ ] PCT testado
- [ ] Backup confirmado
- [ ] IA testada
- [ ] API key configurada pelo Director

Todos os itens permanecem desmarcados porque o deployment ainda não foi realizado.
