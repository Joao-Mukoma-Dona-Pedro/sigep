import CalendarPanel from '../components/ui/CalendarPanel';
import DataTable from '../components/ui/DataTable';
import EntityModal from '../components/ui/EntityModal';
import PageHeader from '../components/ui/PageHeader';
import Toolbar from '../components/ui/Toolbar';
import { meetings } from '../config/mockData';

function MeetingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Reunioes"
        eyebrow="Agenda pedagogica"
        description="Interface preparada para agenda, calendario e historico de reunioes."
        breadcrumbs={['Reunioes']}
        actions={(
          <button className="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#reuniaoModal">
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Nova Reuniao
          </button>
        )}
      />
      <Toolbar
        searchPlaceholder="Pesquisar por assunto ou participantes"
        filters={[
          { label: 'Estado', options: ['Agendada', 'Pendente', 'Concluida'] },
          { label: 'Participantes', options: ['Coordenadores', 'Professores', 'Direcao'] },
        ]}
      />
      <section className="dashboard-grid">
        <CalendarPanel />
        <article className="panel-card">
          <div className="panel-card-header"><h2>Agenda</h2><i className="bi bi-calendar-week" /></div>
          <ul className="timeline-list">
            {meetings.map((meeting) => (
              <li key={meeting.id}>
                <strong>{meeting.data}</strong>
                <span>{meeting.assunto}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <DataTable
        rows={meetings}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'data', label: 'Data' },
          { key: 'assunto', label: 'Assunto' },
          { key: 'participantes', label: 'Participantes' },
          { key: 'estado', label: 'Estado' },
        ]}
      />
      <EntityModal
        id="reuniaoModal"
        title="Nova Reuniao"
        fields={[
          { name: 'data', label: 'Data', type: 'date' },
          { name: 'assunto', label: 'Assunto' },
          { name: 'participantes', label: 'Participantes' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Agendada', 'Pendente', 'Concluida'] },
        ]}
      />
    </div>
  );
}

export default MeetingsPage;
