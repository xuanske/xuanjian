import { useEffect, useMemo, type ReactNode } from "react";
import { ChevronLeft, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { todayAlmanac } from "@/lib/xuan/almanac";
import { hourLabel } from "@/lib/xuan/calendar";
import type { Chart, Gua, Kind, Reading } from "@/lib/xuan/types";
import { cn } from "@/lib/utils";
import { useXuan } from "@/store/xuan";

const KIND_META: Record<Kind, { title: string; blurb: string; action: string }> = {
  today: { title: "今日", blurb: "按今日日柱写一页运势", action: "请鉴今日" },
  ask: { title: "问事", blurb: "只问一件事，给可做与不可做", action: "请鉴此事" },
  bazi: { title: "生辰", blurb: "公历排四柱，再请辞章批命", action: "排盘请鉴" },
  gua: { title: "铜钱", blurb: "六爻在本地摇成，再解本卦之卦", action: "摇卦" },
};

export function App() {
  const screen = useXuan((s) => s.screen);
  const hydrate = useXuan((s) => s.hydrate);
  const persist = useXuan((s) => s.persist);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [persist]);

  return (
    <div className="flex min-h-dvh justify-center bg-background text-foreground">
      <div className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {screen === "home" ? <Home /> : null}
        {screen === "form" ? <Form /> : null}
        {screen === "cast" ? <Cast /> : null}
        {screen === "result" ? <Result /> : null}
        {screen === "history" ? <History /> : null}
      </div>
    </div>
  );
}

function Mirror({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={cn("mx-auto h-28 w-28 text-silver", pulsing && "xuan-breathe")} aria-hidden>
      <circle cx="48" cy="48" r="46" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.25" />
      <circle cx="48" cy="48" r="36" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.25" />
      <circle cx="48" cy="48" r="24" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1" />
      <circle cx="48" cy="48" r="8" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}

function Home() {
  const begin = useXuan((s) => s.begin);
  const go = useXuan((s) => s.go);
  const history = useXuan((s) => s.history);
  const castsToday = useXuan((s) => s.castsToday);
  const sex = useXuan((s) => s.sex);
  const almanac = useMemo(() => todayAlmanac(new Date(), sex), [sex]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">今日 {castsToday.n}/8</span>
        <button type="button" className="h-11 px-1" onClick={() => go("history")}>
          旧笺{history.length ? ` ${history.length}` : ""}
        </button>
      </header>
      <div className="mt-6 xuan-rise">
        <Mirror />
        <h1 className="mt-4 text-center font-display text-5xl tracking-tight">玄鉴</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">先排盘，再请辞。娱乐参考，不是宿命。</p>
      </div>
      <button
        type="button"
        onClick={() => begin("today")}
        className="mt-8 rounded-2xl bg-card px-4 py-4 text-left transition-[transform,background-color] duration-150 active:scale-[0.98]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-2xl tracking-tight">
            {almanac.chart.day.stem}
            {almanac.chart.day.branch}日
          </span>
          <span className="text-sm text-silver">{almanac.jianchu.name}日</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">纳音 {almanac.chart.nayin.day}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">宜</div>
            <div className="mt-1 leading-relaxed">{almanac.jianchu.yi}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">忌</div>
            <div className="mt-1 leading-relaxed">{almanac.jianchu.ji}</div>
          </div>
        </div>
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(KIND_META) as Kind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => begin(kind)}
            className="min-h-20 rounded-2xl bg-card px-4 py-4 text-left transition-[transform,background-color] duration-150 active:scale-[0.98]"
          >
            <div className="font-display text-lg">{KIND_META[kind].title}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{KIND_META[kind].blurb}</div>
          </button>
        ))}
      </div>
      <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-muted-foreground">
        黄历与四柱在本地排。铜钱在本地摇。辞章由模型撰写，每日限八次。
      </p>
    </div>
  );
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 items-center gap-1 text-sm text-muted-foreground">
      <ChevronLeft className="size-4" />
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function Form() {
  const kind = useXuan((s) => s.kind);
  const go = useXuan((s) => s.go);
  const name = useXuan((s) => s.name);
  const birth = useXuan((s) => s.birth);
  const hour = useXuan((s) => s.hour);
  const lng = useXuan((s) => s.lng);
  const sex = useXuan((s) => s.sex);
  const question = useXuan((s) => s.question);
  const error = useXuan((s) => s.error);
  const setProfile = useXuan((s) => s.setProfile);
  const setQuestion = useXuan((s) => s.setQuestion);
  const cast = useXuan((s) => s.cast);
  const meta = KIND_META[kind];
  const needQuestion = kind === "ask" || kind === "gua";
  const needBirth = kind === "bazi";

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="玄鉴" />
      <h2 className="mt-1 font-display text-3xl tracking-tight">{meta.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
      <div className="mt-6 flex flex-col gap-4">
        <Field label="称呼（可空）">
          <input className={inputClass} value={name} maxLength={20} onChange={(e) => setProfile({ name: e.target.value })} />
        </Field>
        {needQuestion ? (
          <Field label="要问的那一件事">
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-secondary px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              value={question}
              maxLength={200}
              placeholder="例如：这份工作还要不要续约"
              onChange={(e) => setQuestion(e.target.value)}
            />
          </Field>
        ) : null}
        <Field label={needBirth ? "公历生辰" : "生辰（可选，对照更准）"}>
          <input
            type="date"
            className={inputClass}
            value={birth}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(e) => setProfile({ birth: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="时辰">
            <select className={inputClass} value={hour} onChange={(e) => setProfile({ hour: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")} 时 · {hourLabel(h)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="乾坤">
            <select className={inputClass} value={sex} onChange={(e) => setProfile({ sex: e.target.value as "male" | "female" })}>
              <option value="male">乾造</option>
              <option value="female">坤造</option>
            </select>
          </Field>
        </div>
        <Field label="出生地经度（可选）">
          <input
            className={inputClass}
            inputMode="decimal"
            placeholder="不填按钟表时 · 北京 116.4 乌鲁木齐 87.6"
            value={lng}
            maxLength={8}
            onChange={(e) => setProfile({ lng: e.target.value })}
          />
        </Field>
        <p className="text-xs text-muted-foreground">填东经则按时柱用真太阳时。1986–1991 年夏令时未自动回拨，请自行减一小时。</p>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Button className="mt-auto h-12 rounded-xl" onClick={() => void cast()}>
        {meta.action}
      </Button>
    </div>
  );
}

function LineRow({ line, delay }: { line: Gua["lines"][number]; delay: number }) {
  return (
    <div className="xuan-rise flex items-center justify-center gap-2" style={{ animationDelay: `${delay}ms` }}>
      {line.yang ? (
        <span className="h-1 w-12 rounded-full bg-foreground" />
      ) : (
        <span className="flex w-12 justify-between">
          <span className="h-1 w-5 rounded-full bg-foreground" />
          <span className="h-1 w-5 rounded-full bg-foreground" />
        </span>
      )}
      <span className={cn("size-1.5 rounded-full", line.changing ? "bg-silver" : "bg-transparent")} />
    </div>
  );
}

function Cast() {
  const gua = useXuan((s) => s.pendingGua);
  if (gua) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex flex-col-reverse gap-2">
          {gua.lines.map((line, i) => (
            <LineRow key={i} line={line} delay={i * 90} />
          ))}
        </div>
        <div className="text-center">
          <p className="font-display text-3xl tracking-tight">{gua.name}</p>
          {gua.changeName ? <p className="mt-1 text-sm text-silver">之 {gua.changeName}</p> : null}
          <p className="mt-3 text-sm text-muted-foreground">对镜，请辞。</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Mirror pulsing />
      <p className="text-sm text-muted-foreground">对镜，请辞。</p>
    </div>
  );
}

function Pillars({ chart }: { chart: Chart }) {
  const cols: Array<[string, Chart["year"]]> = [
    ["年", chart.year],
    ["月", chart.month],
    ["日", chart.day],
    ["时", chart.hour],
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {cols.map(([label, p]) => (
        <div key={label} className="rounded-xl bg-secondary px-2 py-3 text-center">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-xl leading-none">{p.stem}</div>
          <div className="mt-1 font-display text-xl leading-none">{p.branch}</div>
          <div className="mt-2 text-xs text-muted-foreground">{p.god ?? p.element}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground/80">{p.nayin}</div>
        </div>
      ))}
    </div>
  );
}

function GuaView({ gua }: { gua: Gua }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-secondary px-4 py-4">
      <div className="flex flex-col-reverse gap-1.5">
        {gua.lines.map((line, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {line.yang ? (
              <span className="h-1 w-10 rounded-full bg-foreground" />
            ) : (
              <span className="flex w-10 justify-between">
                <span className="h-1 w-4 rounded-full bg-foreground" />
                <span className="h-1 w-4 rounded-full bg-foreground" />
              </span>
            )}
            {line.changing ? <span className="size-1.5 rounded-full bg-silver" /> : <span className="size-1.5" />}
          </div>
        ))}
      </div>
      <div>
        <div className="font-display text-2xl tracking-tight">{gua.name}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{gua.info}</p>
        {gua.changeName ? <p className="mt-1 text-xs text-silver">之 {gua.changeName}</p> : null}
      </div>
    </div>
  );
}

function Elements({ chart }: { chart: Chart }) {
  const max = Math.max(...Object.values(chart.counts), 1);
  return (
    <ul className="flex flex-col gap-2">
      {Object.entries(chart.counts).map(([el, n]) => (
        <li key={el} className="flex items-center gap-3 text-sm">
          <span className="w-6 text-muted-foreground">{el}</span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <span className="block h-full bg-silver" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="w-6 text-right tabular-nums text-muted-foreground">{n}</span>
        </li>
      ))}
    </ul>
  );
}

function Result() {
  const current = useXuan((s) => s.current);
  const go = useXuan((s) => s.go);
  const begin = useXuan((s) => s.begin);
  if (!current) return null;

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="回家" />
      <p className="mt-1 text-xs text-muted-foreground">{KIND_META[current.kind].title}</p>
      <h2 className="mt-1 font-display text-3xl tracking-tight">{current.title}</h2>
      <p className="mt-3 text-base leading-relaxed">{current.verdict}</p>
      {current.chart ? (
        <div className="mt-6">
          <Pillars chart={current.chart} />
          <p className="mt-2 text-xs text-muted-foreground">
            {current.chart.label}
            {current.jianchu ? ` · ${current.jianchu.name}日` : ""}
          </p>
        </div>
      ) : null}
      {current.gua ? (
        <div className="mt-6">
          <GuaView gua={current.gua} />
        </div>
      ) : null}
      {current.question ? <p className="mt-4 text-sm text-muted-foreground">所问 · {current.question}</p> : null}
      <div className="mt-6 flex flex-col gap-4">
        {current.sections.map((sec, i) => (
          <section key={`${sec.heading}-${i}`}>
            <h3 className="text-sm text-silver">{sec.heading}</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{sec.body}</p>
          </section>
        ))}
      </div>
      {current.chart ? (
        <div className="mt-6">
          <h3 className="text-sm text-silver">五行旺衰</h3>
          <div className="mt-3">
            <Elements chart={current.chart} />
          </div>
        </div>
      ) : null}
      {current.advice.length ? (
        <ul className="mt-6 flex flex-col gap-2">
          {current.advice.map((a) => (
            <li key={a} className="rounded-xl bg-secondary px-3 py-3 text-sm leading-relaxed">
              {a}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{current.caution}</p>
      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button className="h-12 rounded-xl" onClick={() => begin(current.kind)}>
          再问一次
        </Button>
        <Button variant="ghost" className="h-11 rounded-xl" onClick={() => go("history")}>
          旧笺
        </Button>
      </div>
    </div>
  );
}

function History() {
  const history = useXuan((s) => s.history);
  const go = useXuan((s) => s.go);
  const open = useXuan((s) => s.open);

  return (
    <div className="flex flex-1 flex-col">
      <Back onClick={() => go("home")} label="玄鉴" />
      <h2 className="mt-1 font-display text-3xl tracking-tight">旧笺</h2>
      {!history.length ? (
        <p className="mt-10 text-sm text-muted-foreground">还没有留下记录。</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {history.map((r: Reading) => (
            <li key={r.id}>
              <button type="button" onClick={() => open(r)} className="w-full rounded-2xl bg-card px-4 py-3 text-left">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{KIND_META[r.kind].title}</span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock3 className="size-3" />
                    {new Date(r.at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <div className="mt-1 text-sm leading-relaxed">{r.verdict}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
