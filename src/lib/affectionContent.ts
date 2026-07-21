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

// Stage 0 — 初次見面 (always shown; hasn't unlocked anything yet). Each role
// gets its own hiding spot + pose so two roles of the same species don't
// read as the same creature — a distinct action and a distinct place to be
// peeking out from, per role.
const ROLE_FIRST_MEETING: Record<CreatureVariant, string> = {
  grandpa: "{name}瞇著眼睛，從老樹枝上靜靜地看著你。",
  grandma: "{name}戴著老花眼鏡，從窗台後面探出頭看著你。",
  dad: "{name}站在高高的樹梢上，抬頭看著你。",
  mom: "{name}從溫暖的窩裡探出頭，溫柔地看著你。",
  olderBrother: "{name}叼著一根小樹枝，從屋頂上看著你。",
  olderSister: "{name}躲在葉子後面，好奇地看著你。",
  youngerBrother: "{name}從草叢裡探出頭，眼睛骨碌碌地看著你。",
  youngerSister: "{name}偷偷地從花朵後面看著你。",
  baby: "{name}安靜地從大樹上看著你。",
};

// Stage 1 — 打招呼 (❤️3). A pool per role so it's not always the same line —
// every sentence names the creature and describes what it's DOING (never a
// bare quotation mark with the name only trailing after), since this is
// heard, not read: a child who can't read the screen only has the words
// actually spoken to figure out who's greeting her and how.
const ROLE_GREETINGS: Record<CreatureVariant, string[]> = {
  grandpa: [
    "{name}對你微微鞠躬，笑咪咪地跟你打招呼。",
    "{name}慢慢地揮揮手，跟你打招呼。",
    "{name}輕輕拍拍你的肩膀，跟你打招呼。",
  ],
  grandma: [
    "{name}張開雙手，笑瞇瞇地跟你打招呼。",
    "{name}輕輕摸摸你的頭，跟你打招呼。",
    "{name}給你一個溫暖的擁抱，跟你打招呼。",
  ],
  dad: [
    "{name}挺起胸膛，用力地揮揮手，跟你打招呼。",
    "{name}舉起手，豪邁地跟你打招呼。",
    "{name}拍拍胸口，跟你打招呼。",
  ],
  mom: [
    "{name}張開雙手，溫柔地跟你打招呼。",
    "{name}對你眨眨眼，親切地跟你打招呼。",
    "{name}輕輕點頭，微笑著跟你打招呼。",
  ],
  olderBrother: [
    "{name}比出一個帥氣的手勢，跟你打招呼。",
    "{name}舉起手掌，等你來擊掌打招呼。",
    "{name}比了一個讚，跟你打招呼。",
  ],
  olderSister: [
    "{name}轉了一個圈，開心地跟你打招呼。",
    "{name}比出一個愛心，跟你打招呼。",
    "{name}笑著甩甩頭，跟你打招呼。",
  ],
  youngerBrother: [
    "{name}蹦蹦跳跳地跑過來，跟你打招呼。",
    "{name}舉起雙手，大聲地跟你打招呼。",
    "{name}轉了一圈，開心地跟你打招呼。",
  ],
  youngerSister: [
    "{name}害羞地揮揮手，小小聲地跟你打招呼。",
    "{name}踮起腳尖，輕輕地跟你打招呼。",
    "{name}抱著一朵花，甜甜地跟你打招呼。",
  ],
  baby: [
    "{name}揮揮小手，呀呀地叫著，跟你打招呼。",
    "{name}咿咿呀呀地笑著，跟你打招呼。",
    "{name}笑咪咪地揮揮小手，跟你打招呼。",
  ],
};

// Stage 2 — 一起玩 (❤️5). Which part of the creature the interaction focuses
// on — shown in the panel's instruction line and echoed by the tone of its
// reaction below, so all 9 roles of the same species don't share one
// generic "pat the head" interaction.
const ROLE_PLAY_ACTION: Record<CreatureVariant, string> = {
  grandpa: "摸摸牠的鬍子",
  grandma: "摸摸牠的手",
  dad: "摸摸牠的肩膀",
  mom: "摸摸牠的臉頰",
  olderBrother: "摸摸牠的翅膀",
  olderSister: "摸摸牠的耳朵",
  youngerBrother: "摸摸牠的尾巴",
  youngerSister: "聽聽牠的叫聲",
  baby: "摸摸牠的頭",
};

// Reactions when the creature is tapped/petted — tone matches ROLE_PLAY_ACTION
// above (e.g. youngerSister's "聽聽牠的叫聲" gets an actual call sound back,
// not a generic "that tickles").
const ROLE_PAT_REACTIONS: Record<CreatureVariant, string[]> = {
  grandpa: ["呵呵，鬍子癢癢的！", "謝謝你呀，孩子。", "哈哈，好舒服！"],
  grandma: ["哎呀，手心暖暖的呢。", "乖孩子，謝謝你。", "嘻嘻，你的手好軟喔！"],
  dad: ["謝啦，真棒！", "嗯，感覺不錯。", "哈，好舒服！"],
  mom: ["謝謝你喔，臉頰暖暖的！", "好舒服，謝謝。", "嘻嘻，真開心！"],
  olderBrother: ["嘿，翅膀癢癢的，謝啦！", "哈哈，好玩！", "再來一次！"],
  olderSister: ["嘻嘻，耳朵好癢喔！", "謝謝你，真棒！", "好舒服喔！"],
  youngerBrother: ["嘿嘿，尾巴晃來晃去，好玩！", "再摸一下！", "嘻嘻嘻！"],
  youngerSister: ["啾啾～你聽到了嗎？", "啾啾啾！好聽吧！", "唱首歌給你聽～"],
  baby: ["咯咯笑！", "呀呀～開心！", "笑咪咪！"],
};

// Stage 3 — 一封信 (❤️8). Just the message body — letterText() below wraps
// it in a narrator frame naming who wrote it. A bare quote followed by a
// trailing "——name" signature only makes sense to someone reading the page;
// heard aloud, the name arrives after the sentence it belongs to, too late
// to mean anything.
const ROLE_LETTER_MESSAGE: Record<Exclude<CreatureVariant, "baby">, string> = {
  grandpa: "你是個很棒的孩子。",
  grandma: "要多吃點，別餓著。",
  dad: "謝謝你，我很安心。",
  mom: "謝謝你照顧我們家。",
  olderBrother: "你是最棒的隊友！",
  olderSister: "謝謝你常常來看我。",
  youngerBrother: "下次還要一起玩喔！",
  youngerSister: "你是我最好的朋友！",
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

/** Which part of the creature this role's "一起玩" interaction focuses on —
 * used both for the panel's instruction line and to keep the reaction pool
 * above thematically matched. */
export function playActionText(variant: CreatureVariant): string {
  return ROLE_PLAY_ACTION[variant];
}

export function letterText(displayName: string, variant: CreatureVariant): string {
  if (variant === "baby") {
    return `${displayName}畫了一張歪歪扭扭的圖畫送給你。`;
  }
  return `${displayName}寫給你一封信，信上說：『${ROLE_LETTER_MESSAGE[variant]}』`;
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

/** Narrator-framed versions of the 喜歡／害怕／小秘密 facts, each naming the
 * creature so a child listening (not reading) the profile card knows whose
 * favourite thing or fear she's hearing about — "{name} 最喜歡…" rather than
 * a bare "喜歡太陽" with no subject. Previously only the combined
 * secretIntroText + secret pairing (the "播放秘密" button) was speakable at
 * all; 喜歡 and 害怕 had no voice of their own. */
export function likesText(displayName: string, speciesId: string): string {
  const facts = speciesFacts(speciesId);
  return facts ? `${displayName}最喜歡${facts.likes}。` : "";
}

export function fearText(displayName: string, speciesId: string): string {
  const facts = speciesFacts(speciesId);
  return facts ? `${displayName}最害怕${facts.fear}。` : "";
}

export function secretFactText(displayName: string, speciesId: string): string {
  const facts = speciesFacts(speciesId);
  return facts ? `${displayName}的小秘密是：${facts.secret}` : "";
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
