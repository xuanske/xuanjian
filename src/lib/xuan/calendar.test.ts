import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jianchuOf } from "./almanac.ts";
import {
  HEXAGRAMS,
  buildChart,
  buildGua,
  guaFromLines,
  hourBranchIndex,
  julianDay,
  lichunYear,
  nayinOf,
  pairOf,
  godOf,
  trueSolarShiftHours,
} from "./calendar.ts";

describe("玄鉴命盘", () => {
  it("1984 立春后为甲子年", () => {
    const y = lichunYear(new Date(1984, 5, 1));
    const p = pairOf(((y - 4) % 60 + 60) % 60);
    assert.equal(p.stem + p.branch, "甲子");
  });

  it("2024 立春后为甲辰年", () => {
    const chart = buildChart(new Date(2024, 5, 1), 12);
    assert.equal(chart.year.stem + chart.year.branch, "甲辰");
  });

  it("立春前仍属旧年", () => {
    const before = lichunYear(new Date(2024, 1, 3));
    const after = lichunYear(new Date(2024, 1, 4));
    assert.equal(before, 2023);
    assert.equal(after, 2024);
  });

  it("1949-10-01 日柱甲子", () => {
    const chart = buildChart(new Date(1949, 9, 1), 10);
    assert.equal(chart.day.stem + chart.day.branch, "甲子");
  });

  it("甲年寅月为丙寅，巳月为己巳", () => {
    const yin = buildChart(new Date(1984, 1, 10), 12);
    assert.equal(yin.year.stem + yin.year.branch, "甲子");
    assert.equal(yin.month.stem + yin.month.branch, "丙寅");
    const si = buildChart(new Date(1984, 5, 1), 12);
    assert.equal(si.month.stem + si.month.branch, "己巳");
  });

  it("甲日子时为甲，巳时为己", () => {
    const zi = buildChart(new Date(1949, 9, 1), 0);
    assert.equal(zi.hour.stem + zi.hour.branch, "甲子");
    const si = buildChart(new Date(1949, 9, 1), 10);
    assert.equal(si.hour.stem + si.hour.branch, "己巳");
  });

  it("时辰：子时跨夜，午时在正中", () => {
    assert.equal(hourBranchIndex(0), 0);
    assert.equal(hourBranchIndex(23), 0);
    assert.equal(hourBranchIndex(12), 6);
  });

  it("纳音：甲子海中金，甲辰覆灯火", () => {
    assert.equal(nayinOf("甲", "子"), "海中金");
    assert.equal(nayinOf("甲", "辰"), "覆灯火");
    const chart = buildChart(new Date(1984, 5, 1), 12);
    assert.equal(chart.nayin.year, "海中金");
  });

  it("建除：月支等于日支为建日", () => {
    const chart = buildChart(new Date(1984, 1, 10), 12);
    const jc = jianchuOf(chart);
    if (chart.month.branch === chart.day.branch) assert.equal(jc.name, "建");
    else assert.ok(jc.name.length === 1);
  });

  it("六十四卦 bits 不重复，屯既济位次正确", () => {
    assert.equal(HEXAGRAMS.length, 64);
    const bits = new Set(HEXAGRAMS.map((h) => h.bits));
    assert.equal(bits.size, 64);
    assert.equal(HEXAGRAMS.find((h) => h.name === "乾")?.bits, 0b111111);
    assert.equal(HEXAGRAMS.find((h) => h.name === "坤")?.bits, 0b000000);
    assert.equal(HEXAGRAMS.find((h) => h.name === "屯")?.bits, 0b010001);
    assert.equal(HEXAGRAMS.find((h) => h.name === "既济")?.bits, 0b010101);
    assert.equal(HEXAGRAMS.find((h) => h.name === "未济")?.bits, 0b101010);
  });

  it("铜钱卦六爻，可变出之卦", () => {
    let n = 1;
    const rand = () => {
      n = (n * 1103515245 + 12345) % 2147483648;
      return n / 2147483648;
    };
    const gua = buildGua(rand);
    assert.equal(gua.lines.length, 6);
    assert.ok(gua.name.length >= 1);
    const again = guaFromLines(gua.lines);
    assert.equal(again.name, gua.name);
  });

  it("儒略日稳定", () => {
    assert.equal(julianDay(2000, 1, 1), 2451545);
  });
});

  it("十神：甲见乙劫财、见丙食神、见己正财、见庚七杀", () => {
    assert.equal(godOf("甲", "甲"), "比肩");
    assert.equal(godOf("甲", "乙"), "劫财");
    assert.equal(godOf("甲", "丙"), "食神");
    assert.equal(godOf("甲", "己"), "正财");
    assert.equal(godOf("甲", "庚"), "七杀");
    assert.equal(godOf("乙", "甲"), "劫财");
    assert.equal(godOf("乙", "丁"), "食神");
  });

  it("真太阳时：乌鲁木齐经度比北京钟表时明显偏西", () => {
    const d = new Date(2024, 5, 15);
    const west = trueSolarShiftHours(d, 87.6);
    const east = trueSolarShiftHours(d, 121.5);
    assert.ok(west < -1.5, String(west));
    assert.ok(east > -0.2, String(east));
    const clock = buildChart(d, 12, "male");
    const solar = buildChart(d, 12, "male", 87.6);
    assert.ok(clock.hour.stem + clock.hour.branch !== solar.hour.stem + solar.hour.branch);
  });
