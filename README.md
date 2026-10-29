# 外出記錄

健身養寵的離線記錄器。電腦不用一直開著：在外面用手機先記飲食、訓練、體態與記帳，回家匯出一個 `.json` 檔，再到健身養寵上傳。

- 純前端（HTML + JS，不用建置），放在 GitHub Pages 就能用
- 資料只存在手機瀏覽器（localStorage），不連任何伺服器
- 加到主畫面後可以離線開啟（service worker 快取）
- 每筆紀錄有自己的編號，重複上傳同一份檔案不會多記

## 部署到 GitHub Pages

```bash
cd D:\claude\record
git init -b main
git add .
git commit -m "外出記錄器"
git remote add origin https://github.com/Hung-NCKU/record.git
git push -u origin main
```

到 GitHub 的 repo → **Settings → Pages**：
Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾 `/ (root)`，按 Save。
約一分鐘後網址會是 `https://hung-ncku.github.io/record/`。

> 免費帳號的 GitHub Pages 需要 **public** repo。這個 repo 裡只有程式，
> 沒有任何紀錄（紀錄只在你的手機裡），公開沒有關係。

## 在手機上使用

1. 用手機開上面的網址，**加到主畫面**
   - iPhone Safari：分享 → 加入主畫面
   - Android Chrome：⋮ → 加到主畫面
   - 一定要加：iPhone 對沒加到主畫面的網站，7 天沒開可能清掉資料
2. 分頁切換飲食／訓練／體態／記帳，填完按「儲存」
3. 「清單」分頁可以查看、修改、刪除

小技巧：記過的食物或帳目，下次輸入同名稱會自動帶入熱量、營養素或金額。

## 回家匯入

1. 按右上角「匯出」→ 存成檔案（iPhone 可以「儲存到檔案」、AirDrop 或傳 LINE 給自己）
2. 在電腦開健身養寵 → 右上角「帳號與設定」→ **📥 匯入紀錄** → 選那個檔案
3. 畫面會先顯示幾筆新的、幾筆已經匯入過，確認後匯入
4. 確定匯入成功後，回手機「清單」按「清除已匯出的」

重複匯入同一份檔案、或忘記清除就再匯出一次，都不會多記。
有一筆失敗（例如格式錯誤）不影響其他筆，改好再匯出、再上傳即可。

## 注意

- **已匯出的紀錄修改後**會當成新的一筆。如果舊的已經匯入，要到健身養寵把舊的刪掉。
- **刪除**只刪手機上的，已匯入健身養寵的不會跟著刪。
- 沒有 AI 估算熱量：不知道就留空，回家後在飲食頁修改或請教練估算。
- 照片不會匯出。
- 體態一天一筆，匯入時跟電腦上同一天的紀錄合併（新的數字覆蓋，沒填的欄位保留原值）。
- 代幣獎勵只看「今天」：當天匯入當天的飲食與訓練會照常給；補登前幾天的不給，跟在 App 裡補登一樣。

## 修改後更新

改了任何檔案，把 `sw.js` 裡的 `VERSION` 加一再 push，手機下次連網開啟時會換成新版。

動作名稱與記帳分類是從健身養寵複製過來的（`data.js`）。那邊新增分類時這裡也要跟著加，
不然匯入時會被歸到「其他」。

## 檔案格式

```json
{
  "app": "fit-record",
  "version": 1,
  "exportedAt": "2026-10-29T12:00:00.000Z",
  "records": [
    { "uid": "…", "type": "meal",    "data": { "date": "2026-10-29", "meal_type": "lunch", "name": "雞腿便當", "kcal": 750, "protein_g": 35, "carb_g": 0, "fat_g": 0 } },
    { "uid": "…", "type": "workout", "data": { "date": "2026-10-29", "exercise": "槓鈴深蹲", "category": "legs", "set_details": [{ "weight_kg": 40, "reps": 8, "duration_s": 0 }] } },
    { "uid": "…", "type": "workout", "data": { "date": "2026-10-29", "exercise": "跑步", "category": "cardio", "set_details": [{ "duration_s": 1800 }] } },
    { "uid": "…", "type": "weight",  "data": { "date": "2026-10-29", "weight_kg": 41.2, "waist_cm": 64 } },
    { "uid": "…", "type": "expense", "data": { "date": "2026-10-29", "kind": "expense", "category": "drink", "item": "珍奶", "amount": 65, "pay": "mobile" } }
  ]
}
```

欄位跟健身養寵的 API 一樣；匯入端在 `fit/server/src/import.js`。
