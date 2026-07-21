import type { CreatureVariant } from "../types";

interface SpeciesFlavor {
  likes: string;
  fear: string;
  secret: string;
}

/** Personality flavor per species, shared across all 9 role variants of
 * that species (an electric mouse dad and an electric mouse baby are still
 * both electric mice, so they share the same likes/fear/secret; the role
 * templates below change the tone, not the underlying species lore). */
const SPECIES_FLAVOR: Record<string, SpeciesFlavor> = {
  mouse: { likes: "起司星星餅乾", fear: "打雷的聲音", secret: "睡覺的時候枕頭底下會藏起司，這樣才有香香的味道。" },
  turtle: { likes: "在池塘裡曬太陽", fear: "太快的速度", secret: "殼裡面畫了一整片小星星，只有最要好的朋友才看得到。" },
  fox: { likes: "溫暖的陽光", fear: "下雨天", secret: "尾巴尖尖的地方會發出一點點溫暖的光，晚上可以照路。" },
  rabbit: { likes: "紅蘿蔔葉子", fear: "太大的聲音", secret: "最喜歡的紅蘿蔔葉子會留到最後才吃，捨不得一次吃完。" },
  cat: { likes: "數星星", fear: "洗澡", secret: "知道每一顆星星的名字，晚上都會偷偷跟它們打招呼。" },
  sheep: { likes: "在雲上睡午覺", fear: "剪毛", secret: "身上的毛摸起來像雲朵一樣軟，因為每天都在雲上睡午覺。" },
  bird: { likes: "早上的陽光", fear: "關起來的地方", secret: "飛得很高的時候，可以看到全世界的太陽同時升起。" },
  bear: { likes: "會發亮的小石頭", fear: "黑黑的山洞", secret: "收集了一百顆會發亮的小石頭，藏在秘密山洞裡。" },
  penguin: { likes: "在冰上滑冰", fear: "太熱的天氣", secret: "肚子上的斑紋是自己畫上去的，每年都會換新花樣。" },
  deer: { likes: "森林裡的野花", fear: "很大的聲音", secret: "角上其實可以開出小花，只有心情很好的時候才會開。" },
  owl: { likes: "安靜的夜晚", fear: "太亮的燈光", secret: "可以聽懂風吹過樹葉的悄悄話，它們會說明天的天氣。" },
  horse: { likes: "在草原上奔跑", fear: "小小的空間", secret: "跑得夠快的時候，身後會留下一條淡淡的彩虹。" },
  fish: { likes: "吹泡泡許願", fear: "乾乾的地方", secret: "吐出來的泡泡裡，其實都裝著一個小小的願望。" },
  butterfly: { likes: "跟著風飛", fear: "大風大雨", secret: "翅膀圖案每天都會偷偷變一點點，沒有人發現過。" },
  dragon: { likes: "曬太陽", fear: "被搔癢", secret: "看起來很兇，其實很怕癢，肚子被搔一下就會笑出來。" },
  lion: { likes: "溫暖的陽光", fear: "剪指甲", secret: "鬃毛裡面藏著一點點陽光，摸起來會暖暖的。" },
  pig: { likes: "洗香香", fear: "弄髒衣服", secret: "其實很愛乾淨，打滾完一定會馬上去洗香香。" },
  monkey: { likes: "跟朋友分享香蕉", fear: "太高的地方", secret: "藏了一整棵樹的香蕉，都是留著要跟好朋友分享的。" },
  dolphin: { likes: "跳出海面許願", fear: "太安靜的水", secret: "跳出水面的時候，會偷偷許一個願望才落回海裡。" },
  wolf: { likes: "在雪地裡奔跑", fear: "孤單一個人", secret: "叫聲其實是在跟遠方的朋友說晚安。" },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

/** The 5 friendship-path stages shown on the creature detail page. Index 0
 * is always unlocked; the rest are gated by AFFECTION_MILESTONES in
 * gachaCatalog.ts (kept in sync: [3, 5, 8, 10]). */
export const AFFECTION_STAGES = [
  { title: "初次見面", icon: "🌱", threshold: 0 },
  { title: "打招呼", icon: "👋", threshold: 3 },
  { title: "一起玩", icon: "🤗", threshold: 5 },
  { title: "一封信", icon: "💌", threshold: 8 },
  { title: "最好的朋友", icon: "💖", threshold: 10 },
] as const;

/** A creature can't be gifted past this — "最好的朋友" is the last stage, so
 * hearts beyond it don't unlock anything; without a cap, gifting past 10
 * still happily spent stars for zero further effect. */
export const MAX_HEARTS = AFFECTION_STAGES[AFFECTION_STAGES.length - 1].threshold;

// Stage 0 — 初次見面 (always shown; hasn't unlocked anything yet).
const ROLE_FIRST_MEETING: Record<CreatureVariant, string> = {
  grandpa: "{name}看著你，還不熟悉。",
  grandma: "{name}靜靜地看著你。",
  dad: "{name}對你點點頭。",
  mom: "{name}對你微微一笑。",
  olderBrother: "{name}看了你一眼。",
  olderSister: "{name}好奇地看著你。",
  youngerBrother: "{name}躲在旁邊看你。",
  youngerSister: "{name}偷偷看著你。",
  baby: "{name}安靜地看著你。",
};

// Stage 1 — 打招呼 (❤️3). A pool per role so it's not always the same line.
const ROLE_GREETINGS: Record<CreatureVariant, string[]> = {
  grandpa: ["「孩子你好啊，我是{name}。」", "「孩子，你來啦。」", "「很高興認識你。」"],
  grandma: ["「哎呀，是你來啦～我是{name}。」", "「來坐下歇會兒。」", "「又來看我啦，真乖。」"],
  dad: ["「你好，我是{name}。」", "「嗨，你來了。」", "「很高興見到你。」"],
  mom: ["「你好呀，我是{name}。」", "「嗨，歡迎你來。」", "「看到你真開心。」"],
  olderBrother: ["「嘿，我是{name}，罩你！」", "「嘿，你來啦！」", "「又來找我玩啦？」"],
  olderSister: ["「你好呀，我是{name}。」", "「嗨，好久不見！」", "「你來啦，真開心！」"],
  youngerBrother: ["「欸嘿，我是{name}！」", "「嘿嘿，你來啦！」", "「我們來玩吧！」"],
  youngerSister: ["「嗨嗨！我是{name}！」", "「嗨嗨，你來啦！」", "「好開心看到你！」"],
  baby: ["（揮揮小手）「呀～呀～」", "（咿咿呀呀）", "（笑咪咪揮手）"],
};

// Stage 2 — 一起玩 (❤️5). Reactions when the creature is tapped/petted.
const ROLE_PAT_REACTIONS: Record<CreatureVariant, string[]> = {
  grandpa: ["呵呵，真舒服。", "謝謝你呀，孩子。", "摸得剛剛好！"],
  grandma: ["哎呀，好舒服喔。", "乖孩子，謝謝你。", "嘻嘻，好癢喔！"],
  dad: ["謝啦，真棒！", "嗯，感覺不錯。", "哈，好舒服！"],
  mom: ["謝謝你喔！", "好舒服，謝謝。", "嘻嘻，真開心！"],
  olderBrother: ["嘿，謝啦！", "哈哈，好玩！", "再來一次！"],
  olderSister: ["嘻嘻，好癢喔！", "謝謝你，真棒！", "好舒服喔！"],
  youngerBrother: ["嘿嘿，好玩！", "再摸一下！", "嘻嘻嘻！"],
  youngerSister: ["嘻嘻，好癢！", "謝謝你！", "好開心喔！"],
  baby: ["咯咯笑！", "呀呀～開心！", "笑咪咪！"],
};

// Stage 3 — 一封信 (❤️8).
const ROLE_LETTER: Record<CreatureVariant, string> = {
  grandpa: "「你是個很棒的孩子。——{name}」",
  grandma: "「要多吃點，別餓著。——{name}」",
  dad: "「謝謝你，我很安心。——{name}」",
  mom: "「謝謝你照顧我們家。——{name}」",
  olderBrother: "「你是最棒的隊友！——{name}」",
  olderSister: "「謝謝你常常來看我。——{name}」",
  youngerBrother: "「下次還要一起玩喔！——{name}」",
  youngerSister: "「你是我最好的朋友！——{name}」",
  baby: "（一張歪歪扭扭的塗鴉）",
};

// Stage 4 — 最好的朋友／小秘密 (❤️10). Lead-in line before the profile card.
const ROLE_SECRET_INTRO: Record<CreatureVariant, string> = {
  grandpa: "{name}說出一個藏了好久的秘密。",
  grandma: "{name}摸摸你的頭，輕輕地說。",
  dad: "{name}蹲下來，認真地說。",
  mom: "{name}抱著你，輕輕地說。",
  olderBrother: "{name}小聲說，這是我們的秘密。",
  olderSister: "{name}悄悄跟你說一個秘密。",
  youngerBrother: "{name}神秘兮兮地說。",
  youngerSister: "{name}小小聲地說。",
  baby: "{name}趴在你肩膀上，含糊地說。",
};

// Said right after a gift is given.
const ROLE_THANKS: Record<CreatureVariant, string[]> = {
  grandpa: ["謝謝你，孩子。", "呵呵，真貼心。", "謝謝你的禮物。"],
  grandma: ["謝謝你喔，乖孩子。", "哎呀，太客氣了。", "謝謝你的心意。"],
  dad: ["謝啦！", "謝謝你。", "太好了，謝謝！"],
  mom: ["謝謝你喔！", "好開心，謝謝！", "謝謝你的禮物。"],
  olderBrother: ["謝啦，你最棒！", "哈哈，謝謝！", "太好了，謝謝！"],
  olderSister: ["謝謝你！好開心！", "哇，謝謝你！", "太喜歡了，謝謝！"],
  youngerBrother: ["謝啦！超棒的！", "耶！謝謝你！", "哈哈，太好了！"],
  youngerSister: ["謝謝你！好喜歡！", "哇！謝謝你！", "好開心喔，謝謝！"],
  baby: ["呀！開心！", "咯咯笑！", "笑咪咪！"],
};

export function firstMeetingText(displayName: string, variant: CreatureVariant): string {
  return fill(ROLE_FIRST_MEETING[variant], { name: displayName });
}

export function randomGreeting(displayName: string, variant: CreatureVariant): string {
  return fill(pick(ROLE_GREETINGS[variant]), { name: displayName });
}

export function randomPatReaction(variant: CreatureVariant): string {
  return pick(ROLE_PAT_REACTIONS[variant]);
}

export function letterText(displayName: string, variant: CreatureVariant): string {
  return fill(ROLE_LETTER[variant], { name: displayName });
}

export function secretIntroText(displayName: string, variant: CreatureVariant): string {
  return fill(ROLE_SECRET_INTRO[variant], { name: displayName });
}

export function randomThanks(variant: CreatureVariant): string {
  return pick(ROLE_THANKS[variant]);
}

export function speciesFacts(speciesId: string): SpeciesFlavor | undefined {
  return SPECIES_FLAVOR[speciesId];
}

/** Index into AFFECTION_STAGES for the highest stage a given hearts count
 * has reached. Shared by FriendshipPath (to render the roadmap) and
 * CreatureDetailPage (to decide which single interactive panel to show). */
export function currentStageIndex(hearts: number): number {
  let idx = 0;
  for (let i = 0; i < AFFECTION_STAGES.length; i++) {
    if (hearts >= AFFECTION_STAGES[i].threshold) idx = i;
  }
  return idx;
}
