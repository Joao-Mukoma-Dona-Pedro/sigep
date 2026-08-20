import { useRef, useState } from 'react';

import { useAssistant } from '../../context/AssistantContext';

const DRAG_THRESHOLD = 6;

function AssistantMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`assistant-message ${isUser ? 'is-user' : 'is-assistant'}`}>
      <span>{isUser ? 'Director' : 'Assistente SIGEP'}</span>
      <p>{message.text}</p>
    </div>
  );
}

function AssistantPanel() {
  const { closeAssistant, messages, pageContext, sendLocalMessage } = useAssistant();
  const [draft, setDraft] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    sendLocalMessage(draft);
    setDraft('');
  }

  function handleSuggestionClick(suggestion) {
    sendLocalMessage(suggestion);
  }

  return (
    <section className="assistant-panel" aria-label="Painel do Assistente SIGEP">
      <header className="assistant-panel-header">
        <div>
          <strong>Assistente SIGEP</strong>
          <span>{pageContext.label}</span>
        </div>
        <button className="assistant-icon-button" type="button" aria-label="Fechar Assistente SIGEP" onClick={closeAssistant}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      <div className="assistant-panel-body" aria-live="polite">
        <div className="assistant-context">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span>Interface demonstrativa. Nenhuma consulta real ou serviço externo está activo.</span>
        </div>

        <div className="assistant-messages">
          {messages.map((message) => (
            <AssistantMessage key={message.id} message={message} />
          ))}
        </div>

        <div className="assistant-suggestions" aria-label="Sugestões contextuais">
          {pageContext.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form className="assistant-compose" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="assistant-message-input">
          Escreva a sua pergunta ao Assistente SIGEP
        </label>
        <input
          id="assistant-message-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva a sua pergunta..."
          aria-label="Escreva a sua pergunta"
        />
        <button type="submit" aria-label="Enviar mensagem">
          <i className="bi bi-send" aria-hidden="true" />
          <span>Enviar</span>
        </button>
      </form>
    </section>
  );
}

function AssistantWidget() {
  const { isOpen, position, setPosition, toggleAssistant } = useAssistant();
  const dragState = useRef(null);

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      hasMoved: false,
    };
  }

  function handlePointerMove(event) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > DRAG_THRESHOLD) {
      drag.hasMoved = true;
    }

    if (drag.hasMoved) {
      event.preventDefault();
      setPosition({
        x: drag.originX + deltaX,
        y: drag.originY + deltaY,
      });
    }
  }

  function handlePointerUp(event) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (!drag.hasMoved) {
      toggleAssistant();
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAssistant();
    }
  }

  return (
    <div className="assistant-root" style={{ '--assistant-x': `${position.x}px`, '--assistant-y': `${position.y}px` }}>
      {isOpen && <AssistantPanel />}

      <button
        className={`assistant-floating-button ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Fechar Assistente SIGEP' : 'Abrir Assistente SIGEP'}
        aria-pressed={isOpen}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragState.current = null;
        }}
        onKeyDown={handleKeyDown}
      >
        <i className="bi bi-stars" aria-hidden="true" />
      </button>
    </div>
  );
}

export default AssistantWidget;
