import { create } from "zustand";
import { buildGua } from "@/lib/xuan/calendar";
import { castReading } from "@/lib/xuan/api";
import type { CastInput, Gua, Kind, Reading, Sex } from "@/lib/xuan/types";

const SAVE_KEY = "xuanjian.save.v2";
const DAILY_CAP = 8;

type Persist = {
  name: string;
  birth: string;
  hour: number;
  lng: string;
  sex: Sex;
  history: Reading[];
  castsToday: { stamp: string; n: number };
};

type Screen = "home" | "form" | "cast" | "result" | "history";

type State = Persist & {
  screen: Screen;
  kind: Kind;
  question: string;
  current: Reading | null;
  pendingGua: Gua | null;
  error: string | null;
  hydrate: () => void;
  persist: () => void;
  go: (screen: Screen) => void;
  setKind: (kind: Kind) => void;
  setProfile: (patch: Partial<Pick<Persist, "name" | "birth" | "hour" | "lng" | "sex">>) => void;
  setQuestion: (question: string) => void;
  begin: (kind: Kind) => void;
  cast: () => Promise<void>;
  open: (reading: Reading) => void;
};

export function todayStamp(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const empty = (): Persist => ({
  name: "",
  birth: "",
  hour: 12,
  lng: "",
  sex: "male",
  history: [],
  castsToday: { stamp: todayStamp(), n: 0 },
});

function readSave(): Persist {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<Persist>) };
  } catch {
    return empty();
  }
}

function writeSave(data: Persist) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

function slice(s: Persist): Persist {
  return {
    name: s.name,
    birth: s.birth,
    hour: s.hour,
    sex: s.sex,
    history: s.history.slice(0, 24),
    castsToday: s.castsToday,
  };
}

export const useXuan = create<State>((set, get) => ({
  ...empty(),
  screen: "home",
  kind: "today",
  question: "",
  current: null,
  pendingGua: null,
  error: null,
  hydrate: () => {
    const saved = readSave();
    const stamp = todayStamp();
    if (saved.castsToday.stamp !== stamp) saved.castsToday = { stamp, n: 0 };
    set(saved);
  },
  persist: () => writeSave(slice(get())),
  go: (screen) => set({ screen, error: null }),
  setKind: (kind) => set({ kind }),
  setProfile: (patch) => {
    set(patch);
    get().persist();
  },
  setQuestion: (question) => set({ question }),
  begin: (kind) => {
    const hour = kind === "bazi" ? get().hour : new Date().getHours();
    set({ kind, screen: "form", error: null, current: null, pendingGua: null, hour });
  },
  open: (reading) => set({ current: reading, screen: "result", pendingGua: null }),
  cast: async () => {
    const s = get();
    const stamp = todayStamp();
    const used = s.castsToday.stamp === stamp ? s.castsToday.n : 0;
    if (used >= DAILY_CAP) {
      set({ error: "今日已鉴满八次。明日再来，免得把一件事问成一团。" });
      return;
    }
    if ((s.kind === "ask" || s.kind === "gua") && !s.question.trim()) {
      set({ error: "先写清要问的那一件事。" });
      return;
    }
    if (s.kind === "bazi" && !s.birth) {
      set({ error: "排盘需要公历生辰。" });
      return;
    }
    const gua = s.kind === "gua" ? buildGua() : null;
    set({ screen: "cast", error: null, pendingGua: gua });
    const payload: CastInput = {
      kind: s.kind,
      question: s.question.trim() || undefined,
      birth: s.birth || undefined,
      hour: s.hour,
      lng: s.lng,
      sex: s.sex,
      name: s.name.trim() || undefined,
      lines: gua?.lines,
      when: stamp,
      lng: s.lng.trim() ? Number(s.lng) : undefined,
    };
    try {
      const res = await castReading({ data: payload });
      if (!res.ok) {
        set({ screen: "form", error: res.error });
        return;
      }
      const history = [res.reading, ...s.history].slice(0, 24);
      set({
        current: res.reading,
        history,
        castsToday: { stamp, n: used + 1 },
        screen: "result",
        pendingGua: null,
      });
      get().persist();
    } catch {
      set({ screen: "form", error: "暂时未能请到辞章。过一会儿再试。" });
    }
  },
}));
