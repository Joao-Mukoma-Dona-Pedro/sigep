import { classes, lessons, occurrenceTypes, occurrences, pct, plans, students, teachers } from './mockData';

const statusBadge = (value) => {
  if (['Ativo', 'Entregue', 'Concluido', 'Nota lancada'].includes(value)) return 'badge-success';
  if (['Pendente', 'Agendada', 'Em revisao'].includes(value)) return 'badge-warning';
  if (['Inativo'].includes(value)) return 'badge-danger';
  return 'badge-info';
};

export const pageConfigs = {
  professores: {
    title: 'Professores',
    eyebrow: 'Gestão pedagógica',
    description: 'Interface preparada para registo, consulta e acompanhamento pedagogico dos professores.',
    actionLabel: 'Novo Professor',
    searchPlaceholder: 'Pesquisar por nome, disciplina ou e-mail',
    detailBasePath: '/professores',
    rows: teachers,
    filters: [
      { label: 'Disciplina', options: ['Matematica', 'Lingua Portuguesa', 'Biologia'] },
      { label: 'Estado', options: ['Ativo', 'Inativo'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
    modal: {
      id: 'professorModal',
      title: 'Novo Professor',
      fields: [
        { name: 'nome', label: 'Nome' },
        { name: 'disciplina', label: 'Disciplina' },
        { name: 'telefone', label: 'Telefone' },
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'estado', label: 'Estado', type: 'select', options: ['Ativo', 'Inativo'] },
      ],
    },
  },
  alunos: {
    title: 'Alunos',
    eyebrow: 'Acompanhamento pedagogico',
    description: 'Lista visual preparada para dados dos alunos e respetivo encarregado de educacao.',
    actionLabel: 'Novo Aluno',
    searchPlaceholder: 'Pesquisar por aluno, turma ou encarregado',
    detailBasePath: '/alunos',
    rows: students,
    filters: [
      { label: 'Turma', options: ['10 A', '11 B', '12 C'] },
      { label: 'Estado', options: ['Ativo', 'Inativo'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'turma', label: 'Turma' },
      { key: 'encarregado', label: 'Encarregado' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
    modal: {
      id: 'alunoModal',
      title: 'Novo Aluno',
      fields: [
        { name: 'nome', label: 'Nome' },
        { name: 'turma', label: 'Turma', type: 'select', options: ['10 A', '11 B', '12 C'] },
        { name: 'nascimento', label: 'Data de nascimento', type: 'date' },
        { name: 'encarregado', label: 'Encarregado de educacao' },
      ],
    },
  },
  turmas: {
    title: 'Turmas',
    eyebrow: 'Organizacao escolar',
    description: 'Estrutura visual para turmas, salas, turnos e capacidade.',
    actionLabel: 'Nova Turma',
    searchPlaceholder: 'Pesquisar por classe, sala ou periodo',
    detailBasePath: '/turmas',
    rows: classes,
    filters: [
      { label: 'Classe', options: ['10', '11', '12'] },
      { label: 'Periodo', options: ['Manha', 'Tarde'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'classe', label: 'Classe' },
      { key: 'sala', label: 'Sala' },
      { key: 'periodo', label: 'Periodo' },
      { key: 'capacidade', label: 'Capacidade' },
    ],
    modal: {
      id: 'turmaModal',
      title: 'Nova Turma',
      fields: [
        { name: 'classe', label: 'Classe' },
        { name: 'sala', label: 'Sala' },
        { name: 'periodo', label: 'Periodo', type: 'select', options: ['Manha', 'Tarde'] },
        { name: 'capacidade', label: 'Capacidade', type: 'number' },
      ],
    },
  },
  planificacoes: {
    title: 'Planificações',
    eyebrow: 'Planeamento pedagogico',
    description: 'Interface preparada para entregas trimestrais de planificacoes.',
    actionLabel: 'Nova Planificacao',
    searchPlaceholder: 'Pesquisar por professor ou trimestre',
    rows: plans,
    filters: [
      { label: 'Trimestre', options: ['I Trimestre', 'II Trimestre', 'III Trimestre'] },
      { label: 'Estado', options: ['Entregue', 'Pendente'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'professor', label: 'Professor' },
      { key: 'trimestre', label: 'Trimestre' },
      { key: 'entrega', label: 'Data de entrega' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
    modal: {
      id: 'planificacaoModal',
      title: 'Nova Planificacao',
      fields: [
        { name: 'professor', label: 'Professor' },
        { name: 'trimestre', label: 'Trimestre', type: 'select', options: ['I Trimestre', 'II Trimestre', 'III Trimestre'] },
        { name: 'entrega', label: 'Data de entrega', type: 'date' },
      ],
    },
  },
  aulas: {
    title: 'Controlo de Aulas',
    eyebrow: 'Aulas assistidas',
    description: 'Interface preparada para calendario, estado e observacao de aulas.',
    searchPlaceholder: 'Pesquisar por professor ou data',
    rows: lessons,
    filters: [
      { label: 'Estado', options: ['Concluido', 'Pendente'] },
      { label: 'Aula', options: ['Assistida', 'Não assistida'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'professor', label: 'Professor' },
      { key: 'data', label: 'Data' },
      { key: 'aula', label: 'Aula' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
  },
  pct: {
    title: 'PCT',
    eyebrow: 'Provas Comuns Trimestrais',
    description: 'Interface preparada para gerir PCT por disciplina, classe, data e professor.',
    actionLabel: 'Nova PCT',
    searchPlaceholder: 'Pesquisar por disciplina, classe ou professor',
    rows: pct,
    filters: [
      { label: 'Disciplina', options: ['Matematica', 'Portugues', 'Biologia'] },
      { label: 'Estado', options: ['Agendada', 'Em revisao', 'Nota lancada'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'classe', label: 'Classe' },
      { key: 'data', label: 'Data' },
      { key: 'professor', label: 'Professor' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
    modal: {
      id: 'pctModal',
      title: 'Nova PCT',
      fields: [
        { name: 'disciplina', label: 'Disciplina' },
        { name: 'classe', label: 'Classe' },
        { name: 'data', label: 'Data', type: 'date' },
        { name: 'professor', label: 'Professor' },
      ],
    },
  },
  ocorrencias: {
    title: 'Ocorrências',
    eyebrow: 'Registo pedagogico',
    description: 'Tabela preparada para ocorrencias dos alunos, medidas tomadas e responsavel pelo registo.',
    actionLabel: 'Nova Ocorrencia',
    searchPlaceholder: 'Pesquisar por aluno, tipo ou professor',
    rows: occurrences,
    filters: [
      { label: 'Tipo', options: ['Disciplinar', 'Académica', 'Comportamental'] },
      { label: 'Medida', options: ['Advertencia', 'Acompanhamento', 'Reuniao com encarregado'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'aluno', label: 'Aluno' },
      { key: 'data', label: 'Data' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'medida', label: 'Medida' },
      { key: 'registadaPor', label: 'Registada por' },
    ],
    modal: {
      id: 'ocorrenciaModal',
      title: 'Nova Ocorrencia',
      fields: [
        { name: 'aluno', label: 'Aluno' },
        { name: 'tipo', label: 'Tipo', type: 'select', options: ['Disciplinar', 'Académica', 'Comportamental'] },
        { name: 'data', label: 'Data', type: 'date' },
        { name: 'medida', label: 'Medida tomada' },
      ],
    },
  },
  tiposOcorrencias: {
    title: 'Tipos de Ocorrências',
    eyebrow: 'Classificacao',
    description: 'Pagina preparada para gerir categorias e descricoes de ocorrencias.',
    actionLabel: 'Novo Tipo',
    searchPlaceholder: 'Pesquisar por descricao ou categoria',
    rows: occurrenceTypes,
    filters: [
      { label: 'Categoria', options: ['Disciplinar', 'Académica', 'Comportamental'] },
      { label: 'Estado', options: ['Ativo', 'Inativo'] },
    ],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'descricao', label: 'Descricao' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'estado', label: 'Estado', badge: statusBadge },
    ],
    modal: {
      id: 'tipoOcorrenciaModal',
      title: 'Novo Tipo de Ocorrencia',
      fields: [
        { name: 'descricao', label: 'Descricao' },
        { name: 'categoria', label: 'Categoria', type: 'select', options: ['Disciplinar', 'Académica', 'Comportamental'] },
        { name: 'estado', label: 'Estado', type: 'select', options: ['Ativo', 'Inativo'] },
      ],
    },
  },
};

export const detailConfigs = {
  professores: {
    title: 'Professores',
    records: teachers,
    backPath: '/professores',
    fields: [
      { key: 'id', label: 'Codigo' },
      { key: 'nome', label: 'Nome' },
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'email', label: 'E-mail' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  alunos: {
    title: 'Alunos',
    records: students,
    backPath: '/alunos',
    fields: [
      { key: 'id', label: 'Codigo' },
      { key: 'nome', label: 'Nome' },
      { key: 'turma', label: 'Turma' },
      { key: 'nascimento', label: 'Nascimento' },
      { key: 'encarregado', label: 'Encarregado' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  turmas: {
    title: 'Turmas',
    records: classes,
    backPath: '/turmas',
    fields: [
      { key: 'id', label: 'Codigo' },
      { key: 'classe', label: 'Classe' },
      { key: 'sala', label: 'Sala' },
      { key: 'periodo', label: 'Periodo' },
      { key: 'ano', label: 'Ano lectivo' },
      { key: 'capacidade', label: 'Capacidade' },
    ],
  },
};
