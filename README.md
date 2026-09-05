# 玄鉴

AI 命理参考：今日黄历、问事、生辰四柱、铜钱卦。**娱乐参考，不是宿命。**

![玄鉴封面](public/og.jpg)

## 怎么用

需要 [Node.js 20](https://nodejs.org/) 或以上。

```bash
git clone https://github.com/xuanske/xuanjian.git
cd xuanjian
npm install
npm run dev
```

终端会给出本地地址，用浏览器打开。不配密钥也能排盘、看黄历、摇铜钱。

可选：复制 `.env.example` 为 `.env`，填入 `XAI_API_KEY`（[xAI](https://console.x.ai/)），辞章才由模型撰写。不填则只留盘面，不编造。

国内克隆 / 下载：

- [源码 zip（镜像）](https://ghproxy.net/https://github.com/xuanske/xuanjian/archive/refs/heads/main.zip)
- `git clone https://ghproxy.net/https://github.com/xuanske/xuanjian.git`

![玄鉴封面：暗银圆镜与铜钱](public/og.jpg)

AI 命理参考：今日黄历、问事、生辰四柱、铜钱卦。

先在本地排盘、摇卦，再请辞章。界面写明：**娱乐参考，不是宿命。** 不保证发财婚姻，也不编精确应期。

## 国内下载（GitHub 打不开时）

源码压缩包，两个镜像任选，打不开就换另一个：

- [ghproxy 下载 v0.1.0.zip](https://ghproxy.net/https://github.com/xuanske/xuanjian/archive/refs/tags/v0.1.0.zip)
- [gh.llkk.cc 下载 v0.1.0.zip](https://gh.llkk.cc/https://github.com/xuanske/xuanjian/archive/refs/tags/v0.1.0.zip)

封面图：

- [jsDelivr](https://cdn.jsdelivr.net/gh/xuanske/xuanjian@main/public/og.jpg)

浏览代码可以把 `github.com` 换成 `kkgithub.com`（镜像有时会晚同步）。

## 能做什么

- **今日**：按当地日柱与建除写一页运势；填了生辰会对照本命
- **问事**：只断一件事，给可做与不可做
- **生辰**：公历排四柱（年柱按立春，月柱按节气，五虎遁 / 五鼠遁，日柱以 1949-10-01 甲子校准）
- **铜钱**：六爻在本地摇成，再解本卦、之卦
- 首页直接给出当日黄历（日柱、纳音、宜忌），不消耗辞章次数
- 辞章由模型撰写，每日限八次；接不通也不编造，只把盘面留下
- 旧笺存在这台设备，没有账号

## 源码

`src/components/xuan` 界面，`src/lib/xuan` 历法 / 建除 / 六十四卦 / 辞章接口，`src/store/xuan.ts` 存档。历法自测：`node --experimental-strip-types --test src/lib/xuan/calendar.test.ts`。

辞章走服务端 `XAI_API_KEY`（`grok-4.5`），浏览器里不放密钥。

姊妹项目：[拂尘](https://github.com/xuanske/fuchen) · [筹算](https://github.com/xuanske/chousuan) · [开窍](https://github.com/xuanske/kaiqiao)
