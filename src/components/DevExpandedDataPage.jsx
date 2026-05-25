import { useEffect, useMemo, useState } from 'react';
import { teams, leagues } from '../data/sampleData';

const PREVIEW_URL = `${import.meta.env.BASE_URL}dev-data/footybrain-app-ready-preview.json`;

const DATA_STATUSES = [
  'mvp-linked',
  'manual-only',
  'generated-needs-editorial',
];

const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
const leagueNameById = Object.fromEntries(leagues.map((t) => [t.id, t.name]));

function playerDisplayName(player) {
  return player.displayName ?? player.name ?? player.id;
}

export default function DevExpandedDataPage() {
  const [bundle, setBundle] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoadState('loading');
      setLoadError(null);
      try {
        const res = await fetch(PREVIEW_URL);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} loading ${PREVIEW_URL}`);
        }
        const data = await res.json();
        if (cancelled) return;
        if (!Array.isArray(data?.players)) {
          throw new Error('Preview JSON missing players array');
        }
        setBundle(data);
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        setBundle(null);
        setLoadError(err instanceof Error ? err.message : 'Failed to load preview data');
        setLoadState('error');
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, []);

  const players = useMemo(() => bundle?.players ?? [], [bundle]);
  const meta = bundle?.meta ?? {};

  const teamOptions = useMemo(() => {
    if (!players.length) return [];
    const ids = new Set(players.map((p) => p.teamId));
    return teams.filter((t) => ids.has(t.id));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) => {
      if (teamFilter && player.teamId !== teamFilter) return false;
      if (statusFilter && player.dataStatus !== statusFilter) return false;
      if (query && !playerDisplayName(player).toLowerCase().includes(query)) return false;
      return true;
    });
  }, [players, teamFilter, statusFilter, search]);

  const counts = meta?.counts ?? {};

  return (
    <div className="page dev-expanded">
      <div className="dev-expanded__banner" role="alert">
        <strong>Dev preview only</strong> — not used by the main app or quizzes.
      </div>

      <header className="page-header">
        <h1>Expanded data preview</h1>
        <p>
          Staged merge of Transfermarkt facts and editorial overlays. Route:{' '}
          <code>/dev/expanded-data</code>
        </p>
      </header>

      {loadState === 'loading' && (
        <p className="dev-expanded__status" role="status">
          Loading preview data…
        </p>
      )}

      {loadState === 'error' && (
        <section className="dev-expanded__status dev-expanded__status--error" role="alert">
          <h2>Could not load preview</h2>
          <p>{loadError}</p>
          <p className="dev-expanded__status-hint">
            Run <code>npm run build:app-ready-preview</code> and ensure{' '}
            <code>public/dev-data/footybrain-app-ready-preview.json</code> exists.
          </p>
        </section>
      )}

      {loadState === 'ready' && players.length === 0 && (
        <p className="dev-expanded__status dev-expanded__status--empty" role="status">
          Preview file loaded but contains no players.
        </p>
      )}

      {loadState === 'ready' && players.length > 0 && (
        <>
          <section className="dev-expanded__stats" aria-label="Dataset summary">
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Total players</span>
              <strong>{counts.totalPlayers ?? players.length}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">MVP featured</span>
              <strong>{counts.mvpFeatured ?? '—'}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Linked MVP</span>
              <strong>{counts.mvpLinked ?? '—'}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Manual-only MVP</span>
              <strong>{counts.mvpManualOnly ?? '—'}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Needs editorial</span>
              <strong>{counts.generatedNeedsEditorial ?? '—'}</strong>
            </div>
          </section>

          {meta?.warnings?.length > 0 && (
            <section className="dev-expanded__warnings">
              <h2>Build warnings</h2>
              <ul>
                {meta.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="filters" aria-label="Dev preview filters">
            <div className="filters__row">
              <label className="filter-field">
                <span>Team</span>
                <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <option value="">All teams</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Data status</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  {DATA_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field filter-field--grow">
                <span>Search</span>
                <input
                  type="search"
                  placeholder="Search by player name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <p className="filters__count">
              Showing {filteredPlayers.length} of {players.length} players
            </p>
          </section>

          <section className="dev-expanded__table-wrap" aria-label="Player listing">
            <table className="dev-expanded__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Team</th>
                  <th>League</th>
                  <th>Position</th>
                  <th>Nationality</th>
                  <th>DOB</th>
                  <th>Status</th>
                  <th>Quiz</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td data-label="Name">
                      <span className="dev-expanded__name">{playerDisplayName(player)}</span>
                      <small className="dev-expanded__id">{player.id}</small>
                    </td>
                    <td data-label="Team">{teamNameById[player.teamId] ?? player.teamId}</td>
                    <td data-label="League">{leagueNameById[player.leagueId] ?? player.leagueId}</td>
                    <td data-label="Position">{player.position ?? '—'}</td>
                    <td data-label="Nationality">{player.nationality ?? '—'}</td>
                    <td data-label="DOB">{player.dateOfBirth ?? '—'}</td>
                    <td data-label="Status">
                      <span
                        className={`dev-expanded__pill dev-expanded__pill--${player.dataStatus}`}
                      >
                        {player.dataStatus}
                      </span>
                    </td>
                    <td data-label="Quiz">{player.quizEligible ? 'yes' : 'no'}</td>
                    <td data-label="Tier">{player.rosterTier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlayers.length === 0 && (
              <p className="dev-expanded__empty">No players match the current filters.</p>
            )}
          </section>

          {meta?.generatedAt && (
            <p className="dev-expanded__meta-foot">
              Generated {meta.generatedAt}
              {meta.previewSeason ? ` · TM season ${meta.previewSeason}` : ''}
              {meta.dataAsOf ? ` · data as of ${meta.dataAsOf}` : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
}
