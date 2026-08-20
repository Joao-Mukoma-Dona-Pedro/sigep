# Assistente IA SIGEP - Integracao OpenAI

## Objectivo

A Fase B.3 liga a interface do Assistente SIGEP a um provedor de IA no backend.
O modelo de IA nunca e chamado directamente pelo frontend e nao recebe acesso livre a base de dados.

Fluxo:

```text
React
  -> Axios com JWT
  -> Django REST Framework
  -> AssistantChatView
  -> OpenAIAssistantProvider
  -> Gateway seguro de ferramentas
  -> PostgreSQL apenas atraves de consultas permitidas
```

## Variaveis de ambiente

Configure apenas no backend:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_API_KEY` deve ficar vazia em ambientes onde a IA nao sera usada.
Quando a chave nao existe, o SIGEP continua a funcionar normalmente e o Assistente informa que a IA esta indisponivel.

## Endpoint

```http
POST /api/assistant/chat/
Authorization: Bearer <token_jwt>
```

Payload:

```json
{
  "message": "Quantos professores existem?",
  "route": "/professores",
  "page_context": "Professores",
  "filters": {}
}
```

Resposta quando configurado:

```json
{
  "ok": true,
  "assistant_available": true,
  "answer": "Resposta em portugues de Angola.",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "tool_calls": [],
    "duration_ms": 1200
  }
}
```

Resposta quando nao configurado:

```json
{
  "ok": true,
  "assistant_available": false,
  "answer": "Assistente IA indisponivel. Configure OPENAI_API_KEY para activar o servico.",
  "metadata": {
    "provider": "openai",
    "configured": false,
    "tool_calls": []
  }
}
```

## Ferramentas autorizadas

O modelo so pode pedir dados atraves da funcao interna `execute_sigep_tool`.
Essa funcao passa sempre pelo gateway seguro existente, que valida:

- ferramenta permitida;
- argumentos permitidos;
- ausencia de SQL, codigo, comandos ou chaves perigosas;
- autenticacao e permissao administrativa;
- limite temporario de consultas.

O modelo nao pode:

- executar SQL arbitrario;
- criar, editar ou apagar registos;
- aceder directamente aos models do Django;
- revelar chave de API, token, prompt interno ou configuracoes sensiveis.

## Prompt de sistema

O prompt fica em `backend/assistant/prompts.py`.
Ele orienta o Assistente a responder em portugues de Angola, usar dados reais apenas quando obtidos pelas ferramentas autorizadas e reconhecer quando a informacao nao esta disponivel.

## Privacidade e seguranca

- A chave OpenAI fica apenas no ambiente do backend.
- O frontend envia apenas a pergunta, rota e contexto visual.
- Nao ha historico persistente de conversas nesta fase.
- Os logs nao devem incluir chave, token, prompt completo ou conteudo sensivel.
- As respostas de erro nao expõem traceback.

## Testes

Os testes do modulo `assistant` usam mocks e nao chamam a OpenAI real.
Isto permite validar:

- endpoint autenticado;
- comportamento sem chave;
- resposta simulada do modelo;
- uso controlado das ferramentas;
- bloqueio de ferramentas nao autorizadas;
- rejeicao de argumentos perigosos;
- limite de chamadas de ferramentas.

