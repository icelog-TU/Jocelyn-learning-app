/**
 * Common Traditional Chinese function/grammar characters a 5-year-old's
 * picture-book vocabulary won't necessarily cover, but that are needed to
 * form natural sentences. The AI may combine these with the child's known
 * hanzi, but every "content" character should ideally come from her list.
 */
export const GRAMMAR_WHITELIST = [
  // Pronouns
  "我", "你", "他", "她", "它", "們",
  // Numbers
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "兩", "幾",
  // Common verbs
  "是", "有", "在", "去", "來", "要", "想", "會", "能", "可", "以", "喜", "歡",
  "看", "聽", "說", "吃", "喝", "睡", "玩", "走", "跑", "跳", "笑", "哭", "叫",
  "買", "做", "給", "讓", "打", "開", "關", "穿", "洗", "唱", "畫", "抱",
  // Common adjectives
  "大", "小", "多", "少", "好", "壞", "高", "矮", "快", "慢", "新", "舊",
  "冷", "熱", "漂", "亮", "香", "甜", "酸", "苦", "累", "乖", "棒",
  // Time words
  "天", "今", "明", "昨", "年", "月", "日", "早", "晚", "現", "時", "候",
  "分", "鐘", "週", "末", "氣",
  // Location words
  "裡", "面", "上", "下", "前", "後", "左", "右", "家", "校", "園", "門",
  "口", "外", "內", "邊", "這", "那",
  // Quantifiers / classifiers
  "個", "隻", "條", "顆", "本", "片", "杯", "張", "朵", "台", "輛", "間",
  // Connectives / particles
  "的", "了", "嗎", "呢", "吧", "著", "過", "得", "地", "和", "跟", "但",
  "因", "為", "所", "就", "才", "又", "也", "還", "都", "很", "非", "常",
  "不", "沒",
  // Question words
  "什", "麼", "誰", "哪", "怎", "樣",
] as const;
