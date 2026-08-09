export const teachers = [
  { id: 'PRF-001', nome: 'Ana Domingos', disciplina: 'Matematica', telefone: '+244 923 000 111', email: 'ana.domingos@sigep.ao', estado: 'Ativo', entrada: '2021-02-01' },
  { id: 'PRF-002', nome: 'Carlos Mateus', disciplina: 'Lingua Portuguesa', telefone: '+244 923 000 112', email: 'carlos.mateus@sigep.ao', estado: 'Ativo', entrada: '2020-09-15' },
  { id: 'PRF-003', nome: 'Helena Paulo', disciplina: 'Biologia', telefone: '+244 923 000 113', email: 'helena.paulo@sigep.ao', estado: 'Inativo', entrada: '2019-03-10' },
];

export const students = [
  { id: 'ALN-001', nome: 'Mauro Fernandes', turma: '10 A', nascimento: '2009-05-12', sexo: 'M', encarregado: 'Rosa Fernandes', estado: 'Ativo' },
  { id: 'ALN-002', nome: 'Lina Pedro', turma: '11 B', nascimento: '2008-11-04', sexo: 'F', encarregado: 'Manuel Pedro', estado: 'Ativo' },
  { id: 'ALN-003', nome: 'Edson Costa', turma: '12 C', nascimento: '2007-07-28', sexo: 'M', encarregado: 'Marta Costa', estado: 'Ativo' },
];

export const classes = [
  { id: 'TRM-001', classe: '10', sala: 'A', periodo: 'Manha', ano: '2026', turno: 'Regular', capacidade: 42 },
  { id: 'TRM-002', classe: '11', sala: 'B', periodo: 'Tarde', ano: '2026', turno: 'Regular', capacidade: 38 },
  { id: 'TRM-003', classe: '12', sala: 'C', periodo: 'Manha', ano: '2026', turno: 'Regular', capacidade: 35 },
];

export const plans = [
  { id: 'PLN-001', professor: 'Ana Domingos', trimestre: 'I Trimestre', entrega: '2026-02-12', estado: 'Entregue' },
  { id: 'PLN-002', professor: 'Carlos Mateus', trimestre: 'I Trimestre', entrega: '2026-02-15', estado: 'Pendente' },
  { id: 'PLN-003', professor: 'Helena Paulo', trimestre: 'II Trimestre', entrega: '2026-05-03', estado: 'Entregue' },
];

export const lessons = [
  { id: 'AUL-001', professor: 'Ana Domingos', data: '2026-02-18', aula: 'Assistida', estado: 'Concluido' },
  { id: 'AUL-002', professor: 'Carlos Mateus', data: '2026-02-19', aula: 'Nao assistida', estado: 'Pendente' },
  { id: 'AUL-003', professor: 'Helena Paulo', data: '2026-02-20', aula: 'Assistida', estado: 'Concluido' },
];

export const pct = [
  { id: 'PCT-001', disciplina: 'Matematica', classe: '10', data: '2026-03-20', professor: 'Ana Domingos', estado: 'Nota lancada' },
  { id: 'PCT-002', disciplina: 'Portugues', classe: '11', data: '2026-03-22', professor: 'Carlos Mateus', estado: 'Agendada' },
  { id: 'PCT-003', disciplina: 'Biologia', classe: '12', data: '2026-03-25', professor: 'Helena Paulo', estado: 'Em revisao' },
];

export const occurrences = [
  { id: 'OCR-001', aluno: 'Mauro Fernandes', data: '2026-02-12', tipo: 'Disciplinar', medida: 'Advertencia', registadaPor: 'Ana Domingos' },
  { id: 'OCR-002', aluno: 'Lina Pedro', data: '2026-02-14', tipo: 'Academica', medida: 'Acompanhamento', registadaPor: 'Carlos Mateus' },
  { id: 'OCR-003', aluno: 'Edson Costa', data: '2026-02-18', tipo: 'Comportamental', medida: 'Reuniao com encarregado', registadaPor: 'Helena Paulo' },
];

export const occurrenceTypes = [
  { id: 'TPO-001', descricao: 'Disciplinar', categoria: 'Disciplinar', estado: 'Ativo' },
  { id: 'TPO-002', descricao: 'Academica', categoria: 'Academica', estado: 'Ativo' },
  { id: 'TPO-003', descricao: 'Comportamental', categoria: 'Comportamental', estado: 'Ativo' },
];

export const meetings = [
  { id: 'REU-001', data: '2026-02-26', assunto: 'Conselho pedagogico', participantes: 'Coordenadores', estado: 'Agendada' },
  { id: 'REU-002', data: '2026-03-04', assunto: 'Avaliacao de PCT', participantes: 'Professores', estado: 'Pendente' },
  { id: 'REU-003', data: '2026-03-12', assunto: 'Ocorrencias por turma', participantes: 'Direcao', estado: 'Concluida' },
];

export const activities = [
  'Planificacao de Matematica entregue',
  'Nova ocorrencia registada para 10 A',
  'PCT de Portugues agendada',
  'Reuniao pedagogica marcada',
];

export const notices = [
  'Prazo de entrega das planificacoes termina esta semana.',
  'Revisao das PCT deve ser concluida antes do conselho pedagogico.',
  'Relatorios trimestrais ficam disponiveis apos validacao.',
];
