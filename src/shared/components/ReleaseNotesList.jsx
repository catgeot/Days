import {
  RELEASE_CATEGORY_LABELS,
  formatReleaseDate,
  getAllReleases,
} from '../../data/releaseNotes';

function ReleaseNotesList({ compact = false }) {
  const releases = getAllReleases();

  if (releases.length === 0) {
    return (
      <p className="text-sm text-gray-500 break-keep">
        아직 등록된 업데이트 내역이 없습니다.
      </p>
    );
  }

  return (
    <ul className={compact ? 'space-y-4' : 'space-y-5'}>
      {releases.map((release, index) => {
        const categoryLabel = release.category
          ? RELEASE_CATEGORY_LABELS[release.category]
          : null;

        return (
          <li
            key={release.id}
            className={`rounded-xl border border-white/10 bg-white/[0.03] ${
              compact ? 'p-4' : 'p-5'
            } ${index === 0 ? 'border-blue-500/25 bg-blue-500/[0.06]' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <time
                dateTime={release.id}
                className="text-[11px] font-mono text-gray-500 tracking-wide"
              >
                {formatReleaseDate(release)}
              </time>
              {categoryLabel ? (
                <span className="rounded-md bg-blue-500/15 border border-blue-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-300">
                  {categoryLabel}
                </span>
              ) : null}
              {index === 0 ? (
                <span className="rounded-md bg-emerald-500/15 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300">
                  최신
                </span>
              ) : null}
            </div>

            <p className={`font-bold text-white break-keep ${compact ? 'text-sm' : 'text-base'}`}>
              {release.title}
            </p>

            {release.items?.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-sm text-gray-300 break-keep leading-relaxed">
                {release.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default ReleaseNotesList;
