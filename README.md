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

## 部署

這是純前端的靜態網頁 App，`npm run build` 後產生的 `dist/` 資料夾可以部署到任何靜態網站託管服務，例如：

- **Firebase Hosting**（跟 Firestore 同一個專案，設定最簡單）：
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase init hosting   # public directory 選 dist
  npm run build
  firebase deploy
  ```
- Vercel、Netlify、Cloudflare Pages 等也都可以，設定 build command 為 `npm run build`、輸出目錄為 `dist`，並記得在託管平台設定同樣的 `VITE_FIREBASE_*` 環境變數。

部署後用手機瀏覽器打開網址，可以選擇「加入主畫面」把它加到手機桌面，使用起來就像一個 App。

## 技術棧

- React + TypeScript + Vite
- Firebase（Firestore + Anonymous Auth），未設定時自動退回 localStorage
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) + [pinyin-zhuyin](https://github.com/peterolson/pinyin-zhuyin) 做漢字轉注音
