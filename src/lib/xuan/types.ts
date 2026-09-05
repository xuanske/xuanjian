export const KINDS = ["today", "ask", "bazi", "gua"] as const;
export type Kind = (typeof KINDS)[number];

export type Sex = "male" | "female";

export type Pillar = {
  stem: string;
  branch: string;
  hidden: string[];
  element: string;
  nayin: string;
  god?: string;
};

export type Chart = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  dayMaster: string;
  dayElement: string;
  counts: Record<string, number>;
  solarYear: number;
  label: string;
  nayin: { year: string; month: string; day: string; hour: string };
};

export type GuaLine = {
  yang: boolean;
  changing: boolean;
};

export type Gua = {
  name: string;
  info: string;
  binary: string;
  lines: GuaLine[];
  changeName?: string;
};

export type Jianchu = {
  name: string;
  yi: string;
  ji: string;
};

export type Section = {
  heading: string;
  body: string;
};

export type Reading = {
  id: string;
  at: number;
  kind: Kind;
  title: string;
  verdict: string;
  sections: Section[];
  advice: string[];
  caution: string;
  chart?: Chart;
  gua?: Gua;
  jianchu?: Jianchu;
  question?: string;
};

export type CastInput = {
  kind: Kind;
  question?: string;
  birth?: string;
  hour?: number;
  sex?: Sex;
  name?: string;
  lines?: GuaLine[];
  when?: string;
  lng?: number;
};
