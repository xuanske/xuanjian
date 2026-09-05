import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildChart } from "./calendar.ts";
import { localReading } from "./canon.ts";

describe("典籍辞章", () => {
  it("甲日寅月引三命通会春诀，离线可成文", () => {
    const chart = buildChart(new Date(1984, 1, 10), 12);
    const reading = localReading("bazi", { chart });
    const body = reading.sections.map((s) => s.body).join("\n");
    assert.match(body, /滴天髓/);
    assert.match(body, /三命通会|穷通宝鉴/);
    assert.match(reading.caution, /不是宿命/);
  });

  it("铜钱卦段首引周易", () => {
    const gua = {
      name: "既济",
      info: "水在火上，既济。思患而豫防之。",
      binary: "010101",
      lines: Array.from({ length: 6 }, (_, i) => ({ yang: i % 2 === 1, changing: false })),
    };
    const reading = localReading("gua", { gua });
    assert.equal(reading.sections[0]?.heading, "周易");
    assert.match(reading.sections[0]?.body ?? "", /既济/);
  });
});
