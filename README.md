# 漢字複習小幫手

給女兒學漢字用的手機網頁 App。每天跟女兒共讀繪本後，把當天學到的漢字記錄下來（自動帶注音），之後用大字卡陪她複習，念對了會有星星獎勵。

## 功能

- **新增今天的漢字**：輸入繪本裡學到的漢字（可一次貼上好幾個字），自動查出注音，遇到破音字可以手動選擇正確讀音，也可以記錄是哪一本繪本。
- **複習模式**：大字卡顯示漢字＋注音，附發音按鈕。女兒念對了按「念對了」拿星星，念錯了按「還不太會」，系統會用類似記憶卡盒（Leitner box）的方式安排之後多久要再複習。
- **學習紀錄**：依日期列出每天新增了哪些字、來自哪本繪本。
- **AI 造句練習**：用 AI（OpenAI）以她已經學過的漢字（加上一份常用文法字白名單）生成短句，讓她練習念整句話，並且「優先」使用最近新學、還不熟的字（依 box 等級排序，不是單純看新增日期，所以會持續優先到她真的學會為止）。句子會存起來重複利用，不會每次都重新生成——同一批句子明天還在，練到熟為止；想要新句子時再按「產生新句子」。念完由旁邊的人（或她自己）按「我念對了」拿星星（比單字複習多，一句 3 顆），念錯按「先跳過」，不做語音辨識判斷（不準確，容易誤判打擊信心）。她也可以按「錄音念念看」把自己念的錄下來，錄完立刻自己播放聽（只在當下播放，不會上傳或保存）。念對了會有星星動畫 + 音效 + 浮誇語音稱讚。句子生成不理想的話，可以在「管理句子庫」裡修改文字或刪除。這個功能需要額外設定，見下方「設定 AI 造句練習」。
- **首頁**：顯示已學漢字總數、累積星星（漢字複習 + 造句練習合計）、今天新增的字，以及目前有幾個字適合複習。

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

2. **設定並部署 Worker**：

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

3. `worker/wrangler.toml` 裡的 `ALLOWED_ORIGIN` 預設是 `https://icelog-tu.github.io`（本專案的 GitHub Pages 網址），Worker 只會接受從這個網址發出的請求，其他來源一律拒絕。如果你的網址不同，記得改這裡再重新 `npm run deploy`。

4. 在本機 `.env` 加上這一行（值換成你自己的 Worker 網址）：

   ```
   VITE_SENTENCE_API_URL=https://hanzi-sentence-worker.<你的帳號>.workers.dev
   ```

5. **強烈建議**到 [OpenAI 後台的 Usage limits](https://platform.openai.com/settings/organization/limits) 設定每月花費上限（例如 5 美元）。這是最後一道保險，就算 Worker 網址不小心外流，也不會產生意外的高額帳單。

6. 重新啟動 `npm run dev` 就能在本機測試「AI 造句練習」了。部署版本要怎麼接上這個功能，見下方「部署」章節的 secrets 設定。

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
