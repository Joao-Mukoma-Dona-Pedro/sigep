function CalendarPanel() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const dates = ['16', '17', '18', '19', '20'];

  return (
    <article className="panel-card">
      <div className="panel-card-header">
        <h2>Calendario escolar</h2>
        <span>Fevereiro 2026</span>
      </div>
      <div className="calendar-grid">
        {days.map((day) => <strong key={day}>{day}</strong>)}
        {dates.map((date) => <button className="calendar-day" type="button" key={date}>{date}</button>)}
      </div>
      <div className="calendar-note">
        <i className="bi bi-calendar-event" aria-hidden="true" />
        Conselho pedagogico previsto para dia 20.
      </div>
    </article>
  );
}

export default CalendarPanel;
