# TRYFIT 網頁原始檔案

匯出日期：2026-09-07
對應網站版本：30
來源版本：e6726ef3546d9fee52418cae4a57ac35c32837fc

## 使用方式

這是純 HTML、CSS、JavaScript 靜態網站，不需要 npm 安裝或編譯。
解壓縮後可直接開啟 index.html。若要以本機伺服器預覽，在此資料夾執行：

    python -m http.server 8000

然後在瀏覽器開啟 http://localhost:8000 。
部署時上傳 index.html、全部 CSS / JS 及 assets 資料夾，並保持相對路徑。
originals 是原圖與歷史照片備份，不必部署。

## 主要檔案

- index.html：頁面內容、照片引用、外部連結與原始基礎樣式。
- responsive.css：RWD、共用互動、教練卡片、手機 hero、footer。
- interactions.js：教練輪播、漢堡選單與回到頂端。
- mobile-decks.css / mobile-decks.js：手機版 PROGRAMS 與 MEMBER STORIES 輪播。
- programs-desktop.css / programs-desktop.js：電腦版 PROGRAMS 裁圖與文字展開。
- story-depth.js：MEMBER STORIES 文字立體傾斜互動。
- waves.js：電腦版海浪 WebGL shader；波紋透明度 0.02～0.05。
- assets/：網站使用圖片及既有素材。
- originals/coaches/：花花教練目前原圖與 previous 歷史備份。

## 最新內容

手機課程卡片完整顯示四組共 22 項課程介紹。
花花教練使用黑色運動服照片，附 480 × 600、800 × 1000 WebP 與 JPG 備援。
Footer 含 Google Maps SVG、hover 效果、另開分頁與完整地址。
地圖連結：https://maps.app.goo.gl/RLN4tLVMBvfuyPiJ8
地址：433臺中市沙鹿區犁分里中山路655-2號1樓

此檔案包保留目前網站程式與素材，未包含 Git 歷史、帳號憑證或託管識別設定。
