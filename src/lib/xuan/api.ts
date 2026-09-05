import { z } from "zod";
import { jianchuOf } from "./almanac";
import { buildChart, buildGua, chartSummary, guaFromLines, lichunYear, parseBirth } from "./calendar";
import type { CastInput, Gua, Kind, Reading, Section } from "./types";

const Input = z.object({
  kind: z.enum(["today", "ask", "bazi", "gua"]),
  question: z.string().max(200).optional(),
  birth: z.string().max(16).optional(),
  hour: z.number().min(0).max(23).optional(),
  sex: z.enum(["male", "female"]).optional(),
  name: z.string().max(20).optional(),
  lines: z.array(z.object({ yang: z.boolean(), changing: z.boolean() })).length(6).optional(),
  when: z.string().max(16).optional(),
  lng: z.number().min(70).max(150).optional(),
});

function extractJson(text: string): {
  title?: string;
  verdict?: string;
  sections?: Section[];
  advice?: string[];
  caution?: string;
} | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as {
      title?: string;
      verdict?: string;
      sections?: Section[];
      advice?: string[];
      caution?: string;
    };
  } catch {
    return null;
  }
}

function fallbackReading(kind: Kind, extra: string): Pick<Reading, "title" | "verdict" | "sections" | "advice" | "caution"> {
  return {
    title: kind === "gua" ? "卦已成" : "盘已排",
    verdict: extra || "辞章暂未能请到。先看盘面，再择日重问。",
    sections: [{ heading: "说明", body: extra || "今日未能接通辞章。四柱与卦象仍按历法排出，不作空话敷衍。" }],
    advice: ["先把眼前一件事做完", "少翻来覆去地求第二卦"],
    caution: "此为历法排盘，娱乐参考，不是宿命。",
  };
}

function systemPrompt(): string {
  return `你是「玄鉴」的命理执笔。用现代汉语写，可夹一句文言，不要装神弄鬼，不要保证发财婚姻，不要恐吓，不要编造精确应期。
必须只输出一个 JSON 对象，键为：
title (短题), verdict (一句断语，不超过 40 字), sections (数组，每项 heading 与 body), advice (2-4 条可执行建议), caution (一句边界)。
sections 2-3 段即可。不要用 Markdown，不要用 emoji。`;
}

function todayFromInput(input: CastInput): Date {
  return parseBirth(input.when ?? "") ?? new Date();
}

function userPrompt(input: CastInput): {
  text: string;
  chart?: ReturnType<typeof buildChart>;
  gua?: Gua;
} {
  const now = todayFromInput(input);
  const sex = input.sex ?? "male";
  const name = input.name?.trim() || "未署";
  const hour = input.hour ?? 12;
  const natal = input.birth ? parseBirth(input.birth) : null;
  const natalChart = natal ? buildChart(natal, hour, sex, input.lng) : undefined;
  const whenLabel = input.when || now.toISOString().slice(0, 10);

  if (input.kind === "today") {
    const chart = buildChart(now, hour, sex, input.lng);
    const jc = jianchuOf(chart);
    return {
      chart,
      text: `请写今日运势。求测者当地公历 ${whenLabel} ${String(hour).padStart(2, "0")}时。今日盘：${chart.label}。${chartSummary(chart)}建除${jc.name}日，宜${jc.yi}，忌${jc.ji}。${
        natalChart ? `求测者本命：${natalChart.label}。${chartSummary(natalChart)}请把今日盘与本命对照。` : "未提供生辰，只按今日黄历与日柱写，勿假装有八字。"
      }姓名：${name}。`,
    };
  }
  if (input.kind === "bazi") {
    if (!natalChart) return { text: "生辰缺失。" };
    return {
      chart: natalChart,
      text: `请批八字。公历 ${input.birth} ${String(hour).padStart(2, "0")}时。${natalChart.label}。${chartSummary(natalChart)}姓名：${name}。求测当日 ${whenLabel}，立春年 ${lichunYear(now)}。从日主、月令、用神忌神、近年注意事项写，点到流年即可，勿编造精确应期。`,
    };
  }
  if (input.kind === "gua") {
    const gua = input.lines && input.lines.length === 6 ? guaFromLines(input.lines) : buildGua();
    return {
      gua,
      chart: natalChart,
      text: `请解铜钱卦。本卦${gua.name}：${gua.info}${gua.changeName ? ` 之卦${gua.changeName}。` : " 无之卦。"}所问：${input.question?.trim() || "未明言一事，作总览。"} ${
        natalChart ? `命盘 ${natalChart.label}。` : "未提供生辰。"
      }姓名：${name}。`,
    };
  }
  return {
    chart: natalChart,
    text: `请断一事。问题：${input.question?.trim() || "未写清"}。${
      natalChart ? `命盘 ${natalChart.label}。${chartSummary(natalChart)}` : "未提供生辰，只按问题断，勿假装排盘。"
    }姓名：${name}。语气克制，给可做与不可做。`,
  };
}

async function askGrok(apiKey: string, user: string): Promise<string | null> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? null;
}

export async function runCastReading(
  input: unknown,
): Promise<{ ok: true; reading: Reading } | { ok: false; error: string }> {
  const data = Input.parse(input);
  const built = userPrompt(data);
  const apiKey = process.env.XAI_API_KEY;
  const extra = built.chart
    ? chartSummary(built.chart)
    : built.gua
    ? `${built.gua.name}：${built.gua.info}`
    : "";
  let prose = fallbackReading(data.kind, extra);

  if (apiKey) {
    try {
    let text = await askGrok(apiKey, built.text);
    if (!text) text = await askGrok(apiKey, built.text);
    const parsed = text ? extractJson(text) : null;
    if (parsed?.verdict) {
      prose = {
      title: String(parsed.title || "鉴").slice(0, 20),
      verdict: String(parsed.verdict).slice(0, 80),
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.slice(0, 4).map((s) => ({
          heading: String(s.heading ?? "").slice(0, 16),
          body: String(s.body ?? "").slice(0, 400),
        }))
        : prose.sections,
      advice: Array.isArray(parsed.advice) ? parsed.advice.map((a) => String(a).slice(0, 80)).slice(0, 4) : prose.advice,
      caution: String(parsed.caution || prose.caution).slice(0, 80),
      };
    }
    } catch {
    /* keep fallback */
    }
  }

  const reading: Reading = {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    kind: data.kind,
    title: prose.title,
    verdict: prose.verdict,
    sections: prose.sections,
    advice: prose.advice,
    caution: prose.caution,
    chart: built.chart,
    gua: built.gua,
    jianchu: built.chart ? jianchuOf(built.chart) : undefined,
    question: data.question?.trim() || undefined,
  };
  return { ok: true, reading };
}

export async function castReading(arg: { data: unknown }) {
  const res = await fetch("/api/cast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg.data),
  });
  if (!res.ok) throw new Error("cast failed");
  return (await res.json()) as { ok: true; reading: Reading } | { ok: false; error: string };
}
