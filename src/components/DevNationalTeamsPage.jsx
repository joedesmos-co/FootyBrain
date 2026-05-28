import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const PREVIEW_URL = `${import.meta.env.BASE_URL}dev-data/national-teams-preview.json`;

const LINK_FILTERS = [
  { value: '', label: 'All players' },
  { value: 'linked', label: 'Linked (in FootyCompass)' },
  { value: 'unmatched', label: 'Unmatched (not in FootyCompass)' },
];

function displayPlayerName(row) {
  return row.displayName ?? row.tmDisplayName ?? row.playerId ?? '—';
}

export default function DevNationalTeamsPage() {
  const [preview, setPreview] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [linkFilter, setLinkFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setLoadError(null);
      try {
        const res = await fetch(PREVIEW_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading national-teams preview`);
        const data = await res.json();
        if (!Array.isArray(data?.nationalTeams)) {
          throw new Error('Preview JSON missing nationalTeams array');
        }
        if (cancelled) return;
        setPreview(data);
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        setPreview(null);
        setLoadError(err instanceof Error ? err.message : 'Failed to load preview');
        setLoadState('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const teams = useMemo(() => preview?.nationalTeams ?? [], [preview]);
  const links = useMemo(() => preview?.playerLinks ?? [], [preview]);
  const unmatched = useMemo(() => preview?.unmatchedNationalTeamPlayers ?? [], [preview]);
  const warnings = preview?.warnings ?? [];
  const meta = preview?.meta ?? {};
  const inspection = preview?.inspection ?? {};

  const teamById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const rosterRows = useMemo(() => {
    const linked = links.map((row) => ({
      kind: 'linked',
      nationalTeamId: row.nationalTeamId,
      inFootyCompass: true,
      playerId: row.playerId,
      sourceId: row.sourceId,
      name: displayPlayerName(row),
      position: row.position,
      citizenship: row.citizenship,
      clubTeamId: row.clubTeamId,
      quizEligible: row.quizEligible,
      linkSource: row.linkSource,
      internationalCaps: row.internationalCaps,
      missingFields: row.missingFields ?? [],
    }));
    const unlinked = unmatched.map((row) => ({
      kind: 'unmatched',
      nationalTeamId: row.nationalTeamId,
      inFootyCompass: false,
      playerId: null,
      sourceId: row.sourceId,
      name: displayPlayerName(row),
      position: row.position,
      citizenship: row.citizenship,
      clubTeamId: null,
      quizEligible: false,
      linkSource: row.linkSource,
      internationalCaps: row.internationalCaps,
      reason: row.reason,
      missingFields: row.missingFields ?? [],
    }));
    return [...linked, ...unlinked];
  }, [links, unmatched]);

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rosterRows.filter((row) => {
      if (teamFilter && row.nationalTeamId !== teamFilter) return false;
      if (linkFilter === 'linked' && row.kind !== 'linked') return false;
      if (linkFilter === 'unmatched' && row.kind !== 'unmatched') return false;
      if (query && !row.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [rosterRows, teamFilter, linkFilter, search]);

  const filteredTeams = useMemo(() => {
    if (!teamFilter) return teams;
    return teams.filter((t) => t.id === teamFilter);
  }, [teams, teamFilter]);

  const counts = meta.counts ?? {};

  return (
    <div className="page dev-expanded dev-national">
      <div className="dev-expanded__banner" role="alert">
        <strong>Dev preview only</strong> — national teams are not live in browse, quiz, or daily.
        Staging data from <code>national-teams-preview.json</code>; do not merge until membership
        backfill passes audit.
      </div>

      <header className="page-header">
        <h1>National teams preview</h1>
        <p>
          Inspect TM national-team entities and club-registry links. Route:{' '}
          <code>/dev/national-teams</code> (hidden — not in main nav).
        </p>
      </header>

      {loadState === 'loading' && (
        <p className="dev-expanded__status" role="status">
          Loading national-teams preview…
        </p>
      )}

      {loadState === 'error' && (
        <section className="dev-expanded__status dev-expanded__status--error" role="alert">
          <h2>Could not load preview</h2>
          <p>{loadError}</p>
          <p className="dev-expanded__status-hint">
            Run <code>npm run build:national-teams-preview</code> and ensure{' '}
            <code>public/dev-data/national-teams-preview.json</code> exists.
          </p>
        </section>
      )}

      {loadState === 'ready' && (
        <>
          <section className="dev-expanded__stats" aria-label="Preview summary">
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">National teams</span>
              <strong>{counts.nationalTeams ?? teams.length}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Linked (FootyCompass)</span>
              <strong>{counts.playerLinks ?? links.length}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Unmatched</span>
              <strong>{counts.unmatchedNationalTeamPlayers ?? unmatched.length}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Inspection</span>
              <strong>{inspection.passed ? 'passed' : 'failed'}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">NT squad scrape</span>
              <strong>{inspection.ntSquadParentDataClean ? 'clean' : 'incomplete'}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Warnings</span>
              <strong>{counts.warnings ?? warnings.length}</strong>
            </div>
          </section>

          {inspection.notes?.length > 0 && (
            <section className="dev-national__inspection">
              <h2>Inspection notes</h2>
              <ul>
                {inspection.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="dev-national__inspection-meta">
                Link sources: NT squad parent {inspection.playerLinksFromNtSquad ?? 0} · TM{' '}
                <code>national_team.country</code>{' '}
                {inspection.playerLinksFromNationalTeamField ?? 0}
              </p>
            </section>
          )}

          {warnings.length > 0 && (
            <section className="dev-expanded__warnings">
              <h2>Preview warnings ({warnings.length})</h2>
              <ul>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="filters" aria-label="National team filters">
            <div className="filters__row">
              <label className="filter-field">
                <span>Country / team</span>
                <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <option value="">All national teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Link status</span>
                <select value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}>
                  {LINK_FILTERS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field filter-field--grow">
                <span>Search players</span>
                <input
                  type="search"
                  placeholder="Search by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <p className="filters__count">
              Showing {filteredRoster.length} of {rosterRows.length} squad rows (
              {links.length} linked, {unmatched.length} unmatched)
            </p>
          </section>

          <section className="dev-national__teams" aria-label="National teams">
            <h2>National teams</h2>
            <div className="dev-national__team-grid">
              {filteredTeams.map((team) => (
                <article key={team.id} className="dev-national__team-card">
                  <h3>{team.displayName}</h3>
                  <p className="dev-national__team-id">
                    <code>{team.id}</code> · TM <code>{team.tmCode}</code>
                  </p>
                  <dl className="dev-national__team-dl">
                    <div>
                      <dt>Confederation</dt>
                      <dd>{team.confederation ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>FIFA rank (TM)</dt>
                      <dd>{team.fifaRanking ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>TM squad size</dt>
                      <dd>{team.squadSizeReported ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Scraped NT-parent rows</dt>
                      <dd>{team.squadScrapedCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>TM national_team.country rows</dt>
                      <dd>{team.tmNationalTeamFieldCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>Linked in FootyCompass</dt>
                      <dd>{team.playerLinksCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>Unmatched</dt>
                      <dd>{team.unmatchedCount ?? 0}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="dev-expanded__table-wrap dev-national__roster" aria-label="Squad players">
            <h2>Squad players (linked + unmatched)</h2>
            <table className="dev-expanded__table">
              <thead>
                <tr>
                  <th>National team</th>
                  <th>Player</th>
                  <th>In FootyCompass</th>
                  <th>FootyCompass ID</th>
                  <th>Club (FootyCompass)</th>
                  <th>Position</th>
                  <th>Citizenship</th>
                  <th>Caps</th>
                  <th>Quiz</th>
                  <th>Link source</th>
                  <th>Missing fields</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((row) => {
                  const teamName = teamById[row.nationalTeamId]?.displayName ?? row.nationalTeamId;
                  const rowKey = `${row.kind}-${row.nationalTeamId}-${row.sourceId ?? row.playerId}-${row.name}`;

                  return (
                    <tr key={rowKey} className={row.kind === 'unmatched' ? 'dev-national__row--unmatched' : ''}>
                      <td data-label="National team">{teamName}</td>
                      <td data-label="Player">
                        {row.inFootyCompass && row.playerId ? (
                          <Link to={`/player/${row.playerId}`} className="dev-national__player-link">
                            {row.name}
                          </Link>
                        ) : (
                          <span>{row.name}</span>
                        )}
                        {row.sourceId && (
                          <small className="dev-expanded__id">tm-{row.sourceId}</small>
                        )}
                      </td>
                      <td data-label="In FootyCompass">
                        <span
                          className={`dev-expanded__pill ${
                            row.inFootyCompass
                              ? 'dev-expanded__pill--mvp-linked'
                              : 'dev-expanded__pill--generated-needs-editorial'
                          }`}
                        >
                          {row.inFootyCompass ? 'yes' : 'no'}
                        </span>
                      </td>
                      <td data-label="FootyCompass ID">
                        {row.playerId ? (
                          <code className="dev-expanded__id">{row.playerId}</code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td data-label="Club">{row.clubTeamId ?? (row.kind === 'unmatched' ? row.reason : '—')}</td>
                      <td data-label="Position">{row.position ?? '—'}</td>
                      <td data-label="Citizenship">{row.citizenship ?? '—'}</td>
                      <td data-label="Caps">
                        {row.internationalCaps != null ? row.internationalCaps : '—'}
                      </td>
                      <td data-label="Quiz">{row.quizEligible ? 'yes' : 'no'}</td>
                      <td data-label="Link source">
                        <code className="dev-expanded__id">{row.linkSource ?? '—'}</code>
                      </td>
                      <td data-label="Missing fields">
                        {row.missingFields?.length ? row.missingFields.join(', ') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRoster.length === 0 && (
              <p className="dev-expanded__empty">No players match the current filters.</p>
            )}
          </section>

          {preview.missingFields && Object.keys(preview.missingFields).length > 0 && (
            <section className="dev-national__missing">
              <h2>Missing fields (aggregate)</h2>
              <pre className="dev-national__pre">{JSON.stringify(preview.missingFields, null, 2)}</pre>
            </section>
          )}

          {meta.generatedAt && (
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
