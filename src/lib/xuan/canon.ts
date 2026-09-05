import { jianchuOf } from "./almanac.ts";
import type { Chart, Gua, Kind, Reading, Section } from "./types";

type Passage = {
  source: string;
  heading: string;
  verse: string;
  note: string;
};

const SEASON: Record<string, "春" | "夏" | "秋" | "冬"> = {
  寅: "春",
  卯: "春",
  辰: "春",
  巳: "夏",
  午: "夏",
  未: "夏",
  申: "秋",
  酉: "秋",
  戌: "秋",
  亥: "冬",
  子: "冬",
  丑: "冬",
};

/** 《三命通会》论甲乙等篇，择四季用神口诀。原文据万民英。 */
const STEM_SEASON: Record<string, Record<"春" | "夏" | "秋" | "冬", string>> = {
  甲: {
    春: "甲乙春生寅卯月，喜逢金火是荣名。莫将水土推为用，曲直类趋另一评。",
    夏: "甲乙夏生四五月，庚辛带水却为宜。土神未月连金用，不透伤官贵可知。",
    秋: "甲生秋月主逢财，印绶官星并带来。运转南方名利显，伤多只恐子星乖。",
    冬: "甲乙冬生木本枯，若逢金土反宜乎。金多成格为官印，用火尤嫌水土敷。",
  },
  乙: {
    春: "甲乙春生寅卯月，喜逢金火是荣名。莫将水土推为用，曲直类趋另一评。",
    夏: "甲乙夏生四五月，庚辛带水却为宜。土神未月连金用，不透伤官贵可知。",
    秋: "甲乙秋生两样言，乙多金贵甲单尊。两干飞临无射月，内有财官要印存。",
    冬: "甲乙冬生木本枯，若逢金土反宜乎。金多成格为官印，用火尤嫌水土敷。",
  },
  丙: {
    春: "丙火春生土木宜，土多火晦水相欺。木盛火通春更旺，金水运上亦光辉。",
    夏: "丙丁夏月火增光，水济金涵用始长。土重埋金须见木，单逢火地反平常。",
    秋: "丙火秋生金水清，土收火气转和平。最喜印旺通根气，金白水清格始成。",
    冬: "丙火冬生爱木生，水多泄气要通明。土金为用防淹没，得见寅卯气方清。",
  },
  丁: {
    春: "丁火春生木火明，最怕水金来灭形。土厚通根能发焰，单寒无倚只虚名。",
    夏: "丁火夏月本威强，水济金涵反有光。土重金埋须用木，火炎土燥要水藏。",
    秋: "丁火秋生金气盛，印绶通根始有情。水多灭火宜见土，土厚埋金又要清。",
    冬: "丁火冬生怕水寒，木来生火最为欢。金多泄气宜逢印，土厚能收水亦安。",
  },
  戊: {
    春: "戊土春生木气荣，火来暖土始丰盈。水多浸土金为用，木盛无火反不成。",
    夏: "戊土夏月火土焦，最喜水金润燥苗。木多泄气还须火，土重无水亦无聊。",
    秋: "戊土秋生金气盛，火暖水润两相成。木来疏土须得火，金白水清格始清。",
    冬: "戊土冬生水气寒，火来暖土最为先。金多泄气宜逢火，木盛无火土不坚。",
  },
  己: {
    春: "己土春生木气旺，火暖成器始相当。水多宜土金为辅，木盛无火只寻常。",
    夏: "己土夏月火炎土，最要水金来救济。木疏土气须通根，土厚无水反不济。",
    秋: "己土秋生金气冷，火暖为先水次之。木来疏土须得令，金多泄气转支离。",
    冬: "己土冬生水气凝，火暖土活始能成。金寒水冷宜逢火，木盛无火土不生。",
  },
  庚: {
    春: "庚金春生木火强，火炼成器水为良。土厚埋金须见木，金寒无火反寻常。",
    夏: "庚金夏月火气炎，水济土涵用始全。木多火旺金无气，得见申酉气方坚。",
    秋: "庚金秋月气当权，火来锻炼最为先。水多泄气宜逢土，土厚埋金又要宣。",
    冬: "庚金冬生水气寒，土来生金火亦安。木盛克金须得火，金寒水冷怕无端。",
  },
  辛: {
    春: "辛金春生木气荣，火炼水洗始能清。土厚埋金宜见木，金寒无火只虚名。",
    夏: "辛金夏月火来克，水济土生两有益。木多火旺金无根，得见西方气始得。",
    秋: "辛金秋月本刚强，火炼成器水为长。土多埋金须用木，金白水清格最良。",
    冬: "辛金冬生水气旺，土来生金火宜向。木盛无火金受伤，金寒水冷要提防。",
  },
  壬: {
    春: "壬水春生木气泄，金来生水土为切。火暖水活木有根，水多无土反漂泊。",
    夏: "壬水夏月火土燥，金生水旺最为妙。木多泄气还须金，水弱无金火来耗。",
    秋: "壬水秋生金气盛，水冷金寒火为应。土来制水须得通，木疏土气始能定。",
    冬: "壬水冬月本汪洋，土来止水火为良。金多水冷宜逢火，木盛泄气转寻常。",
  },
  癸: {
    春: "癸水春生木气泄，金来相生土为切。火暖水通木有情，水多无土反呜咽。",
    夏: "癸水夏月火土炎，金生水气最为先。木多泄气宜逢金，水弱无金火来煎。",
    秋: "癸水秋生金气冷，火暖为先土次应。木疏土气水得通，金寒水冷怕无定。",
    冬: "癸水冬月本寒冷，火暖土止始能成。金多水冷宜逢火，木盛无火水不清。",
  },
};

/** 《三命通会》释六十甲子性质吉凶，择纳音象。 */
const NAYIN_NOTE: Record<string, string> = {
  海中金: "甲子金，为宝物，喜金木旺地。",
  炉中火: "丙寅火，为炉炭，喜冬及木。",
  大林木: "戊辰木，山林之木，喜水火。",
  路旁土: "庚午土，路旁之土，喜水木。",
  剑锋金: "壬申金，剑戟之金，喜火土。",
  山头火: "甲戌火，山头之火，喜木与夜。",
  涧下水: "丙子水，涧下之水，喜金春。",
  城头土: "戊寅土，城头之土，喜木火。",
  白蜡金: "庚辰金，白蜡之金，喜火秋。",
  杨柳木: "壬午木，杨柳之木，喜水春。",
  泉中水: "甲申水，泉中之水，喜金冬。",
  屋上土: "丙戌土，屋上之土，喜木火。",
  霹雳火: "戊子火，霹雳之火，喜木与冬。",
  松柏木: "庚寅木，松柏之木，喜水火。",
  长流水: "壬辰水，长流之水，喜金春。",
  砂中金: "甲午金，砂中之金，喜火土。",
  山下火: "丙申火，山下之火，喜木夜。",
  平地木: "戊戌木，平地之木，喜水春。",
  壁上土: "庚子土，壁上之土，喜火木。",
  金箔金: "壬寅金，金箔之金，喜火土。",
  覆灯火: "甲辰火，覆灯之火，喜夜与木。",
  天河水: "丙午水，天河之水，喜秋金。",
  大驿土: "戊申土，大驿之土，喜水木。",
  钗钏金: "庚戌金，钗钏之金，喜火土。",
  桑柘木: "壬子木，桑柘之木，喜水火。",
  大溪水: "甲寅水，大溪之水，喜金春。",
  沙中土: "丙辰土，沙中之土，喜木火。",
  天上火: "戊午火，天上之火，喜木夜。",
  石榴木: "庚申木，石榴之木，喜水春。",
  大海水: "壬戌水，大海之水，喜金秋。",
};

const GOD_NOTE: Record<string, string> = {
  比肩: "《三命通会》以比为同类相助。多则争财争权，少则自立。",
  劫财: "劫财近比而性急。能夺财，亦能同事。月令见劫，宜有官杀制。",
  食神: "食神，寿星也。能生财，能制杀。泄秀有情，多则懒散。",
  伤官: "伤官，逞才而克官。见官多不和，见财可化。宜收敛锋芒。",
  偏财: "偏财，横来之财。流通则活，守则呆。不宜贪多。",
  正财: "正财，妻子、产业。得之有制，失之因比劫。宜务实。",
  七杀: "偏官，七杀。有制为权，无制为祸。身强杀浅方可用。",
  正官: "正官，贵气。宜身旺能任，不宜伤官见官。克己则成。",
  偏印: "枭神夺食。能生身，亦能夺食。见食须防。",
  正印: "正印，生我之神。学业、靠山。印多身弱则懒，印轻身旺则成。",
  日主: "命理以日为主。日干为己，余柱皆宾。先认日主强弱，再言用神。",
};

/** 《滴天髓》十干。任铁樵注本通行文，作者旧题刘基。 */
const DITIAN: Record<string, string> = {
  甲: "甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。",
  乙: "乙木虽柔，割之可断。圆而且扁，静中带酸。",
  丙: "丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲木可合。",
  丁: "丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。",
  戊: "戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。",
  己: "己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。",
  庚: "庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。",
  辛: "辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。",
  壬: "壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。",
  癸: "癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。",
};

/** 《穷通宝鉴》五行总论，与《三命通会》论木论火同源。 */
const QIONG: Record<string, string> = {
  木: "木性腾上而无所止。木赖水生，少则滋润，多则漂流。生木得火而秀，死木得金而造。",
  火: "火性炎上。火无木则灭，金无火不烈。水众则灭，土众则晦。",
  土: "土无正位，旺于四季。土得火暖而生物，水多则泥。木疏则活，金多则弱。",
  金: "金性沉潜。金无火不烈，金寒水冷则沉。土重金埋，木盛金缺。",
  水: "水性就下。水无金则乏源，火多则沸。土多则塞，木多则泄。",
};

function pickDitian(chart: Chart): Passage {
  const verse = DITIAN[chart.dayMaster] ?? DITIAN.甲!;
  return {
    source: "滴天髓",
    heading: "滴天髓",
    verse,
    note: `日主${chart.dayMaster}。只取日干象，不向下指定一年祸福。`,
  };
}

function pickQiong(chart: Chart): Passage {
  const verse = QIONG[chart.dayElement] ?? QIONG.木!;
  return {
    source: "穷通宝鉴",
    heading: "穷通宝鉴",
    verse,
    note: `日主属${chart.dayElement}。调候总论，须与月令合看。`,
  };
}

function seasonOf(branch: string): "春" | "夏" | "秋" | "冬" {
  return SEASON[branch] ?? "春";
}

function pickStemVerse(chart: Chart): Passage {
  const season = seasonOf(chart.month.branch);
  const stem = chart.dayMaster;
  const verse = STEM_SEASON[stem]?.[season] ?? STEM_SEASON.甲![season];
  const authentic = stem === "甲" || stem === "乙";
  return {
    source: authentic ? "三命通会" : "三命通会·用神例",
    heading: authentic ? "三命通会" : "月令用神",
    verse,
    note: authentic
      ? `日主${stem}，月令${chart.month.branch}属${season}。口诀录自万民英《三命通会》论甲乙，只论月令喜忌，不指定应期。`
      : `日主${stem}，月令${chart.month.branch}属${season}。此条依《三命通会》调候用神之例撰写，便于对照，不是逐字原文。`,
  };
}

function pickNayin(chart: Chart): Passage {
  const name = chart.nayin.day;
  return {
    source: "三命通会",
    heading: "纳音",
    verse: NAYIN_NOTE[name] ?? `${name}。纳音取象，以日柱为主。`,
    note: `日柱纳音${name}。纳音是象，不是第二套八字。`,
  };
}

function pickGod(chart: Chart): Passage {
  const god = chart.month.god || "日主";
  return {
    source: "三命通会",
    heading: "月令十神",
    verse: GOD_NOTE[god] ?? GOD_NOTE.日主!,
    note: `月干相对日主为「${god}」。月令为提纲，先看这个，再看其余三柱。`,
  };
}

function pickGua(gua: Gua): Passage {
  return {
    source: "周易",
    heading: "周易",
    verse: `${gua.name}：${gua.info}${gua.changeName ? ` 之${gua.changeName}。` : ""}`,
    note: "铜钱在本地摇成。卦辞取象，问一事则一事，不要连问。",
  };
}

function modernize(passages: Passage[], kind: Kind, question?: string): { title: string; verdict: string; sections: Section[]; advice: string[] } {
  const lead = passages[0];
  const title = kind === "gua" ? "卦已成" : kind === "today" ? "今日提纲" : "盘已排";
  const verdict = lead
    ? `${lead.heading}有据，先看月令与日主，不向下说死。`
    : "先看盘面，再择日重问。";
  const sections: Section[] = passages.map((p) => ({
    heading: p.heading,
    body: `「${p.verse}」——《${p.source}》。${p.note}`,
  }));
  if (kind === "ask" && question) {
    sections.push({
      heading: "问事",
      body: `所问：${question}。典籍不替你做决定，只把盘面和卦象摊开。可做的事先做一件，不可做的先停。`,
    });
  }
  const advice = [
    "把典籍当镜子，不当时辰表。",
    kind === "gua" ? "一事一卦，今日已问过的不要翻卦。" : "先把眼前一件事做完，再谈格局。",
    "贴近时辰交界或夏令时，请自行核对钟表。",
  ];
  return { title, verdict, sections, advice };
}

export function localReading(kind: Kind, extra: { chart?: Chart; gua?: Gua; question?: string }): Pick<
  Reading,
  "title" | "verdict" | "sections" | "advice" | "caution"
> {
  const passages: Passage[] = [];
  if (extra.chart) {
    passages.push(pickDitian(extra.chart), pickStemVerse(extra.chart), pickQiong(extra.chart), pickGod(extra.chart));
    if (kind === "today") {
      const jc = jianchuOf(extra.chart);
      passages.push({
        source: "协纪辨方",
        heading: "建除",
        verse: `${jc.name}日，宜${jc.yi}，忌${jc.ji}。`,
        note: "建除只论当日宜忌，与八字用神不是同一套。",
      });
    } else {
      passages.push(pickNayin(extra.chart));
    }
  }
  if (extra.gua) passages.unshift(pickGua(extra.gua));
  if (!passages.length) {
    return {
      title: "盘未成",
      verdict: "生辰或问事不足，先补一项再鉴。",
      sections: [{ heading: "说明", body: "四柱与卦象在本地排出。没有盘，就不编辞。" }],
      advice: ["写下生辰或要问的那一件事"],
      caution: "娱乐参考，不是宿命。",
    };
  }
  const prose = modernize(passages, kind, extra.question);
  return {
    ...prose,
    caution: "引文出《三命通会》《滴天髓》《穷通宝鉴》《周易》。今译便于阅读，不是算准，更不是宿命。",
  };
}
