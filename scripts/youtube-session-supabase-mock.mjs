function mk(prefix, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i}`,
    title: `${prefix}${i}`,
  }));
}

export const calls = { db: [], edge: [] };

let dbImpl = async () => ({ data: { videos: mk('c', 5) } });
let edgeImpl = async () => ({
  data: {
    success: true,
    videos: mk('m', 10),
    nextPageToken: 'T1',
    paginationSource: 'primary',
  },
});

export function resetYouTubeMock() {
  calls.db = [];
  calls.edge = [];
  dbImpl = async () => ({ data: { videos: mk('c', 5) } });
  edgeImpl = async () => ({
    data: {
      success: true,
      videos: mk('m', 10),
      nextPageToken: 'T1',
      paginationSource: 'primary',
    },
  });
}

export function setYouTubeMock({ db, edge } = {}) {
  if (db) dbImpl = db;
  if (edge) edgeImpl = edge;
}

export { mk };

export const supabase = {
  from() {
    const q = {
      ids: [],
      select() {
        return q;
      },
      in(_col, ids) {
        q.ids = ids;
        return q;
      },
      limit() {
        return q;
      },
      async maybeSingle() {
        const ids = q.ids;
        calls.db.push(ids);
        return dbImpl(ids);
      },
    };
    return q;
  },
  functions: {
    async invoke(_name, { body } = {}) {
      calls.edge.push(body);
      return edgeImpl(body);
    },
  },
};
