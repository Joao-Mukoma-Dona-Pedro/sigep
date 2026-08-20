import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { askAssistant } from '../services/assistantService';

const AssistantContext = createContext(null);
const POSITION_STORAGE_KEY = 'sigep.assistant.position';
const DEFAULT_MARGIN = 18;
const BUTTON_SIZE = 48;

const routeContexts = [
  { prefix: '/dashboard', label: 'Dashboard', suggestions: ['Analisar situacao da escola', 'Consultar desempenho'] },
  { prefix: '/professores', label: 'Professores', suggestions: ['Ver professores', 'Consultar planificacoes'] },
  { prefix: '/disciplinas', label: 'Disciplinas', suggestions: ['Ver disciplinas', 'Consultar leccionacoes'] },
  { prefix: '/turmas', label: 'Turmas', suggestions: ['Analisar turma', 'Ver desempenho PCT'] },
  { prefix: '/alunos', label: 'Alunos', suggestions: ['Consultar desempenho', 'Ver ocorrencias'] },
  { prefix: '/leccionacoes', label: 'Leccionacoes', suggestions: ['Ver leccionacoes', 'Consultar contexto pedagogico'] },
  { prefix: '/lecionacoes', label: 'Leccionacoes', suggestions: ['Ver leccionacoes', 'Consultar contexto pedagogico'] },
  { prefix: '/planificacoes', label: 'Planificacoes', suggestions: ['Ver entregas', 'Consultar pendencias'] },
  { prefix: '/controlo-aulas', label: 'Controlo de Aulas', suggestions: ['Ver aulas assistidas', 'Consultar aulas pendentes'] },
  { prefix: '/pct', label: 'PCT', suggestions: ['Analisar desempenho', 'Ver resultados', 'Comparar PCT'] },
  { prefix: '/analise-pct', label: 'Analise PCT', suggestions: ['Comparar trimestres', 'Analisar turma'] },
  { prefix: '/ocorrencias', label: 'Ocorrencias', suggestions: ['Ver ocorrencias', 'Consultar alunos acompanhados'] },
  { prefix: '/tipos-ocorrencias', label: 'Tipos de Ocorrencias', suggestions: ['Ver categorias', 'Consultar tipos'] },
  { prefix: '/reunioes', label: 'Reunioes', suggestions: ['Ver reunioes', 'Consultar decisoes'] },
  { prefix: '/relatorios', label: 'Relatorios', suggestions: ['Resumir situacao', 'Preparar relatorio'] },
  { prefix: '/configuracoes', label: 'Configuracoes', suggestions: ['Ver perfil', 'Alterar preferencias'] },
];

function getViewport() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function clampPosition(position) {
  const viewport = getViewport();
  const maxX = Math.max(DEFAULT_MARGIN, viewport.width - BUTTON_SIZE - DEFAULT_MARGIN);
  const maxY = Math.max(DEFAULT_MARGIN, viewport.height - BUTTON_SIZE - DEFAULT_MARGIN);

  return {
    x: Math.min(Math.max(position.x, DEFAULT_MARGIN), maxX),
    y: Math.min(Math.max(position.y, DEFAULT_MARGIN), maxY),
  };
}

function getDefaultPosition() {
  const viewport = getViewport();
  return clampPosition({
    x: viewport.width - BUTTON_SIZE - DEFAULT_MARGIN,
    y: viewport.height - BUTTON_SIZE - DEFAULT_MARGIN,
  });
}

function getStoredPosition() {
  if (typeof window === 'undefined') {
    return getDefaultPosition();
  }

  try {
    const stored = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY));
    if (typeof stored?.x === 'number' && typeof stored?.y === 'number') {
      return clampPosition(stored);
    }
  } catch {
    localStorage.removeItem(POSITION_STORAGE_KEY);
  }

  return getDefaultPosition();
}

function getPageContext(pathname) {
  return routeContexts.find((item) => pathname.startsWith(item.prefix)) || {
    label: 'SIGEP',
    suggestions: ['Consultar informacao', 'Analisar dados'],
  };
}

function createInitialMessages(pageLabel) {
  return [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Ola, Subdirector Pedagogico. Estou preparado para apoiar no contexto ${pageLabel}. Quando a IA estiver configurada, poderei consultar dados autorizados do SIGEP.`,
    },
  ];
}

export function AssistantProvider({ children }) {
  const location = useLocation();
  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPositionState] = useState(getStoredPosition);
  const [messages, setMessages] = useState(() => createInitialMessages(pageContext.label));
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantAvailable, setAssistantAvailable] = useState(null);
  const [error, setError] = useState('');

  const setPosition = useCallback((nextPosition) => {
    const safePosition = clampPosition(nextPosition);
    setPositionState(safePosition);
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(safePosition));
  }, []);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen((current) => !current), []);

  const sendLocalMessage = useCallback(
    async (text) => {
      const trimmedText = text.trim();
      if (!trimmedText || isProcessing) return;

      const timestamp = Date.now();
      setError('');
      setIsProcessing(true);
      setMessages((current) => [...current, { id: `user-${timestamp}`, role: 'user', text: trimmedText }]);

      try {
        const result = await askAssistant({
          message: trimmedText,
          route: location.pathname,
          pageContext: pageContext.label,
        });
        const answer = result?.answer || 'Nao foi possivel obter uma resposta do Assistente SIGEP neste momento.';
        setAssistantAvailable(Boolean(result?.assistant_available));
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: answer,
          },
        ]);
      } catch (requestError) {
        const statusCode = requestError?.response?.status;
        let friendlyMessage = 'Nao foi possivel contactar o Assistente SIGEP. Verifique a ligacao e tente novamente.';
        if (statusCode === 401) {
          friendlyMessage = 'A sessao expirou. Inicie sessao novamente para usar o Assistente SIGEP.';
        }
        if (statusCode === 403) {
          friendlyMessage = 'Apenas o Subdirector ou Director Pedagogico pode usar o Assistente SIGEP.';
        }
        setError(friendlyMessage);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            text: friendlyMessage,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, location.pathname, pageContext.label],
  );

  useEffect(() => {
    setIsOpen(false);
    setMessages(createInitialMessages(pageContext.label));
    setError('');
    setAssistantAvailable(null);
  }, [location.pathname, pageContext.label]);

  useEffect(() => {
    function handleResize() {
      setPosition(getStoredPosition());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setPosition]);

  const value = useMemo(
    () => ({
      isOpen,
      position,
      pageContext,
      messages,
      isProcessing,
      assistantAvailable,
      error,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      setPosition,
      sendLocalMessage,
    }),
    [
      assistantAvailable,
      closeAssistant,
      error,
      isOpen,
      isProcessing,
      messages,
      openAssistant,
      pageContext,
      position,
      sendLocalMessage,
      setPosition,
      toggleAssistant,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant deve ser usado dentro de AssistantProvider.');
  }
  return context;
}
