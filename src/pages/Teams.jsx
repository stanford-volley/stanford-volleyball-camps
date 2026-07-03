export default function Teams({ teams }) {
  return (
    <section className="team-grid">
      {teams.map(([team, roster]) => (
        <div className="team-card" key={team}>
          <h3>{team}</h3>

          <p>
            <strong>{roster.length}</strong> campers
          </p>

          <button className="primary-button">
            Open Team
          </button>
        </div>
      ))}
    </section>
  );
}
