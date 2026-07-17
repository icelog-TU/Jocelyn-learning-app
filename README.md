# 漢字複習小幫手

給女兒學漢字用的手機網頁 App，以「句子」為主的學習方式：每天新增一個學到的漢字或詞彙，AI 立刻圍繞它生成 5 句練習句子，當場念、當場拿星星；之後隨時可以回到紀錄裡，把之前任何一批句子再拿出來複習一次。

## 功能

- **新增漢字／詞彙 + 產生句子（合併在同一頁）**：輸入一個今天學到的漢字或詞彙（例如「學」或「毛毛蟲」），自動查出注音，遇到破音字可以手動選擇正確讀音。如果這個字或詞其實已經學過了，不會重複登錄，而是直接告訴你「已經學過囉」並帶去造句練習。存好（或確認已學過）之後，同一頁下方會出現難度選擇（簡單／中等／困難，難度越高句子越長、念對了星星也越多：2／3／5 顆），可以按「產生 5 句練習句子」讓 AI 生成，也可以按「自己寫句子」完全自己造句、不透過 AI。AI 會用這個字或詞加上已經學過的其他字，生成 5 句都完整包含它、盡量組成真實詞彙／句子的句子（例如目標是「學」，可能生成「我去學校上學」「學生喜歡老師」；目標是「毛毛蟲」就直接把這個詞用進句子裡），而不是把字硬塞進句子裡；後端也會檢查生成結果，過濾掉沒有包含目標或長度不符的句子。**生成之後不會馬上存起來**，而是先進到一個可以編輯的清單：每一句都可以直接改文字、按「✕」刪掉不要的，也可以自己另外寫一句加進去，覺得整批都不滿意還可以按「換一批 AI 句子」重新生成（已經寫好/改好的句子不會被換掉，只換 AI 原本沒動過的那些）；確認好之後按「開始練習這 N 句」才會真正存起來、開始練習。之後只要針對同一個字或詞再生成句子，AI 會參考你之前寫過或修改過的句子的用字風格，盡量生成類似自然的句子，而不是每次都不知道你要的風格重來一次。存起來的句子會標記是「AI」生成的、「你寫的」還是「你修改過」的，可以在「管理句子庫」裡看到。開始練習後，念完由旁邊的人（或她自己）按「我念對了」拿星星，念錯按「先跳過」，不做語音辨識判斷（不準確，容易誤判打擊信心）。她也可以按「錄音念念看」把自己念的錄下來，錄完立刻自己播放聽（只在當下播放，不會上傳或保存）。念對了會有星星動畫 + 音效 + 浮誇語音稱讚，畫面上也有一排星星格子會一顆一顆跳出來、跟著念對的句子數累積，讓還不太懂數字的小朋友也能直接「看到」自己拿了幾顆星星，而不用唸數字。
- **句子紀錄可重複練習**：每次生成的 5 句話會標記「衍生自「X」」跟難度存起來，長期保留。到「紀錄」→「句子紀錄」，會依日期列出每天生成過的每一批句子，每一批都有「🔁 練習這批」按鈕，可以隨時把之前任何一天的任何一批句子叫出來重新練習——每次念對都會再拿一次星星，不限一次。
- **AI 造句練習頁**（造句分頁）：除了在新增頁的當下練習，也可以在這裡自由挑一個已經學過的字或詞、按「產生新句子」另外生成一批，或是複習整個句子庫裡到期該複習的句子（類似記憶卡盒 Leitner box 的排程）。句子生成不理想的話，可以在「管理句子庫」裡修改文字或刪除。這個功能需要額外設定，見下方「設定 AI 造句練習」。
- **標記不熟的字，加強練習**：練習句子時，句卡下方會列出這句用到的每個字，點一下就能標記「這個字還不熟」（再點一次取消）。之後 AI 生成新句子時，會盡量把標記過的字也自然地組進句子裡（不強求，能自然用上就用，例如標記了「相」「信」，之後就有機會生成「相信」）。這些字集中在「紀錄」→「漢字紀錄」頁最上面的「🧩 需要加強練習的字」區塊管理：可以手動輸入新增，也可以按每個字旁邊的「🪄」直接跳去「造句」頁針對這個字生成新的一批句子；確定已經學會、不用再加強了，按「✕」刪掉就好。
- **漢字紀錄**：「紀錄」→「漢字紀錄」依日期列出每天新增了哪些漢字或詞彙。
- **首頁**：顯示已學漢字／詞彙總數、累積星星、今天新增的字，以及目前有幾句適合複習。

## 資料儲存

App 支援兩種模式，由是否設定 Firebase 環境變數決定：

1. **本機模式（預設，不需任何設定）**：資料存在瀏覽器的 localStorage，只在這台裝置、這個瀏覽器上看得到。適合先試用。
2. **雲端同步模式（設定 Firebase 後）**：資料存在 Firestore，只要在不同裝置上輸入同一組「家庭代碼」，就能同步爸媽和女兒裝置上的漢字紀錄。

兩種模式共用同一套 UI／邏輯，之後設定好 Firebase 也不會遺失本機模式累積的資料需要手動搬移（各自獨立儲存）。

### 家庭代碼安全性說明

雲端同步採用「家庭代碼」而非帳號密碼登入，設計上是為了讓 5 歲小朋友的裝置也能快速使用、不需要輸入帳密。家庭代碼本質上是一組共享密鑰：任何知道這組代碼的人都可以讀寫這個家庭的資料。請不要把代碼公開分享，僅在自己家裡的裝置間使用即可。

## 開始開發

```bash
npm install
npm run dev
```

預設不需要設定任何東西就能跑起來（本機模式）。

## 設定 Firebase 雲端同步（選用）

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立一個新專案（免費方案即可）。
2. 在專案中新增一個 **Web App**（網頁圖示 `</>`），複製產生的 config 設定值。
3. 在左側選單啟用：
   - **Firestore Database**：建立資料庫（正式模式即可，之後會套用下方的安全規則）。
   - **Authentication** → Sign-in method → 啟用 **Anonymous（匿名）** 登入。這是為了讓每個裝置能在不需要輸入帳密的情況下通過 Firestore 安全規則。
4. 到 Firestore 的「規則」分頁，貼上專案根目錄的 [`firestore.rules`](./firestore.rules) 內容並發布。
5. 複製 `.env.example` 為 `.env`，填入步驟 2 拿到的設定值：

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

6. 重新啟動 `npm run dev`。開啟 App 時會看到「建立新的家庭空間」，建立後把顯示的代碼記下來，在女兒的裝置上選「加入既有空間」輸入同一組代碼即可同步。

`.env` 內容包含專案設定值，已加入 `.gitignore`，不會被提交到版本控制。

## 設定 AI 造句練習（選用）

這個功能會呼叫 OpenAI 生成句子。**API 金鑰不能直接放在網頁前端**（打開瀏覽器就會被看光，別人可以拿去亂用、花掉你的額度），所以需要另外架一個小小的後端（`worker/` 資料夾，用 [Cloudflare Workers](https://workers.cloudflare.com/)，免費額度很夠用）幫忙保管金鑰、轉發請求。

1. **建立 Cloudflare 帳號**（[dash.cloudflare.com](https://dash.cloudflare.com/sign-up)，免費，不需要信用卡）。

2. **第一次手動部署 Worker**（之後就不用再手動了，見下方「Worker 自動部署」）：

   ```bash
   cd worker
   npm install
   npx wrangler login          # 瀏覽器會跳出來要你登入 Cloudflare
   npx wrangler secret put OPENAI_API_KEY   # 貼上你的 OpenAI API 金鑰
   npm run deploy
   ```

   部署成功後，終端機會印出一個網址，類似：
   ```
   https://hanzi-sentence-worker.<你的帳號>.workers.dev
   ```
   把這個網址記下來。

3. `worker/wrangler.toml` 裡的 `ALLOWED_ORIGIN` 預設是 `https://icelog-tu.github.io`（本專案的 GitHub Pages 網址），Worker 只會接受從這個網址發出的請求，其他來源一律拒絕。如果你的網址不同，記得改這裡再重新部署。

4. 在本機 `.env` 加上這一行（值換成你自己的 Worker 網址）：

   ```
   VITE_SENTENCE_API_URL=https://hanzi-sentence-worker.<你的帳號>.workers.dev
   ```

5. **強烈建議**到 [OpenAI 後台的 Usage limits](https://platform.openai.com/settings/organization/limits) 設定每月花費上限（例如 5 美元）。這是最後一道保險，就算 Worker 網址不小心外流，也不會產生意外的高額帳單。

6. 重新啟動 `npm run dev` 就能在本機測試「AI 造句練習」了。部署版本要怎麼接上這個功能，見下方「部署」章節的 secrets 設定。

### Worker 自動部署

跟前端一樣，`worker/` 資料夾的程式碼有變動並推送到 `main` 或 `claude/hanzi-english-learning-app-bafjgg` 分支時，GitHub Actions 會自動執行 `npm run deploy` 把 Worker 部署到 Cloudflare，不需要再手動回到自己電腦跑指令。

這需要在 repo 的 **Settings → Secrets and variables → Actions** 設定兩個 secret（一次性設定）：

```
CLOUDFLARE_API_TOKEN     # Cloudflare Dashboard → My Profile → API Tokens 建立，權限選「Edit Cloudflare Workers」範本
CLOUDFLARE_ACCOUNT_ID    # Cloudflare Dashboard 首頁可以複製到
```

`OPENAI_API_KEY` 是用 `npx wrangler secret put OPENAI_API_KEY` 另外設定在 Cloudflare 那邊的，不受一般部署影響，重新部署 Worker 不會清掉它，不需要重複設定。

## 部署（GitHub Pages，自動部署）

這個專案設定了 `.github/workflows/deploy.yml`：每次推送到 `main` 或 `claude/hanzi-english-learning-app-bafjgg` 分支，GitHub Actions 就會自動建置並部署到 GitHub Pages，不需要手動操作。

公開網址會是：`https://<GitHub 帳號>.github.io/<repo 名稱>/`（例如 `https://icelog-tu.github.io/Jocelyn-learning-app/`）。

第一次推送後，到 repo 的 **Settings → Pages** 確認 Source 是「GitHub Actions」（通常會自動設定好），並到 **Actions** 分頁看部署是否成功，成功後就能用網址打開。

如果之後有設定 Firebase 或 AI 造句練習（見上方章節）想讓部署版本也能用，需要到 repo 的 **Settings → Secrets and variables → Actions** 新增對應的 secret，值跟本機 `.env` 裡的一樣，設定好之後重新推送一次就會生效：

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_SENTENCE_API_URL
```

在沒有設定這些 secret 之前，部署版本會自動以本機模式（localStorage）運作、AI 造句練習頁面會顯示尚未設定，其他功能不受影響。

部署後用手機瀏覽器打開網址，可以選擇「加入主畫面」把它加到手機桌面，使用起來就像一個 App。

### 其他部署選項

這是純前端的靜態網頁 App，`npm run build` 後產生的 `dist/` 資料夾其實可以部署到任何靜態網站託管服務（Firebase Hosting、Vercel、Netlify、Cloudflare Pages 等）。如果不想用 GitHub Pages，把 `vite.config.ts` 裡的 `base` 改回 `/`，再依平台說明設定 build command `npm run build`、輸出目錄 `dist` 即可。

## 技術棧

- React + TypeScript + Vite
- Firebase（Firestore + Anonymous Auth），未設定時自動退回 localStorage
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) + [pinyin-zhuyin](https://github.com/peterolson/pinyin-zhuyin) 做漢字轉注音
- `worker/`：Cloudflare Workers 寫的小後端，安全保管 OpenAI 金鑰並轉發造句請求
