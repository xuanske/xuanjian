import { BRANCHES, buildChart } from "./calendar.ts";
import type { Chart, Jianchu, Sex } from "./types.ts";

export const JIANCHU: Jianchu[] = [
  { name: "建", yi: "出行 上任 结交", ji: "动土 开仓" },
  { name: "除", yi: "扫舍 求医 沐浴", ji: "嫁娶 远行" },
  { name: "满", yi: "祭祀 祈福 入宅", ji: "动土 送葬" },
  { name: "平", yi: "修饰 祭祀 会友", ji: "求医 开市" },
  { name: "定", yi: "嫁娶 开市 入宅", ji: "诉讼 出行" },
  { name: "执", yi: "捕捉 开市 造作", ji: "迁徙 远行" },
  { name: "破", yi: "破屋 求医 拆旧", ji: "嫁娶 开市" },
  { name: "危", yi: "祭祀 入宅 安床", ji: "登高 远行" },
  { name: "成", yi: "嫁娶 开市 入学", ji: "诉讼 安葬" },
  { name: "收", yi: "收纳 开仓 习艺", ji: "开市 出行" },
  { name: "开", yi: "入学 开市 出行", ji: "安葬 动土" },
  { name: "闭", yi: "祭祀 蓄藏 安床", ji: "出行 开市" },
];

export function jianchuOf(chart: Chart): Jianchu {
  const m = BRANCHES.indexOf(chart.month.branch as (typeof BRANCHES)[number]);
  const d = BRANCHES.indexOf(chart.day.branch as (typeof BRANCHES)[number]);
  const i = (((d - m) % 12) + 12) % 12;
  return JIANCHU[i] ?? JIANCHU[0]!;
}

export function todayAlmanac(now = new Date(), sex: Sex = "male") {
  const chart = buildChart(now, now.getHours(), sex);
  return { chart, jianchu: jianchuOf(chart) };
}
