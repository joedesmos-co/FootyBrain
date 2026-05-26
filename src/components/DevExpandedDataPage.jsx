import { Fragment, useEffect, useMemo, useState } from 'react';
import { teams, leagues } from '../data/sampleData';

const PREVIEW_URL = `${import.meta.env.BASE_URL}dev-data/footybrain-app-ready-preview.json`;
const DRAFT_OVERLAY_URL = `${import.meta.env.BASE_URL}dev-data/players.generated-draft.json`;

const DATA_STATUSES = [
  'mvp-linked',
  'manual-only',
  'generated-needs-editorial',
];

const EDITORIAL_FILTERS = [
  { value: '', label: 'All editorial' },
  { value: 'has-draft', label: 'Has draft editorial' },
  { value: 'needs-editorial', label: 'Needs editorial' },
];

const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
const leagueNameById = Object.fromEntries(leagues.map((t) => [t.id, t.name]));

function playerDisplayName(player) {
  return player.displayName ?? player.name ?? player.id;
}

function getEditorialStatus(player, draftById) {
  if (draftById.has(player.id)) return 'has-draft';
  if (player.dataStatus === 'generated-needs-editorial') return 'needs-editorial';
  if (player.rosterTier === 'featured') return 'mvp-featured';
  return '—';
}

export default function DevExpandedDataPage() {
  const [bundle, setBundle] = useState(null);
  const [draftById, setDraftById] = useState(new Map());
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [draftLoadWarning, setDraftLoadWarning] = useState(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editorialFilter, setEditorialFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDevData() {
      setLoadState('loading');
      setLoadError(null);
      setDraftLoadWarning(null);

      try {
        const previewRes = await fetch(PREVIEW_URL);
        if (!previewRes.ok) {
          throw new Error(`HTTP ${previewRes.status} loading app-ready preview`);
        }
        const previewData = await previewRes.json();
        if (!Array.isArray(previewData?.players)) {
          throw new Error('App-ready preview JSON missing players array');
        }

        let draftMap = new Map();
        try {
          const draftRes = await fetch(DRAFT_OVERLAY_URL);
          if (!draftRes.ok) {
            setDraftLoadWarning(
              `Draft overlay not loaded (HTTP ${draftRes.status}). Editorial draft badges unavailable.`,
            );
          } else {
            const draftData = await draftRes.json();
            if (Array.isArray(draftData?.players)) {
              draftMap = new Map(draftData.players.map((entry) => [entry.id, entry]));
            } else {
              setDraftLoadWarning('Draft overlay JSON missing players array.');
            }
          }
        } catch {
          setDraftLoadWarning('Draft overlay could not be loaded. Editorial draft badges unavailable.');
        }

        if (cancelled) return;
        setBundle(previewData);
        setDraftById(draftMap);
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        setBundle(null);
        setDraftById(new Map());
        setLoadError(err instanceof Error ? err.message : 'Failed to load preview data');
        setLoadState('error');
      }
    }

    loadDevData();
    return () => {
      cancelled = true;
    };
  }, []);

  const players = useMemo(() => bundle?.players ?? [], [bundle]);
  const meta = bundle?.meta ?? {};
  const draftCount = draftById.size;

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

      const editorialStatus = getEditorialStatus(player, draftById);
      if (editorialFilter === 'has-draft' && editorialStatus !== 'has-draft') return false;
      if (editorialFilter === 'needs-editorial' && editorialStatus !== 'needs-editorial') {
        return false;
      }

      if (query && !playerDisplayName(player).toLowerCase().includes(query)) return false;
      return true;
    });
  }, [players, teamFilter, statusFilter, editorialFilter, search, draftById]);

  const counts = meta?.counts ?? {};
  const needsEditorialCount =
    counts.generatedNeedsEditorial ??
    players.filter((p) => p.dataStatus === 'generated-needs-editorial').length;

  return (
    <div className="page dev-expanded">
      <div className="dev-expanded__banner" role="alert">
        <strong>Dev preview only</strong> — not used by the main app or quizzes. Squad draft
        editorial is inspection-only; <code>quizEligible</code> stays off for generated players.
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
          Loading preview and draft overlay…
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

      {loadState === 'ready' && draftLoadWarning && (
        <p className="dev-expanded__status dev-expanded__status--warn" role="status">
          {draftLoadWarning}
        </p>
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
              <span className="dev-expanded__stat-label">Draft overlays</span>
              <strong>{draftCount}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Needs editorial</span>
              <strong>{needsEditorialCount}</strong>
            </div>
            <div className="dev-expanded__stat">
              <span className="dev-expanded__stat-label">Still need draft</span>
              <strong>{Math.max(0, needsEditorialCount - draftCount)}</strong>
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

              <label className="filter-field">
                <span>Editorial</span>
                <select
                  value={editorialFilter}
                  onChange={(e) => setEditorialFilter(e.target.value)}
                >
                  {EDITORIAL_FILTERS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
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
                  <th>Editorial</th>
                  <th>Review</th>
                  <th>Data status</th>
                  <th>Quiz</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const draft = draftById.get(player.id);
                  const editorialStatus = getEditorialStatus(player, draftById);
                  const reviewStatus = draft?.reviewStatus ?? '—';

                  return (
                    <Fragment key={player.id}>
                      <tr>
                        <td data-label="Name">
                          <span className="dev-expanded__name">{playerDisplayName(player)}</span>
                          <small className="dev-expanded__id">{player.id}</small>
                        </td>
                        <td data-label="Team">{teamNameById[player.teamId] ?? player.teamId}</td>
                        <td data-label="League">
                          {leagueNameById[player.leagueId] ?? player.leagueId}
                        </td>
                        <td data-label="Position">{player.position ?? '—'}</td>
                        <td data-label="Editorial">
                          <span
                            className={`dev-expanded__pill dev-expanded__pill--editorial-${editorialStatus}`}
                          >
                            {editorialStatus}
                          </span>
                        </td>
                        <td data-label="Review">{reviewStatus}</td>
                        <td data-label="Data status">
                          <span
                            className={`dev-expanded__pill dev-expanded__pill--${player.dataStatus}`}
                          >
                            {player.dataStatus}
                          </span>
                        </td>
                        <td data-label="Quiz">{player.quizEligible ? 'yes' : 'no'}</td>
                        <td data-label="Tier">{player.rosterTier}</td>
                      </tr>
                      {draft && (
                        <tr className="dev-expanded__detail-row">
                          <td colSpan={9}>
                            <details className="dev-expanded__draft-details">
                              <summary>Draft editorial preview</summary>
                              <p>
                                <strong>quickFact:</strong> {draft.quickFact}
                              </p>
                              <p>
                                <strong>playingStyle:</strong> {draft.playingStyle}
                              </p>
                              <p>
                                <strong>importanceScore:</strong> {draft.importanceScore}{' '}
                                <span className="dev-expanded__muted">
                                  (not used in quiz — quizEligible: false)
                                </span>
                              </p>
                              <ol className="dev-expanded__hints">
                                {draft.quizHints.map((hint) => (
                                  <li key={hint}>{hint}</li>
                                ))}
                              </ol>
                            </details>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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
