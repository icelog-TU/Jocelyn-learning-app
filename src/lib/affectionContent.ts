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

/** Per-species, per-role elaboration of the species' secret (SPECIES_FLAVOR
 * above stays the short species-level label shown on the profile card —
 * this is the richer, age/gender-differentiated version actually spoken
 * when a role's 小秘密 row is tapped, so a baby, a big sister, and a
 * grandpa of the same species don't all say the exact same thing). Follows
 * one consistent shape across every species: baby is instinctively drawn to
 * it without understanding it yet; the two younger siblings each know a
 * little and have one named favourite of their own; the two older siblings
 * know several, gendered the same way the younger pair's is; dad and mom
 * each have their own grown-up take on it; grandpa and grandma have
 * mastered it completely and pass it on as family lore. */
const SPECIES_ROLE_SECRETS: Record<string, Record<CreatureVariant, string>> = {
  mouse: {
    baby: "還不知道要把起司藏在哪裡，但很喜歡起司香香的味道，聞到就會很開心。",
    youngerSister: "枕頭底下藏了一小塊起司，最喜歡的口味是草莓起司。",
    youngerBrother: "枕頭底下藏了一小塊起司，最喜歡的口味是烤肉起司。",
    olderSister: "枕頭底下藏了好幾種起司，像是蜂蜜起司、花香起司，還有水果起司。",
    olderBrother: "枕頭底下藏了好幾種起司，像是辣味起司、燒烤起司，還有大力士起司。",
    dad: "枕頭底下藏的是特大塊的起司，是全家最大塊的，他說這樣才有安全感。",
    mom: "枕頭底下藏的是切成小塊、方便分享的起司，隨時可以分給家人吃一點。",
    grandpa: "已經收藏了上百種起司口味，每一種都能說出它的故事。",
    grandma: "已經收藏了上百種起司口味，還會教大家怎麼分辨每一種的香味。",
  },
  turtle: {
    baby: "殼裡面還沒有畫什麼圖案，但只要有人願意看，就會害羞地探出頭來。",
    youngerSister: "殼裡面畫了一顆小小的星星，只給最要好的朋友看過一次。",
    youngerBrother: "殼裡面畫了一顆小小的星星，得意地跟每個新朋友炫耀。",
    olderSister: "殼裡面畫了一整排星星和小花，排成一個漂亮的圖案。",
    olderBrother: "殼裡面畫了一整排星星和閃電，看起來很有速度感。",
    dad: "殼裡面畫的是全家人的名字，排成一個小小的星星形狀。",
    mom: "殼裡面畫的是全家人最喜歡的東西，一人一顆星星代表。",
    grandpa: "殼裡面畫滿了好幾百顆星星，每一顆都代表一個曾經幫助過的朋友。",
    grandma: "殼裡面畫滿了好幾百顆星星，還會一顆一顆講出背後的故事。",
  },
  fox: {
    baby: "還不太會控制尾巴發光，只有睡著的時候才會微微亮一下。",
    youngerSister: "尾巴會發出淡淡的粉紅色光，晚上喜歡用它照著故事書看。",
    youngerBrother: "尾巴會發出淡淡的藍色光，晚上喜歡拿它當手電筒探險。",
    olderSister: "已經可以控制尾巴的亮度，還能讓光一閃一閃地跟朋友傳暗號。",
    olderBrother: "已經可以控制尾巴的亮度，喜歡在森林裡幫大家照路探險。",
    dad: "尾巴的光特別穩定又持久，每天晚上都用它送家人回家。",
    mom: "尾巴的光特別溫柔，睡前會用它輕輕照著大家，哄大家入睡。",
    grandpa: "尾巴的光已經練到能照亮一整片森林，還會用光說古老的故事。",
    grandma: "尾巴的光已經練到能照亮一整片森林，年輕的狐狸都會來跟她學。",
  },
  rabbit: {
    baby: "還不知道要留到最後吃，常常一下子就把葉子吃光光了。",
    youngerSister: "已經學會留一小片葉子到最後，捨不得一次吃完。",
    youngerBrother: "已經學會留一小片葉子到最後，但常常忍不住提早偷吃掉。",
    olderSister: "會把葉子分成好幾份，一份一份慢慢吃，還會跟朋友分享。",
    olderBrother: "會把葉子留到比賽贏了才吃，當作給自己的獎勵。",
    dad: "每次都把最好的那片葉子留給家人，自己吃剩下的也很開心。",
    mom: "會把葉子做成好看的裝飾，捨不得吃，看很久才捨得吃掉。",
    grandpa: "已經吃過上千種紅蘿蔔葉子，一口就能分辨出是哪裡種的。",
    grandma: "已經吃過上千種紅蘿蔔葉子，還會教大家怎麼挑最好吃的葉子。",
  },
  cat: {
    baby: "還不知道星星的名字，但是很喜歡星星，看到就會開心地打招呼。",
    youngerSister: "知道一點點星星的名字，最喜歡的是公主星星。",
    youngerBrother: "知道一點點星星的名字，最喜歡的是超人星星。",
    olderSister: "知道好多星星的名字，像是美人魚星星、精靈星星，還有魔法師星星。",
    olderBrother: "知道好多星星的名字，像是王子星星、騎士星星，還有英雄星星。",
    dad: "最喜歡的是太陽星星，每天晚上都會找找看它在哪裡。",
    mom: "最喜歡的是月亮星星，總是溫柔地看著它，說晚安。",
    grandpa: "知道好幾百顆星星的名字，晚上抬頭一看就能講出好多星星的故事。",
    grandma: "知道好幾百顆星星的名字，還會把每顆星星的故事編成搖籃曲唱給你聽。",
  },
  sheep: {
    baby: "身上的毛還軟軟蓬蓬的，喜歡整個人窩進雲朵裡睡覺。",
    youngerSister: "已經有自己專屬的一朵小雲，午睡時間到了就會去找它。",
    youngerBrother: "已經有自己專屬的一朵小雲，喜歡在雲朵上翻跟斗。",
    olderSister: "會挑不同形狀的雲朵睡午覺，最喜歡愛心形狀的雲。",
    olderBrother: "會挑不同形狀的雲朵睡午覺，最喜歡像賽車一樣長長的雲。",
    dad: "每天都睡在同一朵最厚實的雲上，說這樣最有安全感。",
    mom: "每天都會鋪一朵軟軟的雲給全家人一起午睡。",
    grandpa: "已經在雲上睡了好幾萬次午覺，還能靠雲的形狀預測天氣。",
    grandma: "已經在雲上睡了好幾萬次午覺，身上的毛是全家族裡最柔軟的。",
  },
  bird: {
    baby: "還不會飛得很高，但只要一有陽光灑下來，就會開心地拍拍翅膀。",
    youngerSister: "已經可以飛到樹梢那麼高，最喜歡看清晨第一道陽光。",
    youngerBrother: "已經可以飛到樹梢那麼高，最喜歡追著陽光跑來跑去。",
    olderSister: "已經可以飛到雲朵那麼高，看過好幾種不同顏色的日出。",
    olderBrother: "已經可以飛到雲朵那麼高，喜歡比賽誰先看到太陽升起。",
    dad: "每天一早就飛得高高的，看著太陽升起才安心去做別的事。",
    mom: "每天一早就飛得高高的，看著太陽升起，然後回來叫醒全家人。",
    grandpa: "飛得比誰都高，看過幾萬次日出，能一眼看出今天天氣好不好。",
    grandma: "飛得比誰都高，看過幾萬次日出，會把每次看到的顏色都記下來。",
  },
  bear: {
    baby: "還不知道秘密山洞在哪裡，只是很喜歡發亮的石頭，會一直盯著看。",
    youngerSister: "已經收集了三顆發亮的小石頭，最喜歡粉紅色的那顆。",
    youngerBrother: "已經收集了三顆發亮的小石頭，最喜歡藍色的那顆。",
    olderSister: "收集了好多顏色的發亮石頭，會把它們排成好看的圖案。",
    olderBrother: "收集了好多顏色的發亮石頭，會把它們排成城堡的形狀。",
    dad: "收集的是全家最大顆的發亮石頭，放在洞口守護著大家。",
    mom: "收集的石頭會一顆一顆分給家人，讓每個人的房間都亮亮的。",
    grandpa: "已經收集了一百多顆發亮的石頭，還能說出每一顆是在哪裡找到的。",
    grandma: "已經收集了一百多顆發亮的石頭，還會用它們排出星座的形狀。",
  },
  penguin: {
    baby: "肚子上還是白白的，但很喜歡看別人身上五顏六色的花紋。",
    youngerSister: "已經在肚子上畫了一個小小的愛心圖案。",
    youngerBrother: "已經在肚子上畫了一個小小的閃電圖案。",
    olderSister: "每年都會換新花樣，這次畫的是一整排小星星。",
    olderBrother: "每年都會換新花樣，這次畫的是一整排小火箭。",
    dad: "肚子上畫的花紋十年沒換過，說這是他最喜歡的樣子。",
    mom: "肚子上的花紋每年都會配合節日換一次，總是最應景的那個。",
    grandpa: "肚子上的花紋換過上百種，每一種都有屬於那一年的故事。",
    grandma: "肚子上的花紋換過上百種，還留著最早畫的第一個花樣。",
  },
  deer: {
    baby: "角還小小的，但只要一開心，就會冒出一點點小花苞。",
    youngerSister: "心情好的時候，角上會開出一朵小小的粉色花。",
    youngerBrother: "心情好的時候，角上會開出一朵小小的橘色花。",
    olderSister: "心情好的時候，角上會開出好幾朵不同顏色的花，像個小花園。",
    olderBrother: "心情好的時候，角上會開出好幾朵花，還喜歡比賽誰開得多。",
    dad: "角上開的花特別大朵，是全家心情最平穩、最常開花的一個。",
    mom: "角上開的花特別香，靠近一點就能聞到淡淡的花香。",
    grandpa: "角上開過的花種類多到數不清，還能一眼認出每一種花的名字。",
    grandma: "角上開過的花種類多到數不清，會把最漂亮的乾燥花保存起來。",
  },
  owl: {
    baby: "還聽不懂風的悄悄話，但很喜歡靜靜地聽風吹過的聲音。",
    youngerSister: "已經聽得懂一點點風的悄悄話，知道風在說「要下雨了」。",
    youngerBrother: "已經聽得懂一點點風的悄悄話，知道風在說「要出太陽了」。",
    olderSister: "聽得懂好多風的悄悄話，還能分辨出是哪個方向吹來的風。",
    olderBrother: "聽得懂好多風的悄悄話，喜歡把明天的天氣提早告訴朋友。",
    dad: "每天晚上都聽風的悄悄話，隔天早上準時告訴全家該不該帶傘。",
    mom: "每天晚上都聽風的悄悄話，還會順便聽聽風有沒有帶來誰的消息。",
    grandpa: "聽風的悄悄話聽了一輩子，準確度幾乎從來沒有錯過。",
    grandma: "聽風的悄悄話聽了一輩子，還能聽出風裡藏著的老故事。",
  },
  horse: {
    baby: "還跑不快，但只要一興奮起來，蹄子就會冒出一點點小小的光。",
    youngerSister: "跑快一點的時候，身後會留下淡淡的粉色光。",
    youngerBrother: "跑快一點的時候，身後會留下淡淡的藍色光。",
    olderSister: "已經跑得夠快，能留下一小段完整的彩虹，還會轉圈圈畫圓形。",
    olderBrother: "已經跑得夠快，能留下一小段完整的彩虹，喜歡跟朋友比賽誰的更長。",
    dad: "跑起來留下的彩虹又長又穩，是全家跑得最遠的一個。",
    mom: "跑起來留下的彩虹顏色特別柔和，看起來像傍晚的晚霞。",
    grandpa: "這輩子留下的彩虹加起來可以繞森林好幾圈，年輕馬都想跟他學。",
    grandma: "這輩子留下的彩虹加起來可以繞森林好幾圈，最喜歡用它教小馬認顏色。",
  },
  fish: {
    baby: "還不太會許願，吐出來的泡泡常常一下子就忘記要許什麼。",
    youngerSister: "已經會許一個小小的願望，最喜歡許「明天也要開心」。",
    youngerBrother: "已經會許一個小小的願望，最喜歡許「明天要交到新朋友」。",
    olderSister: "一次能吐出好幾個泡泡，每個都裝著不同的願望。",
    olderBrother: "一次能吐出好幾個泡泡，喜歡比賽誰的泡泡飛得比較高。",
    dad: "每天固定吐一個泡泡，願望永遠都是希望全家平安健康。",
    mom: "每天固定吐一個泡泡，願望永遠都是希望大家吃得飽、睡得好。",
    grandpa: "這輩子吐過的泡泡多到數不清，還記得每一個實現過的願望。",
    grandma: "這輩子吐過的泡泡多到數不清，最會教小魚怎麼許出最真心的願望。",
  },
  butterfly: {
    baby: "翅膀圖案還很簡單，但已經開始偷偷地慢慢改變了。",
    youngerSister: "翅膀上悄悄多了一點點粉色的花紋，只有自己發現。",
    youngerBrother: "翅膀上悄悄多了一點點條紋，只有自己發現。",
    olderSister: "已經注意到自己翅膀每天都在變，會偷偷用畫筆記錄下來。",
    olderBrother: "已經注意到自己翅膀每天都在變，喜歡跟朋友比誰的花紋比較酷。",
    dad: "翅膀的花紋變化特別穩定，好像跟著四季悄悄轉換顏色。",
    mom: "翅膀的花紋變化特別漂亮，總是配合心情調整成最柔和的樣子。",
    grandpa: "翅膀已經變化了好幾千次，是全家族花紋最豐富的一位。",
    grandma: "翅膀已經變化了好幾千次，還記得每一種曾經出現過的花紋。",
  },
  dragon: {
    baby: "看起來還不太兇，肚子隨便碰一下就咯咯笑個不停。",
    youngerSister: "假裝自己很兇，但肚子被搔一下馬上就會笑出來。",
    youngerBrother: "假裝自己很兇，但肚子被搔一下馬上就會笑出來，還會假裝生氣。",
    olderSister: "已經可以忍住不笑一下下，但搔久一點還是會投降。",
    olderBrother: "已經可以忍住不笑一下下，還喜歡故意逗弟弟妹妹來搔自己癢。",
    dad: "平常看起來最兇，但其實全家最容易被搔癢逗笑的就是他。",
    mom: "平常看起來很溫柔，但被搔癢的時候笑聲是全家最大聲的。",
    grandpa: "兇了一輩子的表情，但只有最親近的家人知道他其實很怕癢。",
    grandma: "慈祥了一輩子的樣子，但只要孫子孫女一搔癢，馬上就笑得合不攏嘴。",
  },
  lion: {
    baby: "鬃毛還小小的，摸起來只有一點點溫溫的感覺。",
    youngerSister: "鬃毛摸起來暖暖的，最喜歡讓朋友摸一下取暖。",
    youngerBrother: "鬃毛摸起來暖暖的，最喜歡在冬天抱著朋友一起取暖。",
    olderSister: "鬃毛的溫度可以自己調整，會配合天氣調得剛剛好。",
    olderBrother: "鬃毛的溫度可以自己調整，喜歡在朋友發抖的時候借他取暖。",
    dad: "鬃毛裡藏的陽光最多，晚上抱著全家人睡覺也不會冷。",
    mom: "鬃毛裡藏的陽光最溫柔，總是把最暖的地方讓給小朋友。",
    grandpa: "鬃毛藏了一輩子的陽光，摸起來像曬過一整個夏天的棉被。",
    grandma: "鬃毛藏了一輩子的陽光，最喜歡在冬天抱著孫子孫女說故事。",
  },
  pig: {
    baby: "打滾完常常忘記要洗香香，都是家人提醒才會去洗。",
    youngerSister: "打滾完一定會馬上去洗香香，最喜歡草莓香味的泡泡。",
    youngerBrother: "打滾完一定會馬上去洗香香，最喜歡薄荷香味的泡泡。",
    olderSister: "打滾完會馬上去洗香香，還會順便幫弟弟妹妹一起洗。",
    olderBrother: "打滾完會馬上去洗香香，速度是全家最快的一個。",
    dad: "打滾完洗香香的時候，會順便把全身檢查一遍，確保乾乾淨淨。",
    mom: "打滾完洗香香的時候，會特別仔細，是全家洗得最乾淨的一個。",
    grandpa: "洗香香洗了一輩子，身上總是有淡淡的、讓人安心的香味。",
    grandma: "洗香香洗了一輩子，還會調配出全家族最喜歡的專屬香味。",
  },
  monkey: {
    baby: "還不知道要分享，看到香蕉都會自己一個人抱著不放。",
    youngerSister: "已經藏了幾根香蕉，都是留給最要好的朋友吃的。",
    youngerBrother: "已經藏了幾根香蕉，都是留著要跟朋友比賽誰吃得快的。",
    olderSister: "藏了滿滿一籃香蕉，會平均分給每一個朋友，一根都不漏。",
    olderBrother: "藏了滿滿一籃香蕉，喜歡辦一個分享大會，大家一起吃。",
    dad: "藏的香蕉是全家最多的，隨時準備好招待突然來訪的朋友。",
    mom: "藏的香蕉會做成香蕉點心，是全家最受歡迎的下午茶。",
    grandpa: "藏了一整片香蕉林，這輩子分享出去的香蕉已經數不清了。",
    grandma: "藏了一整片香蕉林，還會教大家怎麼挑最甜的那一根。",
  },
  dolphin: {
    baby: "還不太會跳出水面，但只要一露出頭，就會開心地張望四周。",
    youngerSister: "跳出水面的時候，會偷偷許一個「今天要交新朋友」的願望。",
    youngerBrother: "跳出水面的時候，會偷偷許一個「今天要跳得更高」的願望。",
    olderSister: "每次跳出水面都會許一個願望，還會記錄下哪些願望實現了。",
    olderBrother: "每次跳出水面都會許一個願望，喜歡挑戰跳得一次比一次高。",
    dad: "每天固定跳出水面一次，願望永遠都是希望全家一起平安快樂。",
    mom: "每天固定跳出水面一次，願望永遠都是希望孩子們健康長大。",
    grandpa: "這輩子跳出水面許過的願望多到數不清，好多都悄悄實現了。",
    grandma: "這輩子跳出水面許過的願望多到數不清，最喜歡把願望說給孫子聽。",
  },
  wolf: {
    baby: "還不太會嚎叫，只能發出小小聲的「嗚～」，但也是在說晚安。",
    youngerSister: "已經學會小小聲地嚎叫，跟住得比較近的朋友說晚安。",
    youngerBrother: "已經學會小小聲地嚎叫，喜歡跟朋友比誰的聲音傳得比較遠。",
    olderSister: "嚎叫聲已經傳得很遠，好多住在遠方的朋友都聽得到。",
    olderBrother: "嚎叫聲已經傳得很遠，喜歡在滿月的晚上特別大聲嚎叫。",
    dad: "每天晚上都會嚎叫一次，聲音低沉又穩重，全森林都聽得到。",
    mom: "每天晚上都會嚎叫一次，聲音溫柔，像在說「晚安，做個好夢」。",
    grandpa: "嚎叫了一輩子，聲音裡藏著好多老朋友才聽得懂的暗號。",
    grandma: "嚎叫了一輩子，最喜歡在嚎叫裡加上搖籃曲一樣的旋律哄小狼睡覺。",
  },
};

/** How deeply into 喜歡/{topic} each role has gotten, purely as a function of
 * age — a baby just enjoys it without understanding it, the two youngest
 * roles are picking up a first bit of skill, the two oldest kids are
 * already good at it, and the grown-ups/grandparents are further along
 * still. Fully generic (just the species' own "likes" topic dropped in), so
 * it applies to any of the 20 species without per-species authoring, while
 * still making every one of the 9 family roles sound like a different
 * creature with a different relationship to the same shared family
 * interest — which is the actual complaint being fixed here. */
const ROLE_LIKES_GRADIENT: Record<CreatureVariant, string> = {
  baby: "{name}也很喜歡{topic}，只是還不太懂，單純覺得很開心。",
  youngerSister: "{name}已經開始會一點點{topic}的小技巧了，每次成功都很有成就感。",
  youngerBrother: "{name}也已經開始會一點點{topic}的小技巧了，常常纏著哥哥姊姊要一起做。",
  olderSister: "{name}對{topic}已經很拿手了，還會耐心地教弟弟妹妹。",
  olderBrother: "{name}對{topic}已經很拿手了，還會找機會跟朋友比賽。",
  dad: "{name}也很喜歡{topic}，會固定找時間好好享受，是他放鬆的方式。",
  mom: "{name}也很喜歡{topic}，常常在忙碌之餘抽空享受一下，整個人都會放鬆下來。",
  grandpa: "{name}對{topic}已經是專家等級了，什麼都難不倒他，還會講好多相關的故事給你聽。",
  grandma: "{name}對{topic}已經是專家等級了，知道好多好多小知識，還會講好多相關的故事給你聽。",
};

/** How each role handles being 害怕/{topic} — same age-based arc as the
 * likes gradient above (crying → hiding-but-found → reluctantly coping →
 * grown-up composure → total mastery), also fully generic across species. */
const ROLE_FEAR_GRADIENT: Record<CreatureVariant, string> = {
  baby: "{name}只要{topic}，就會忍不住大哭。",
  youngerSister: "{name}只要{topic}，就會躲起來，但每次都會被媽媽找到。",
  youngerBrother: "{name}只要{topic}，就會躲進棉被裡不出來，最後都是爸爸把他抱出來的。",
  olderSister: "{name}現在已經可以自己面對{topic}了，只是會邊做邊碎念，但至少不會哭鬧。",
  olderBrother: "{name}只要{topic}，還是會很討厭，但已經可以勉強忍住不哭了。",
  dad: "{name}表面上完全不怕{topic}，還會鼓勵大家，但心裡其實也有一點點不喜歡。",
  mom: "{name}已經找到自己的方法輕鬆面對{topic}，還會一邊做一邊唱歌給你聽。",
  grandpa: "{name}心裡其實還是怕{topic}，但完全不會表現出來，大家都以為他不怕了。",
  grandma: "{name}其實也怕{topic}，但總是笑咪咪地說「這沒什麼」，安慰著比較害怕的孫子孫女。",
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

/** Narrator-framed, role-differentiated versions of the 喜歡／害怕／小秘密
 * facts, each naming the creature so a child listening (not reading) the
 * profile card knows whose favourite thing or fear she's hearing about —
 * "{name} 最喜歡…" rather than a bare "喜歡太陽" with no subject — and each
 * elaborated by how old/mastered that particular family role is at it, so a
 * baby, a big sister, and a grandpa of the same species genuinely sound
 * like different individuals instead of reciting the identical species-wide
 * fact. The short species-level SPECIES_FLAVOR label (facts.likes/fear)
 * still drives what's shown on the compact profile-card row — this is only
 * the richer sentence spoken aloud when that row is tapped. */
export function likesText(displayName: string, speciesId: string, variant: CreatureVariant): string {
  const facts = speciesFacts(speciesId);
  if (!facts) return "";
  return fill(ROLE_LIKES_GRADIENT[variant], { name: displayName, topic: facts.likes });
}

export function fearText(displayName: string, speciesId: string, variant: CreatureVariant): string {
  const facts = speciesFacts(speciesId);
  if (!facts) return "";
  return fill(ROLE_FEAR_GRADIENT[variant], { name: displayName, topic: facts.fear });
}

/** The raw per-role elaboration (no name-framing) — used by the "播放秘密"
 * button, which already gets its own name-framing from secretIntroText and
 * would otherwise say the creature's name twice in a row. */
export function secretElaborationText(speciesId: string, variant: CreatureVariant): string {
  return SPECIES_ROLE_SECRETS[speciesId]?.[variant] ?? "";
}

/** The species-level secret (SPECIES_FLAVOR.secret) is still shown as the
 * short profile-card label; this is the per-role elaboration actually
 * spoken when that row is individually tapped, pulled from
 * SPECIES_ROLE_SECRETS. */
export function secretFactText(displayName: string, speciesId: string, variant: CreatureVariant): string {
  const elaboration = secretElaborationText(speciesId, variant);
  return elaboration ? `${displayName}的小秘密是：${elaboration}` : "";
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
