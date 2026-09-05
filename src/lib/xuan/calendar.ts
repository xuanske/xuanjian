import type { Chart, Gua, GuaLine, Pillar, Sex } from "./types.ts";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const STEM_EL = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"] as const;
export const BRANCH_EL = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"] as const;
export const HIDDEN: Record<(typeof BRANCHES)[number], string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const NAYIN = [
  "海中金",
  "炉中火",
  "大林木",
  "路旁土",
  "剑锋金",
  "山头火",
  "涧下水",
  "城头土",
  "白蜡金",
  "杨柳木",
  "泉中水",
  "屋上土",
  "霹雳火",
  "松柏木",
  "长流水",
  "砂中金",
  "山下火",
  "平地木",
  "壁上土",
  "金箔金",
  "覆灯火",
  "天河水",
  "大驿土",
  "钗钏金",
  "桑柘木",
  "大溪水",
  "沙中土",
  "天上火",
  "石榴木",
  "大海水",
] as const;

const JIEQI: Array<[number, number, number]> = [
  [2, 4, 2],
  [3, 6, 3],
  [4, 5, 4],
  [5, 6, 5],
  [6, 6, 6],
  [7, 7, 7],
  [8, 8, 8],
  [9, 8, 9],
  [10, 8, 10],
  [11, 7, 11],
  [12, 7, 0],
  [1, 6, 1],
];

export function julianDay(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

const JDN_1949_10_01 = julianDay(1949, 10, 1);
const DAY_OFFSET = (60 - (JDN_1949_10_01 % 60)) % 60;

export function pairOf(index: number): { stem: string; branch: string } {
  const i = ((index % 60) + 60) % 60;
  return { stem: STEMS[i % 10]!, branch: BRANCHES[i % 12]! };
}

export function lichunYear(date: Date): number {
  const y = date.getFullYear();
  const lichun = new Date(y, 1, 4);
  return date >= lichun ? y : y - 1;
}

function monthBranchIndex(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  let best = 1;
  let bestTime = -Infinity;
  for (const [mon, day, branch] of JIEQI) {
    const yy = mon === 1 ? (m === 1 ? y : y + 1) : y;
    const t = new Date(yy, mon - 1, day).getTime();
    if (t <= date.getTime() && t >= bestTime) {
      bestTime = t;
      best = branch;
    }
  }
  return best;
}

export function hourBranchIndex(hour: number): number {
  return Math.floor(((((hour + 1) % 24) + 24) % 24) / 2);
}

export function cycleIndex(stem: string, branch: string): number {
  const si = STEMS.indexOf(stem as (typeof STEMS)[number]);
  const bi = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === si && i % 12 === bi) return i;
  }
  return 0;
}

export function nayinOf(stem: string, branch: string): string {
  return NAYIN[Math.floor(cycleIndex(stem, branch) / 2)] ?? "海中金";
}

const GEN: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export function godOf(dayStem: string, stem: string): string {
  const d = STEMS.indexOf(dayStem as (typeof STEMS)[number]);
  const s = STEMS.indexOf(stem as (typeof STEMS)[number]);
  if (d < 0 || s < 0) return "";
  const same = d % 2 === s % 2;
  const de = STEM_EL[d]!;
  const se = STEM_EL[s]!;
  if (se === de) return same ? "比肩" : "劫财";
  if (GEN[de] === se) return same ? "食神" : "伤官";
  if (KE[de] === se) return same ? "偏财" : "正财";
  if (KE[se] === de) return same ? "七杀" : "正官";
  if (GEN[se] === de) return same ? "偏印" : "正印";
  return "";
}

/** Spencer 均时差，单位分钟。 */
export function equationOfTimeMinutes(date: Date): number {
  const y = date.getFullYear();
  const n = Math.floor((Date.UTC(y, date.getMonth(), date.getDate()) - Date.UTC(y, 0, 0)) / 86400000);
  const B = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 相对东八区（120°E）的真太阳时偏移（小时，可小数）。不填经度则 0。 */
export function trueSolarShiftHours(date: Date, lng?: number): number {
  if (lng == null || !Number.isFinite(lng)) return 0;
  return (4 * (lng - 120) + equationOfTimeMinutes(date)) / 60;
}


function pillar(stemIndex: number, branchIndex: number): Pillar {
  const stem = STEMS[((stemIndex % 10) + 10) % 10]!;
  const branch = BRANCHES[((branchIndex % 12) + 12) % 12]!;
  return {
    stem,
    branch,
    hidden: HIDDEN[branch],
    element: STEM_EL[STEMS.indexOf(stem as (typeof STEMS)[number])]!,
    nayin: nayinOf(stem, branch),
  };
}

export function buildChart(date: Date, hour: number, sex: Sex = "male", lng?: number): Chart {
  const shift = trueSolarShiftHours(date, lng);
  let absHour = hour + shift;
  const dayDelta = Math.floor(absHour / 24);
  absHour = ((absHour % 24) + 24) % 24;
  if (dayDelta !== 0) {
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayDelta);
  }
  hour = absHour;

  const solarYear = lichunYear(date);
  const yearIdx = ((solarYear - 4) % 60 + 60) % 60;
  const year = pairOf(yearIdx);
  const yStem = STEMS.indexOf(year.stem as (typeof STEMS)[number]);
  const mBranch = monthBranchIndex(date);
  const monthStemBase = [2, 4, 6, 8, 0][yStem % 5]!;
  const monthStem = (monthStemBase + ((mBranch - 2 + 12) % 12)) % 10;
  const dayIdx = (julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) + DAY_OFFSET) % 60;
  const day = pairOf(dayIdx);
  const dStem = STEMS.indexOf(day.stem as (typeof STEMS)[number]);
  const hBranch = hourBranchIndex(hour);
  const hourStemBase = [0, 2, 4, 6, 8][dStem % 5]!;
  const hourStem = (hourStemBase + hBranch) % 10;

  const yearP = pillar(yStem, yearIdx % 12);
  const monthP = pillar(monthStem, mBranch);
  const dayP = pillar(dStem, dayIdx % 12);
  const hourP = pillar(hourStem, hBranch);

  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of [yearP, monthP, dayP, hourP]) {
    counts[p.element] = (counts[p.element] ?? 0) + 2;
    for (const h of p.hidden) {
      const el = STEM_EL[STEMS.indexOf(h as (typeof STEMS)[number])];
      if (el) counts[el] = (counts[el] ?? 0) + 1;
    }
  }

  const dayMaster = dayP.stem;
  yearP.god = godOf(dayMaster, yearP.stem);
  monthP.god = godOf(dayMaster, monthP.stem);
  dayP.god = "日主";
  hourP.god = godOf(dayMaster, hourP.stem);

  const who = sex === "female" ? "坤造" : "乾造";
  const label = `${who} ${yearP.stem}${yearP.branch} ${monthP.stem}${monthP.branch} ${dayP.stem}${dayP.branch} ${hourP.stem}${hourP.branch}`;

  return {
    year: yearP,
    month: monthP,
    day: dayP,
    hour: hourP,
    dayMaster: dayP.stem,
    dayElement: dayP.element,
    counts,
    solarYear,
    label,
    nayin: { year: yearP.nayin, month: monthP.nayin, day: dayP.nayin, hour: hourP.nayin },
  };
}

const TRIGRAM: Record<string, number> = {
  乾: 0b111,
  兑: 0b011,
  离: 0b101,
  震: 0b001,
  巽: 0b110,
  坎: 0b010,
  艮: 0b100,
  坤: 0b000,
};

type HexDef = { name: string; upper: string; lower: string; info: string };

const HEX_DEFS: HexDef[] = [
  { name: "乾", upper: "乾", lower: "乾", info: "天行健，君子以自强不息。" },
  { name: "坤", upper: "坤", lower: "坤", info: "地势坤，君子以厚德载物。" },
  { name: "屯", upper: "坎", lower: "震", info: "云雷屯，君子以经纶。事之初，宜守正。" },
  { name: "蒙", upper: "艮", lower: "坎", info: "山下出泉，蒙。启蒙宜诚，勿躁进。" },
  { name: "需", upper: "坎", lower: "乾", info: "云上于天，需。有孚，光亨。等待其时。" },
  { name: "讼", upper: "乾", lower: "坎", info: "天与水违行，讼。争之无益，退一步海阔。" },
  { name: "师", upper: "坤", lower: "坎", info: "地中有水，师。众须有律，持正而行。" },
  { name: "比", upper: "坎", lower: "坤", info: "水在地上，比。亲辅得人，吉。" },
  { name: "小畜", upper: "巽", lower: "乾", info: "风行天上，小畜。密云不雨，蓄而后发。" },
  { name: "履", upper: "乾", lower: "兑", info: "上天下泽，履。素履往，无咎。" },
  { name: "泰", upper: "坤", lower: "乾", info: "天地交，泰。小往大来，通。" },
  { name: "否", upper: "乾", lower: "坤", info: "天地不交，否。俭德避难，不可荣以禄。" },
  { name: "同人", upper: "乾", lower: "离", info: "天与火，同人。出门同人，与人合志。" },
  { name: "大有", upper: "离", lower: "乾", info: "火在天上，大有。遏恶扬善，顺天休命。" },
  { name: "谦", upper: "坤", lower: "艮", info: "地中有山，谦。谦谦君子，卑以自牧。" },
  { name: "豫", upper: "震", lower: "坤", info: "雷出地奋，豫。作乐崇德。" },
  { name: "随", upper: "兑", lower: "震", info: "泽中有雷，随。向晦入宴息。顺时而动。" },
  { name: "蛊", upper: "艮", lower: "巽", info: "山下有风，蛊。振民育德。当振弊。" },
  { name: "临", upper: "坤", lower: "兑", info: "地泽临。教思无穷，容保民无疆。" },
  { name: "观", upper: "巽", lower: "坤", info: "风行地上，观。省方观民设教。" },
  { name: "噬嗑", upper: "离", lower: "震", info: "雷电噬嗑。明罚敕法。事有梗，须决。" },
  { name: "贲", upper: "艮", lower: "离", info: "山下有火，贲。文明以止。文饰勿过。" },
  { name: "剥", upper: "艮", lower: "坤", info: "山附于地，剥。厚下安宅。慎守。" },
  { name: "复", upper: "坤", lower: "震", info: "雷在地中，复。七日来复。阳气初生。" },
  { name: "无妄", upper: "乾", lower: "震", info: "天下雷行，物与无妄。对时育万物。" },
  { name: "大畜", upper: "艮", lower: "乾", info: "天在山中，大畜。多识前言往行。" },
  { name: "颐", upper: "艮", lower: "震", info: "山下有雷，颐。慎言语，节饮食。" },
  { name: "大过", upper: "兑", lower: "巽", info: "泽灭木，大过。独立不惧，遁世无闷。" },
  { name: "坎", upper: "坎", lower: "坎", info: "水洊至，习坎。常德行，习教事。" },
  { name: "离", upper: "离", lower: "离", info: "明两作，离。大人以继明照于四方。" },
  { name: "咸", upper: "兑", lower: "艮", info: "山上有泽，咸。虚受人。感应以诚。" },
  { name: "恒", upper: "震", lower: "巽", info: "雷风恒。立不易方。久于其道。" },
  { name: "遁", upper: "乾", lower: "艮", info: "天下有山，遁。远小人，不恶而严。" },
  { name: "大壮", upper: "震", lower: "乾", info: "雷在天上，大壮。非礼弗履。" },
  { name: "晋", upper: "离", lower: "坤", info: "明出地上，晋。自昭明德。" },
  { name: "明夷", upper: "坤", lower: "离", info: "明入地中，明夷。莅众，用晦而明。" },
  { name: "家人", upper: "巽", lower: "离", info: "风自火出，家人。言有物，行有恒。" },
  { name: "睽", upper: "离", lower: "兑", info: "上火下泽，睽。同而异。求同存异。" },
  { name: "蹇", upper: "坎", lower: "艮", info: "山上有水，蹇。反身修德。险在前。" },
  { name: "解", upper: "震", lower: "坎", info: "雷雨作，解。赦过宥罪。困解宜缓。" },
  { name: "损", upper: "艮", lower: "兑", info: "山下有泽，损。惩忿窒欲。" },
  { name: "益", upper: "巽", lower: "震", info: "风雷益。见善则迁，有过则改。" },
  { name: "夬", upper: "兑", lower: "乾", info: "泽上于天，夬。施禄及下。决而须正。" },
  { name: "姤", upper: "乾", lower: "巽", info: "天下有风，姤。后以施命诰四方。" },
  { name: "萃", upper: "兑", lower: "坤", info: "泽上于地，萃。除戎器，戒不虞。" },
  { name: "升", upper: "坤", lower: "巽", info: "地中生木，升。积小以高大。" },
  { name: "困", upper: "兑", lower: "坎", info: "泽无水，困。致命遂志。" },
  { name: "井", upper: "坎", lower: "巽", info: "木上有水，井。劳民劝相。井养而不穷。" },
  { name: "革", upper: "兑", lower: "离", info: "泽中有火，革。治历明时。己日乃孚。" },
  { name: "鼎", upper: "离", lower: "巽", info: "木上有火，鼎。正位凝命。取新。" },
  { name: "震", upper: "震", lower: "震", info: "洊雷震。恐惧修省。" },
  { name: "艮", upper: "艮", lower: "艮", info: "兼山艮。思不出其位。止其所。" },
  { name: "渐", upper: "巽", lower: "艮", info: "山上有木，渐。居贤德善俗。循序。" },
  { name: "归妹", upper: "震", lower: "兑", info: "泽上有雷，归妹。永终知敝。" },
  { name: "丰", upper: "震", lower: "离", info: "雷电皆至，丰。折狱致刑。宜日中。" },
  { name: "旅", upper: "离", lower: "艮", info: "山上有火，旅。明慎用刑，而不留狱。" },
  { name: "巽", upper: "巽", lower: "巽", info: "随风巽。申命行事。" },
  { name: "兑", upper: "兑", lower: "兑", info: "丽泽兑。朋友讲习。亨，利贞。" },
  { name: "涣", upper: "巽", lower: "坎", info: "风行水上，涣。享于帝立庙。" },
  { name: "节", upper: "坎", lower: "兑", info: "泽上有水，节。制度数，议德行。" },
  { name: "中孚", upper: "巽", lower: "兑", info: "泽上有风，中孚。议狱缓死。信及豚鱼。" },
  { name: "小过", upper: "震", lower: "艮", info: "山上有雷，小过。行过乎恭。可小事。" },
  { name: "既济", upper: "坎", lower: "离", info: "水在火上，既济。思患而豫防之。" },
  { name: "未济", upper: "离", lower: "坎", info: "火在水上，未济。慎辨物居方。事未完。" },
];

export const HEXAGRAMS: Array<{ bits: number; name: string; info: string }> = HEX_DEFS.map((h) => ({
  bits: (TRIGRAM[h.lower] ?? 0) | ((TRIGRAM[h.upper] ?? 0) << 3),
  name: h.name,
  info: h.info,
}));

function findHex(bits: number) {
  return HEXAGRAMS.find((h) => h.bits === bits) ?? HEXAGRAMS[0]!;
}

export function tossLine(rand: () => number): GuaLine {
  const coins = [0, 1, 2].map(() => (rand() < 0.5 ? 2 : 3));
  const sum = coins.reduce((a, b) => a + b, 0);
  return { yang: sum === 7 || sum === 9, changing: sum === 6 || sum === 9 };
}

export function guaFromLines(lines: GuaLine[]): Gua {
  let bits = 0;
  let changed = 0;
  lines.forEach((line, i) => {
    if (line.yang) bits |= 1 << i;
    const yang = line.changing ? !line.yang : line.yang;
    if (yang) changed |= 1 << i;
  });
  const now = findHex(bits);
  const next = findHex(changed);
  return {
    name: now.name,
    info: now.info,
    binary: bits.toString(2).padStart(6, "0"),
    lines,
    changeName: next.name === now.name ? undefined : next.name,
  };
}

export function buildGua(rand: () => number = Math.random): Gua {
  return guaFromLines(Array.from({ length: 6 }, () => tossLine(rand)));
}

export function todayStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseBirth(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
  if (dt.getFullYear() !== y || dt.getMonth() !== (m ?? 1) - 1) return null;
  if (y! < 1900 || y! > 2100) return null;
  return dt;
}

export function hourLabel(hour: number): string {
  const b = BRANCHES[hourBranchIndex(hour)];
  return `${b}时`;
}

export function chartSummary(chart: Chart): string {
  const ranked = Object.entries(chart.counts).sort((a, b) => b[1] - a[1]);
  return `日主${chart.dayMaster}（${chart.dayElement}）。纳音 ${chart.nayin.day}。五行旺衰：${ranked.map(([k, v]) => `${k}${v}`).join(" ")}。`;
}
