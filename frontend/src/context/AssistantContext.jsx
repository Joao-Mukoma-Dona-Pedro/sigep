import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AssistantContext = createContext(null);
const POSITION_STORAGE_KEY = 'sigep.assistant.position';
const DEFAULT_MARGIN = 18;
const BUTTON_SIZE = 48;

const routeContexts = [
  { prefix: '/dashboard', label: 'Dashboard', suggestions: ['Analisar situação da escola', 'Consultar desempenho'] },
  { prefix: '/professores', label: 'Professores', suggestions: ['Ver professores', 'Consultar planificações'] },
  { prefix: '/disciplinas', label: 'Disciplinas', suggestions: ['Ver disciplinas', 'Consultar leccionações'] },
  { prefix: '/turmas', label: 'Turmas', suggestions: ['Analisar turma', 'Ver desempenho PCT'] },
  { prefix: '/alunos', label: 'Alunos', suggestions: ['Consultar desempenho', 'Ver ocorrências'] },
  { prefix: '/leccionacoes', label: 'Leccionações', suggestions: ['Ver leccionações', 'Consultar contexto pedagógico'] },
  { prefix: '/lecionacoes', label: 'Leccionações', suggestions: ['Ver leccionações', 'Consultar contexto pedagógico'] },
  { prefix: '/planificacoes', label: 'Planificações', suggestions: ['Ver entregas', 'Consultar pendências'] },
  { prefix: '/controlo-aulas', label: 'Controlo de Aulas', suggestions: ['Ver aulas assistidas', 'Consultar aulas pendentes'] },
  { prefix: '/pct', label: 'PCT', suggestions: ['Analisar desempenho', 'Ver resultados', 'Comparar PCT'] },
  { prefix: '/analise-pct', label: 'Análise PCT', suggestions: ['Comparar trimestres', 'Analisar turma'] },
  { prefix: '/ocorrencias', label: 'Ocorrências', suggestions: ['Ver ocorrências', 'Consultar alunos acompanhados'] },
  { prefix: '/tipos-ocorrencias', label: 'Tipos de Ocorrências', suggestions: ['Ver categorias', 'Consultar tipos'] },
  { prefix: '/reunioes', label: 'Reuniões', suggestions: ['Ver reuniões', 'Consultar decisões'] },
  { prefix: '/relatorios', label: 'Relatórios', suggestions: ['Resumir situação', 'Preparar relatório'] },
  { prefix: '/configuracoes', label: 'Configurações', suggestions: ['Ver perfil', 'Alterar preferências'] },
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
    suggestions: ['Consultar informação', 'Analisar dados'],
  };
}

function createInitialMessages(pageLabel) {
  return [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Olá, Subdirector Pedagógico. Estou preparado visualmente para apoiar no contexto ${pageLabel}. A ligação à IA real ainda não está activa.`,
    },
  ];
}

export function AssistantProvider({ children }) {
  const location = useLocation();
  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPositionState] = useState(getStoredPosition);
  const [messages, setMessages] = useState(() => createInitialMessages(pageContext.label));

  const setPosition = useCallback((nextPosition) => {
    const safePosition = clampPosition(nextPosition);
    setPositionState(safePosition);
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(safePosition));
  }, []);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen((current) => !current), []);

  const sendLocalMessage = useCallback((text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, role: 'user', text: trimmedText },
      {
        id: `assistant-${timestamp}`,
        role: 'assistant',
        text: 'Assistente ainda não ligado ao serviço de IA. Esta é apenas uma demonstração da interface.',
      },
    ]);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMessages(createInitialMessages(pageContext.label));
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
      openAssistant,
      closeAssistant,
      toggleAssistant,
      setPosition,
      sendLocalMessage,
    }),
    [closeAssistant, isOpen, messages, openAssistant, pageContext, position, sendLocalMessage, setPosition, toggleAssistant],
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
