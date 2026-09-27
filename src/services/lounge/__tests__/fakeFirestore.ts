/**
 * Minimal in-memory stand-in for the subset of the modular Firestore API used
 * by loungeStorage / loungeConsent. Test-only.
 */
export const DELETE_FIELD = { __fake: "deleteField" } as const;
export const SERVER_TS = { __fake: "serverTimestamp" } as const;

type Data = Record<string, unknown>;
interface Ref { path: string; id: string }
interface ColRef { __col: true; path: string }
type Constraint =
  | { type: "where"; field: string; value: unknown }
  | { type: "orderBy"; field: string; dir: "asc" | "desc" }
  | { type: "limit"; n: number };
interface Query { path: string; constraints: Constraint[] }

export function createFakeFirestore() {
  const store = new Map<string, Data>();
  const state = { failCommitAfter: Infinity, commits: 0 };

  const parentOf = (path: string) => path.split("/").slice(0, -1).join("/");

  const applyWrite = (path: string, data: Data, merge: boolean) => {
    const base: Data = merge ? { ...(store.get(path) ?? {}) } : {};
    for (const [k, v] of Object.entries(data)) {
      if (v === DELETE_FIELD) delete base[k];
      else if (v === SERVER_TS) base[k] = new Date("2026-09-27T08:00:00Z");
      else base[k] = v;
    }
    store.set(path, base);
  };

  const sortKey = (v: unknown): number | string => (v instanceof Date ? v.getTime() : typeof v === "number" ? v : String(v ?? ""));

  const api = {
    collection: (_db: unknown, ...segs: string[]): ColRef => ({ __col: true, path: segs.join("/") }),
    doc: (base: unknown, ...segs: string[]): Ref => {
      const path = base && typeof base === "object" && "__col" in (base as ColRef) ? `${(base as ColRef).path}/${segs.join("/")}` : segs.join("/");
      return { path, id: path.split("/").pop() ?? "" };
    },
    query: (base: ColRef | Query, ...constraints: Constraint[]): Query => ({
      path: base.path,
      constraints: [...("constraints" in base ? base.constraints : []), ...constraints],
    }),
    where: (field: string, _op: string, value: unknown): Constraint => ({ type: "where", field, value }),
    orderBy: (field: string, dir: "asc" | "desc" = "asc"): Constraint => ({ type: "orderBy", field, dir }),
    limit: (n: number): Constraint => ({ type: "limit", n }),
    getDocs: async (q: ColRef | Query) => {
      const constraints = "constraints" in q ? q.constraints : [];
      let rows = [...store.entries()].filter(([p]) => parentOf(p) === q.path);
      for (const c of constraints) {
        if (c.type === "where") rows = rows.filter(([, d]) => d[c.field] === c.value);
      }
      for (const c of constraints) {
        if (c.type === "orderBy") {
          rows.sort(([, a], [, b]) => {
            const x = sortKey(a[c.field]);
            const y = sortKey(b[c.field]);
            const r = x < y ? -1 : x > y ? 1 : 0;
            return c.dir === "desc" ? -r : r;
          });
        }
      }
      for (const c of constraints) if (c.type === "limit") rows = rows.slice(0, c.n);
      const docs = rows.map(([p, d]) => ({ id: p.split("/").pop() ?? "", ref: { path: p, id: p.split("/").pop() ?? "" }, data: () => ({ ...d }) }));
      return { docs, empty: docs.length === 0 };
    },
    getDoc: async (ref: Ref) => ({ exists: () => store.has(ref.path), data: () => ({ ...(store.get(ref.path) ?? {}) }), id: ref.id }),
    setDoc: async (ref: Ref, data: Data, opts?: { merge?: boolean }) => applyWrite(ref.path, data, !!opts?.merge),
    deleteDoc: async (ref: Ref) => {
      store.delete(ref.path);
    },
    writeBatch: () => {
      const ops: Array<() => void> = [];
      return {
        set: (ref: Ref, data: Data, opts?: { merge?: boolean }) => ops.push(() => applyWrite(ref.path, data, !!opts?.merge)),
        delete: (ref: Ref) => ops.push(() => store.delete(ref.path)),
        commit: async () => {
          state.commits += 1;
          if (state.commits > state.failCommitAfter) throw new Error("synthetic commit failure");
          ops.forEach((op) => op());
        },
      };
    },
    deleteField: () => DELETE_FIELD,
    serverTimestamp: () => SERVER_TS,
    Timestamp: { fromDate: (d: Date) => d },
  };
  return { store, state, api };
}
