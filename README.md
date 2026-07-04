# 漢字複習小幫手

給女兒學漢字用的手機網頁 App。每天跟女兒共讀繪本後，把當天學到的漢字記錄下來（自動帶注音），之後用大字卡陪她複習，念對了會有星星獎勵。

## 功能

- **新增今天的漢字**：輸入繪本裡學到的漢字（可一次貼上好幾個字），自動查出注音，遇到破音字可以手動選擇正確讀音，也可以記錄是哪一本繪本。
- **複習模式**：大字卡顯示漢字＋注音，附發音按鈕。女兒念對了按「念對了」拿星星，念錯了按「還不太會」，系統會用類似記憶卡盒（Leitner box）的方式安排之後多久要再複習。
- **學習紀錄**：依日期列出每天新增了哪些字、來自哪本繪本。
- **首頁**：顯示已學漢字總數、累積星星、今天新增的字，以及目前有幾個字適合複習。

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

## 部署（GitHub Pages，自動部署）

這個專案設定了 `.github/workflows/deploy.yml`：每次推送到 `main` 或 `claude/hanzi-english-learning-app-bafjgg` 分支，GitHub Actions 就會自動建置並部署到 GitHub Pages，不需要手動操作。

公開網址會是：`https://<GitHub 帳號>.github.io/<repo 名稱>/`（例如 `https://icelog-tu.github.io/Jocelyn-learning-app/`）。

第一次推送後，到 repo 的 **Settings → Pages** 確認 Source 是「GitHub Actions」（通常會自動設定好），並到 **Actions** 分頁看部署是否成功，成功後就能用網址打開。

如果之後有設定 Firebase（見上方章節）想讓部署版本也能雲端同步，需要到 repo 的 **Settings → Secrets and variables → Actions** 新增以下 6 組 secret，值跟本機 `.env` 裡的一樣，設定好之後重新推送一次就會生效：

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

在沒有設定這些 secret 之前，部署版本會自動以本機模式（localStorage）運作，一樣可以正常使用，只是不會跨裝置同步。

部署後用手機瀏覽器打開網址，可以選擇「加入主畫面」把它加到手機桌面，使用起來就像一個 App。

### 其他部署選項

這是純前端的靜態網頁 App，`npm run build` 後產生的 `dist/` 資料夾其實可以部署到任何靜態網站託管服務（Firebase Hosting、Vercel、Netlify、Cloudflare Pages 等）。如果不想用 GitHub Pages，把 `vite.config.ts` 裡的 `base` 改回 `/`，再依平台說明設定 build command `npm run build`、輸出目錄 `dist` 即可。

## 技術棧

- React + TypeScript + Vite
- Firebase（Firestore + Anonymous Auth），未設定時自動退回 localStorage
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) + [pinyin-zhuyin](https://github.com/peterolson/pinyin-zhuyin) 做漢字轉注音
