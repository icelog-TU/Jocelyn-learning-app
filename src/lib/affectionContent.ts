import type { CreatureVariant } from "../types";

interface SpeciesFlavor {
  /** A short activity, used in the ❤️3 "play" stage. */
  trait: string;
  /** The species-level secret revealed at the ❤️10 "secret" stage. */
  secret: string;
}

/** Personality flavor per species, shared across all 9 role variants of
 * that species (an electric mouse dad and an electric mouse baby are still
 * both electric mice, so they share the same trait/secret; the role
 * templates below change the tone, not the underlying species lore). */
const SPECIES_FLAVOR: Record<string, SpeciesFlavor> = {
  mouse: { trait: "追著自己的尾巴轉圈圈", secret: "其實我最喜歡把起司藏在枕頭底下，這樣睡覺的時候會有淡淡的起司香。" },
  turtle: { trait: "在池塘裡慢慢地游泳", secret: "我的殼裡面畫了一整片小星星，只有最要好的朋友才看得到。" },
  fox: { trait: "在草地上翻滾曬太陽", secret: "我尾巴尖尖的地方會發出一點點溫暖的光，晚上可以照路。" },
  rabbit: { trait: "在花園裡跳來跳去", secret: "我其實會把最喜歡的紅蘿蔔葉子留到最後才吃，捨不得一次吃完。" },
  cat: { trait: "在屋頂上看星星", secret: "我知道每一顆星星的名字，晚上都會偷偷跟它們打招呼。" },
  sheep: { trait: "在草原上打滾", secret: "我身上的毛摸起來像雲朵一樣軟，因為我每天都在雲上睡午覺。" },
  bird: { trait: "在陽光下展開翅膀", secret: "我飛得很高的時候，可以看到全世界的太陽同時升起。" },
  bear: { trait: "在山洞裡堆石頭", secret: "我收集了一百顆會發亮的小石頭，藏在只有我知道的秘密山洞裡。" },
  penguin: { trait: "在冰上滑來滑去", secret: "我肚子上的斑紋其實是我自己畫上去的，每年都會換一個新花樣。" },
  deer: { trait: "在森林裡採野花", secret: "我的角上其實可以開出小花，只有心情很好的時候才會開。" },
  owl: { trait: "在夜裡靜靜地看月亮", secret: "我可以聽懂風吹過樹葉的悄悄話，它們常常跟我說明天的天氣。" },
  horse: { trait: "在草原上奔跑", secret: "我跑得夠快的時候，身後會留下一條淡淡的彩虹，只有仔細看才會發現。" },
  fish: { trait: "吐出一串一串的泡泡", secret: "我吐出來的泡泡裡，其實都裝著一個小小的願望。" },
  butterfly: { trait: "跟著微風到處飛", secret: "我的翅膀圖案每天都會偷偷變一點點，沒有人發現過。" },
  dragon: { trait: "在山頂上曬太陽", secret: "我看起來很兇，其實很怕癢，肚子被搔一下就會忍不住笑出來。" },
  lion: { trait: "在草地上打哈欠", secret: "我的鬃毛裡面藏著一點點陽光，摸起來會暖暖的。" },
  pig: { trait: "在泥巴裡打滾", secret: "我其實很愛乾淨，打滾完一定會馬上去洗香香。" },
  monkey: { trait: "在樹枝間盪來盪去", secret: "我藏了一整棵樹的香蕉，都是留著要跟好朋友一起分享的。" },
  dolphin: { trait: "在海浪裡跳來跳去", secret: "我跳出水面的時候，會偷偷許一個願望才落回海裡。" },
  wolf: { trait: "在雪地裡奔跑", secret: "我的叫聲其實是在跟遠方的朋友說晚安。" },
};

const ROLE_GREETING: Record<CreatureVariant, string> = {
  grandpa: "「孩子你好啊，我是{name}，很高興認識你。」",
  grandma: "「哎呀，是你來啦～我是{name}，快坐下歇會兒。」",
  dad: "「你好，我是{name}。」",
  mom: "「你好呀，我是{name}，歡迎你常常來找我們。」",
  olderBrother: "「嘿，我是{name}，罩你！」",
  olderSister: "「你好呀，我是{name}，要不要一起玩？」",
  youngerBrother: "「欸嘿，我是{name}，你敢不敢跟我比賽？」",
  youngerSister: "「嗨嗨！我是{name}，我們可以當好朋友嗎？」",
  baby: "（揮揮小手）「呀～呀～」{name}對你笑咪咪的。",
};

const ROLE_PLAY: Record<CreatureVariant, string> = {
  grandpa: "{name}教你摺一架紙飛機，還說了一個好久好久以前的故事。",
  grandma: "{name}煮了熱呼呼的湯給你喝，一直叫你多吃一點。",
  dad: "{name}把你舉高高，陪你在院子裡散步。",
  mom: "{name}陪著你，一起{trait}。",
  olderBrother: "{name}教你怎麼把積木疊得高高的，還說你超厲害。",
  olderSister: "{name}邀你一起編花環，戴在頭上笑得好開心。",
  youngerBrother: "{name}拉著你說：「我們來比賽誰跑得快！」",
  youngerSister: "{name}拉著你的手說：「我們一起玩扮家家酒好不好？」",
  baby: "{name}咯咯笑著，伸出雙手要你抱抱。",
};

const ROLE_LETTER: Record<CreatureVariant, string> = {
  grandpa: "一封字跡工整的信：「你是個很棒的孩子，爺爺很高興認識你。——{name}」",
  grandma: "一封信，字跡溫暖：「要多吃點，別餓著自己喔。——{name}」",
  dad: "一封信：「謝謝你，你讓{name}覺得很安心。」",
  mom: "一封信：「謝謝你這麼照顧我們家，記得也要照顧好自己喔。——{name}」",
  olderBrother: "一張紙條：「你是最棒的隊友！下次再一起玩。——{name}」",
  olderSister: "一封信：「謝謝你常常來看我，我真的很開心。——{name}」",
  youngerBrother: "一張紙條，字有點歪歪的：「下次還要一起玩喔！——{name}」",
  youngerSister: "一張畫滿愛心的紙條：「你是我最好的朋友！——{name}」",
  baby: "一張歪歪扭扭的塗鴉，{name}指著它，好像在說這是要送給你的抱抱。",
};

const ROLE_SECRET_INTRO: Record<CreatureVariant, string> = {
  grandpa: "{name}壓低聲音，說出一個藏了好久的秘密：「{secret}」",
  grandma: "{name}摸摸你的頭，輕輕地說：「{secret}」",
  dad: "{name}蹲下來，認真地告訴你一個秘密：「{secret}」",
  mom: "{name}抱著你，在你耳邊輕輕說：「{secret}」",
  olderBrother: "{name}勾著你的肩膀，小聲說：「這是我們兩個的秘密喔：{secret}」",
  olderSister: "{name}拉著你的手，悄悄說：「跟你說一個秘密：{secret}」",
  youngerBrother: "{name}神秘兮兮地說：「噓～我要告訴你一個秘密：{secret}」",
  youngerSister: "{name}趴在你耳邊，小小聲地說：「這是秘密喔：{secret}」",
  baby: "{name}趴在你肩膀上，含糊地說出一個秘密：「{secret}」",
};

const STAGE_TEMPLATES = [ROLE_GREETING, ROLE_PLAY, ROLE_LETTER, ROLE_SECRET_INTRO];

export const AFFECTION_STAGE_TITLES = ["打招呼", "一起玩", "一封信", "小秘密"];

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/** stage 0-3, matching AFFECTION_STAGE_TITLES / the 0, ❤️3, ❤️5, ❤️10 unlocks. */
export function affectionStageText(stage: number, speciesId: string, displayName: string, variant: CreatureVariant): string {
  const flavor = SPECIES_FLAVOR[speciesId];
  const template = STAGE_TEMPLATES[stage]?.[variant] ?? "";
  return fill(template, { name: displayName, trait: flavor?.trait ?? "", secret: flavor?.secret ?? "" });
}
