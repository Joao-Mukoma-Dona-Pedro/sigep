import { moduleLinks } from '../config/modules';

function ModulePlaceholderPage({ title }) {
  const module = moduleLinks.find((item) => item.label === title);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">MÃ³dulo PedagÃ³gico</p>
          <h1>{title}</h1>
        </div>
        <span className={`module-dot ${module?.color || 'blue'}`} />
      </section>
      <section className="empty-state">
        <h2>Estrutura de navegacao criada</h2>
        <p>Este modulo sera desenvolvido na proxima etapa.</p>
      </section>
    </div>
  );
}

export default ModulePlaceholderPage;
