import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

// ─── Storage helpers (localStorage for Vercel) ───────────────────────────────
const storage = {
  get: (key) => {
    try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  },
};

// ─── Default page content ───────────────────────────────────────────────────
const DEFAULT_PAGES = {
  quick: {
    title: "快速選單",
    emoji: "⚡",
    color: "#e8734a",
    items: [
      { id: "q1", icon: "📅", label: "休加&國定假日出勤申請", content: "", link: "" },
      { id: "q2", icon: "💰", label: "薪資異常反映", content: "", link: "" },
      { id: "q3", icon: "⭐", label: "正職人員津貼福利申請", content: "", link: "" },
      { id: "q4", icon: "🔍", label: "工時班表查詢", content: "", link: "" },
      { id: "q5", icon: "🥗", label: "素食申請", content: "", link: "" },
      { id: "q6", icon: "📢", label: "其他單位公告", content: "", link: "" },
    ],
  },
  attendance: {
    title: "出勤與請假",
    emoji: "📆",
    color: "#d4824a",
    items: [
      { id: "a1", icon: "🗓️", label: "國定假日出勤&休加申請", content: "", link: "" },
      { id: "a2", icon: "⏰", label: "班表工時查詢", content: "", link: "" },
      { id: "a3", icon: "🚗", label: "共乘申請", content: "", link: "" },
      { id: "a4", icon: "📋", label: "離職流程", content: "", link: "" },
      { id: "a5", icon: "🕐", label: "打卡資訊", content: "", link: "" },
      { id: "a6", icon: "🏥", label: "HR服務時間", content: "", link: "" },
      { id: "a7", icon: "📝", label: "請假辦法", content: "", link: "" },
      { id: "a8", icon: "✏️", label: "補登辦法", content: "", link: "" },
    ],
  },
  salary: {
    title: "薪資福利",
    emoji: "💰",
    color: "#5ba05e",
    items: [
      { id: "s1", icon: "🏥", label: "團保理賠申請", content: "", link: "" },
      { id: "s2", icon: "🎁", label: "正職人員津貼福利申請", content: "", link: "" },
      { id: "s3", icon: "🔍", label: "薪資異常反映", content: "", link: "" },
      { id: "s4", icon: "👨‍👩‍👧", label: "健保(眷屬)或勞退自提異動", content: "", link: "" },
      { id: "s5", icon: "🏦", label: "薪轉帳戶變更", content: "", link: "" },
    ],
  },
  transport: {
    title: "交通與環境",
    emoji: "🚌",
    color: "#5b8dc0",
    items: [
      { id: "t1", icon: "🚌", label: "交通車資訊", content: "", link: "" },
      { id: "t2", icon: "🅿️", label: "停車場", content: "", link: "" },
      { id: "t3", icon: "🗄️", label: "置物櫃", content: "", link: "" },
      { id: "t4", icon: "🍽️", label: "用餐休息區", content: "", link: "" },
      { id: "t5", icon: "📶", label: "Wi-fi資訊", content: "", link: "" },
      { id: "t6", icon: "🥘", label: "團膳", content: "", link: "" },
      { id: "t7", icon: "🧥", label: "雨衣間", content: "", link: "" },
      { id: "t8", icon: "🚬", label: "吸菸亭", content: "", link: "" },
    ],
  },
  faq: {
    title: "常見問答",
    emoji: "❓",
    color: "#9b7ec8",
    items: [
      { id: "f1", icon: "❓", label: "常見問題 1", content: "請在後台編輯此問題與解答", link: "" },
    ],
  },
  relations: {
    title: "員工關係與溝通",
    emoji: "💬",
    color: "#e07a5f",
    items: [
      { id: "r1", icon: "🛡️", label: "職場不法侵害通報", content: "", link: "" },
      { id: "r2", icon: "📩", label: "匿名&具名檢舉", content: "", link: "" },
      { id: "r3", icon: "📣", label: "VOR資訊", content: "", link: "" },
      { id: "r4", icon: "💬", label: "員工溝通", content: "", link: "" },
      { id: "r5", icon: "🙋", label: "聽你說", content: "", link: "" },
    ],
  },
  talent: {
    title: "人才推薦",
    emoji: "⭐",
    color: "#f0a500",
    items: [
      { id: "tl1", icon: "🤝", label: "內部人才推薦", content: "", link: "" },
      { id: "tl2", icon: "📄", label: "最新內部職缺", content: "", link: "" },
    ],
  },
  others: {
    title: "其他",
    emoji: "⚙️",
    color: "#7a9e7e",
    items: [
      { id: "o1", icon: "🏗️", label: "PS&堆高機辦法", content: "", link: "" },
      { id: "o2", icon: "📜", label: "在/離職證明", content: "", link: "" },
      { id: "o3", icon: "📞", label: "HR照會電話", content: "", link: "" },
      { id: "o4", icon: "🔀", label: "轉調申請", content: "", link: "" },
      { id: "o5", icon: "🪪", label: "員工資料異動", content: "", link: "" },
      { id: "o6", icon: "🩺", label: "體檢相關問題", content: "", link: "" },
      { id: "o7", icon: "⚠️", label: "職災相關", content: "", link: "" },
      { id: "o8", icon: "🎁", label: "神秘驚喜", content: "", link: "" },
    ],
  },
};

const ADMIN_CODE = "CP240819";

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Fredoka+One&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans TC', sans-serif;
    background: #fdf6ec;
    min-height: 100vh;
    color: #3d2c1e;
  }

  :root {
    --cream: #fdf6ec;
    --warm-tan: #f5e6cc;
    --orange: #e8734a;
    --red-orange: #d4603a;
    --green: #5ba05e;
    --blue: #5b8dc0;
    --purple: #9b7ec8;
    --gold: #f0a500;
    --brown: #7a5c3e;
    --text: #3d2c1e;
    --text-light: #7a6a5a;
    --shadow: rgba(120, 80, 40, 0.15);
    --border: rgba(120, 80, 40, 0.12);
  }

  /* Login Screen */
  .login-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #fdf0d8 0%, #fce8c8 50%, #f5ddb8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .login-bg::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,115,74,0.1) 0%, transparent 70%);
    top: -200px; right: -200px;
  }
  .login-bg::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(91,160,94,0.1) 0%, transparent 70%);
    bottom: -100px; left: -100px;
  }
  .login-card {
    background: white;
    border-radius: 24px;
    padding: 48px 40px;
    width: 420px;
    box-shadow: 0 20px 60px rgba(120,80,40,0.18), 0 4px 12px rgba(120,80,40,0.08);
    position: relative;
    z-index: 1;
    animation: slideUp 0.5s ease;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .login-logo {
    text-align: center;
    margin-bottom: 32px;
  }
  .login-rocket {
    font-size: 56px;
    display: block;
    margin-bottom: 8px;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .login-title {
    font-family: 'Fredoka One', cursive;
    font-size: 28px;
    color: var(--orange);
    letter-spacing: 1px;
  }
  .login-subtitle {
    font-size: 14px;
    color: var(--text-light);
    margin-top: 4px;
  }
  .login-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: var(--brown);
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .login-input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid var(--border);
    border-radius: 12px;
    font-size: 16px;
    font-family: 'Noto Sans TC', sans-serif;
    background: var(--cream);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .login-input:focus {
    border-color: var(--orange);
    box-shadow: 0 0 0 3px rgba(232,115,74,0.15);
  }
  .login-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, var(--orange), var(--red-orange));
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    font-family: 'Noto Sans TC', sans-serif;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    margin-top: 24px;
    letter-spacing: 1px;
  }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,115,74,0.35); }
  .login-btn:active { transform: translateY(0); }
  .login-error {
    background: #fee2e2;
    color: #c0392b;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-top: 12px;
    text-align: center;
  }

  /* Main Layout */
  .app-header {
    background: white;
    border-bottom: 2px solid var(--border);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px var(--shadow);
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }
  .header-logo {
    font-family: 'Fredoka One', cursive;
    font-size: 22px;
    color: var(--orange);
  }
  .header-subtitle {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 500;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-emp {
    font-size: 13px;
    color: var(--text-light);
    background: var(--warm-tan);
    padding: 6px 12px;
    border-radius: 20px;
  }
  .header-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .btn-admin { background: var(--purple); color: white; }
  .btn-logout { background: var(--warm-tan); color: var(--brown); }
  .btn-admin:hover { background: #8a6db8; }
  .btn-logout:hover { background: #ecd8b8; }

  /* Home Page */
  .home-hero {
    background: linear-gradient(135deg, #fdf0d8, #fce8c8);
    padding: 40px 24px 32px;
    text-align: center;
    border-bottom: 2px solid var(--border);
  }
  .home-hero h1 {
    font-family: 'Fredoka One', cursive;
    font-size: 32px;
    color: var(--orange);
    margin-bottom: 6px;
  }
  .home-hero p {
    font-size: 15px;
    color: var(--text-light);
  }
  .home-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 32px 24px;
    max-width: 1000px;
    margin: 0 auto;
  }
  @media (max-width: 768px) {
    .home-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .home-card {
    background: white;
    border-radius: 20px;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    border: 2px solid var(--border);
    transition: all 0.25s;
    box-shadow: 0 4px 12px var(--shadow);
    position: relative;
    overflow: hidden;
  }
  .home-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    border-radius: 20px 20px 0 0;
  }
  .home-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(120,80,40,0.2);
    border-color: currentColor;
  }
  .home-card-emoji { font-size: 36px; display: block; margin-bottom: 10px; }
  .home-card-title { font-size: 15px; font-weight: 700; color: var(--text); }

  /* Sub Page */
  .subpage {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  .subpage-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--warm-tan);
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--brown);
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .back-btn:hover { background: #ecd8b8; }
  .subpage-title {
    font-family: 'Fredoka One', cursive;
    font-size: 26px;
    color: var(--orange);
  }
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .item-card {
    background: white;
    border-radius: 16px;
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    border: 2px solid var(--border);
    transition: all 0.2s;
    box-shadow: 0 3px 10px var(--shadow);
  }
  .item-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(120,80,40,0.18);
  }
  .item-icon { font-size: 30px; display: block; margin-bottom: 8px; }
  .item-label { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.4; }

  /* Detail Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(60,40,20,0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-box {
    background: white;
    border-radius: 24px;
    width: 100%;
    max-width: 560px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 30px 80px rgba(60,40,20,0.3);
    animation: scaleIn 0.25s ease;
  }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-title { font-size: 18px; font-weight: 700; color: var(--text); }
  .modal-close {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: none;
    background: var(--warm-tan);
    color: var(--brown);
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .modal-close:hover { background: #ecd8b8; }
  .modal-body { padding: 24px; }
  .modal-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .modal-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    padding: 10px 20px;
    background: var(--orange);
    color: white;
    border-radius: 20px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
  }
  .modal-link:hover { background: var(--red-orange); transform: translateY(-1px); }
  .modal-img {
    max-width: 100%;
    border-radius: 12px;
    margin-top: 16px;
    box-shadow: 0 4px 12px var(--shadow);
  }
  .modal-empty {
    text-align: center;
    color: var(--text-light);
    font-size: 15px;
    padding: 20px 0;
  }

  /* Admin Panel */
  .admin-panel {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  .admin-title {
    font-family: 'Fredoka One', cursive;
    font-size: 28px;
    color: var(--purple);
    margin-bottom: 6px;
  }
  .admin-tabs {
    display: flex;
    gap: 8px;
    margin: 24px 0 28px;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0;
  }
  .admin-tab {
    padding: 10px 20px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-light);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .admin-tab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .admin-tab:hover:not(.active) { color: var(--text); }

  /* Page Editor */
  .section-select {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 28px;
  }
  .section-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: 2px solid var(--border);
    background: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
    color: var(--text);
  }
  .section-btn.active { background: var(--orange); color: white; border-color: var(--orange); }
  .section-btn:hover:not(.active) { background: var(--warm-tan); border-color: var(--orange); }

  .items-editor {
    display: grid;
    gap: 12px;
  }
  .item-editor-card {
    background: white;
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px var(--shadow);
  }
  .item-editor-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    justify-content: space-between;
  }
  .item-editor-label {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    flex: 1;
  }
  .admin-input, .admin-textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Noto Sans TC', sans-serif;
    background: var(--cream);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 8px;
  }
  .admin-input:focus, .admin-textarea:focus { border-color: var(--orange); }
  .admin-textarea { resize: vertical; min-height: 80px; }
  .admin-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .field-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--brown);
    margin-bottom: 4px;
    display: block;
    letter-spacing: 0.3px;
  }
  .save-btn {
    padding: 10px 24px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .save-btn:hover { background: #4a8f4e; transform: translateY(-1px); }
  .delete-btn {
    padding: 8px 14px;
    background: #fee2e2;
    color: #c0392b;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .delete-btn:hover { background: #fecaca; }
  .add-item-btn {
    padding: 12px;
    width: 100%;
    background: var(--warm-tan);
    color: var(--brown);
    border: 2px dashed var(--border);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
    margin-top: 8px;
  }
  .add-item-btn:hover { background: #ecd8b8; border-color: var(--orange); }

  /* Employee Manager */
  .emp-manager {
    background: white;
    border-radius: 16px;
    border: 2px solid var(--border);
    overflow: hidden;
    box-shadow: 0 4px 16px var(--shadow);
  }
  .emp-toolbar {
    padding: 16px 20px;
    background: var(--warm-tan);
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .emp-input-row {
    display: flex;
    gap: 8px;
    flex: 1;
    min-width: 260px;
  }
  .emp-input {
    flex: 1;
    padding: 9px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Noto Sans TC', sans-serif;
    background: white;
    outline: none;
  }
  .emp-input:focus { border-color: var(--orange); }
  .primary-btn {
    padding: 9px 18px;
    background: var(--orange);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .primary-btn:hover { background: var(--red-orange); }
  .excel-btn {
    padding: 9px 18px;
    background: var(--green);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .excel-btn:hover { background: #4a8f4e; }
  .emp-table { width: 100%; border-collapse: collapse; }
  .emp-table th {
    background: var(--cream);
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: var(--brown);
    border-bottom: 1px solid var(--border);
  }
  .emp-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text);
    border-bottom: 1px solid var(--border);
  }
  .emp-table tr:last-child td { border-bottom: none; }
  .emp-table tr:hover td { background: var(--cream); }
  .emp-count {
    padding: 12px 20px;
    font-size: 13px;
    color: var(--text-light);
    background: var(--cream);
    border-top: 1px solid var(--border);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .badge-admin { background: #ede9fe; color: #7c3aed; }
  .badge-emp { background: #dcfce7; color: #16a34a; }

  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text);
    color: white;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    animation: toastIn 0.3s ease;
    white-space: nowrap;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .image-upload-btn {
    padding: 8px 14px;
    background: var(--blue);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.2s;
  }
  .image-upload-btn:hover { background: #4a7db0; }
  .img-preview {
    max-width: 120px;
    max-height: 80px;
    border-radius: 6px;
    margin-top: 6px;
    object-fit: cover;
  }
  .emp-search {
    padding: 9px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Noto Sans TC', sans-serif;
    background: white;
    outline: none;
    min-width: 180px;
  }
  .emp-search:focus { border-color: var(--orange); }
  .no-content {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-light);
    font-size: 15px;
  }
`;

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? <div className="toast">{msg}</div> : null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [empId, setEmpId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState("home"); // home | section key | admin
  const [activeSection, setActiveSection] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [employees, setEmployees] = useState([{ id: ADMIN_CODE, name: "管理員", role: "admin" }]);
  const [toast, setToast] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [adminTab, setAdminTab] = useState("pages");
  const [editSection, setEditSection] = useState("quick");
  const [empSearch, setEmpSearch] = useState("");
  const [newEmpId, setNewEmpId] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const fileInputRef = useRef(null);
  const imgRefs = useRef({});

  // Load from storage
  useEffect(() => {
    setDataLoading(true);
    try {
      const pd = storage.get("tao4_pages");
      if (pd) setPages(JSON.parse(pd.value));
    } catch {}
    try {
      const ed = storage.get("tao4_employees");
      if (ed) setEmployees(JSON.parse(ed.value));
    } catch {}
    setDataLoading(false);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const savePages = (newPages) => {
    setPages(newPages);
    try { storage.set("tao4_pages", JSON.stringify(newPages)); } catch {}
  };

  const saveEmployees = (newEmps) => {
    setEmployees(newEmps);
    try { storage.set("tao4_employees", JSON.stringify(newEmps)); } catch {}
  };

  const handleLogin = () => {
    if (!loginInput.trim()) { setLoginError("請輸入員工編號"); return; }
    if (loginInput.trim() === ADMIN_CODE) {
      setEmpId(ADMIN_CODE);
      setLoggedIn(true);
      setIsAdmin(true);
      setLoginError("");
      return;
    }
    const found = employees.find(e => e.id === loginInput.trim());
    if (found) {
      setEmpId(found.id);
      setLoggedIn(true);
      setIsAdmin(false);
      setLoginError("");
    } else {
      setLoginError("員工編號不存在，請確認後再試");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setIsAdmin(false);
    setEmpId("");
    setLoginInput("");
    setView("home");
    setSelectedItem(null);
  };

  const updateItem = (sectionKey, itemId, field, value) => {
    const newPages = { ...pages };
    newPages[sectionKey] = { ...newPages[sectionKey] };
    newPages[sectionKey].items = newPages[sectionKey].items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    savePages(newPages);
  };

  const deleteItem = (sectionKey, itemId) => {
    const newPages = { ...pages };
    newPages[sectionKey].items = newPages[sectionKey].items.filter(i => i.id !== itemId);
    savePages(newPages);
    showToast("已刪除");
  };

  const addItem = (sectionKey) => {
    const newId = `${sectionKey}_${Date.now()}`;
    const newPages = { ...pages };
    newPages[sectionKey].items = [...newPages[sectionKey].items, { id: newId, icon: "📌", label: "新項目", content: "", link: "" }];
    savePages(newPages);
    showToast("已新增項目");
  };

  const handleImageUpload = (sectionKey, itemId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateItem(sectionKey, itemId, "image", e.target.result);
      showToast("圖片已上傳");
    };
    reader.readAsDataURL(file);
  };

  const addEmployee = () => {
    if (!newEmpId.trim()) { showToast("請輸入員工編號"); return; }
    if (employees.find(e => e.id === newEmpId.trim())) { showToast("員工編號已存在"); return; }
    const updated = [...employees, { id: newEmpId.trim(), name: newEmpName.trim() || "員工", role: "employee" }];
    saveEmployees(updated);
    setNewEmpId(""); setNewEmpName("");
    showToast("員工已新增");
  };

  const deleteEmployee = (id) => {
    if (id === ADMIN_CODE) { showToast("無法刪除管理員"); return; }
    saveEmployees(employees.filter(e => e.id !== id));
    showToast("已刪除");
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        let added = 0;
        const updated = [...employees];
        data.forEach((row) => {
          if (!row[0]) return;
          const id = String(row[0]).trim();
          const name = row[1] ? String(row[1]).trim() : "員工";
          if (!id || id === "員工編號" || id === "employee_id") return;
          if (!updated.find(e => e.id === id)) {
            updated.push({ id, name, role: "employee" });
            added++;
          }
        });
        saveEmployees(updated);
        showToast(`匯入完成，新增 ${added} 名員工`);
      } catch {
        showToast("Excel 格式錯誤，請確認格式");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filteredEmps = employees.filter(e =>
    e.id.toLowerCase().includes(empSearch.toLowerCase()) ||
    (e.name || "").toLowerCase().includes(empSearch.toLowerCase())
  );

  const HOME_MENU = [
    { key: "quick", emoji: "⚡", title: "快速選單", color: "#e8734a" },
    { key: "attendance", emoji: "📆", title: "出勤與請假", color: "#d4824a" },
    { key: "salary", emoji: "💰", title: "薪資福利", color: "#5ba05e" },
    { key: "transport", emoji: "🚌", title: "交通與環境", color: "#5b8dc0" },
    { key: "faq", emoji: "❓", title: "常見問答", color: "#9b7ec8" },
    { key: "relations", emoji: "💬", title: "員工關係與溝通", color: "#e07a5f" },
    { key: "talent", emoji: "⭐", title: "人才推薦", color: "#f0a500" },
    { key: "others", emoji: "⚙️", title: "其他", color: "#7a9e7e" },
  ];

  if (!loggedIn) {
    return (
      <>
        <style>{styles}</style>
        <div className="login-bg">
          <div className="login-card">
            <div className="login-logo">
              <span className="login-rocket">🚀</span>
              <div className="login-title">coupang TAO4</div>
              <div className="login-subtitle">員工服務入口網站</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="login-label">員工編號</label>
              <input
                className="login-input"
                placeholder="請輸入員工編號"
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button className="login-btn" onClick={handleLogin}>登入 →</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        {dataLoading && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(253,246,236,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "float 1.5s ease-in-out infinite" }}>🚀</div>
            <div style={{ fontSize: 16, color: "var(--text-light)", fontWeight: 600 }}>載入共享資料中...</div>
          </div>
        )}
        {/* Header */}
        <header className="app-header">
          <div className="header-left" onClick={() => setView("home")}>
            <span style={{ fontSize: 28 }}>🚀</span>
            <div>
              <div className="header-logo">coupang TAO4</div>
              <div className="header-subtitle">員工服務入口</div>
            </div>
          </div>
          <div className="header-right">
            <span className="header-emp">👤 {empId}</span>
            {isAdmin && (
              <button className="header-btn btn-admin" onClick={() => setView("admin")}>
                ⚙️ 後台管理
              </button>
            )}
            <button className="header-btn btn-logout" onClick={handleLogout}>登出</button>
          </div>
        </header>

        {/* Home */}
        {view === "home" && (
          <>
            <div className="home-hero">
              <h1>🚀 員工服務中心</h1>
              <p>歡迎來到 Coupang TAO4 倉 — 選擇您需要的服務</p>
            </div>
            <div className="home-grid">
              {HOME_MENU.map(m => (
                <div key={m.key} className="home-card"
                  style={{ "--card-color": m.color }}
                  onClick={() => setView(m.key)}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: m.color, borderRadius: "18px 18px 0 0" }} />
                  <span className="home-card-emoji">{m.emoji}</span>
                  <div className="home-card-title" style={{ color: m.color }}>{m.title}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sub Pages */}
        {view !== "home" && view !== "admin" && pages[view] && (
          <div className="subpage">
            <div className="subpage-header">
              <button className="back-btn" onClick={() => setView("home")}>← 返回主頁</button>
              <h2 className="subpage-title">
                {HOME_MENU.find(m => m.key === view)?.emoji} {pages[view].title}
              </h2>
            </div>
            {pages[view].items.length === 0 ? (
              <div className="no-content">此分類尚無項目</div>
            ) : (
              <div className="items-grid">
                {pages[view].items.map(item => (
                  <div key={item.id} className="item-card"
                    style={{ borderTopColor: pages[view].color, borderTopWidth: 3 }}
                    onClick={() => setSelectedItem({ ...item, sectionColor: pages[view].color })}>
                    <span className="item-icon">{item.icon}</span>
                    <div className="item-label">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {view === "admin" && isAdmin && (
          <div className="admin-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <button className="back-btn" onClick={() => setView("home")}>← 返回主頁</button>
              <h2 className="admin-title">⚙️ 後台管理</h2>
            </div>
            <div className="admin-tabs">
              <button className={`admin-tab ${adminTab === "pages" ? "active" : ""}`} onClick={() => setAdminTab("pages")}>📄 頁面編輯</button>
              <button className={`admin-tab ${adminTab === "employees" ? "active" : ""}`} onClick={() => setAdminTab("employees")}>👥 員工管理</button>
            </div>

            {adminTab === "pages" && (
              <>
                <div className="section-select">
                  {HOME_MENU.map(m => (
                    <button key={m.key} className={`section-btn ${editSection === m.key ? "active" : ""}`}
                      onClick={() => setEditSection(m.key)}>
                      {m.emoji} {m.title}
                    </button>
                  ))}
                </div>
                <div className="items-editor">
                  {pages[editSection]?.items.map(item => (
                    <div key={item.id} className="item-editor-card">
                      <div className="item-editor-header">
                        <span style={{ fontSize: 22 }}>{item.icon}</span>
                        <div className="item-editor-label">{item.label}</div>
                        <button className="delete-btn" onClick={() => deleteItem(editSection, item.id)}>刪除</button>
                      </div>
                      <div className="admin-row">
                        <div>
                          <span className="field-label">圖示 Emoji</span>
                          <input className="admin-input" value={item.icon}
                            onChange={e => updateItem(editSection, item.id, "icon", e.target.value)} placeholder="📌" />
                        </div>
                        <div>
                          <span className="field-label">標題名稱</span>
                          <input className="admin-input" value={item.label}
                            onChange={e => updateItem(editSection, item.id, "label", e.target.value)} placeholder="項目標題" />
                        </div>
                      </div>
                      <span className="field-label">說明內容</span>
                      <textarea className="admin-textarea" value={item.content || ""}
                        onChange={e => updateItem(editSection, item.id, "content", e.target.value)}
                        placeholder="輸入說明文字..." />
                      <span className="field-label">連結 URL</span>
                      <input className="admin-input" value={item.link || ""}
                        onChange={e => updateItem(editSection, item.id, "link", e.target.value)}
                        placeholder="https://..." />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                        <button className="image-upload-btn"
                          onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e) => handleImageUpload(editSection, item.id, e.target.files[0]); inp.click(); }}>
                          📷 上傳圖片
                        </button>
                        {item.image && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ 已有圖片</span>}
                        {item.image && <button className="delete-btn" onClick={() => updateItem(editSection, item.id, "image", "")}>移除圖片</button>}
                      </div>
                      {item.image && <img src={item.image} className="img-preview" alt="" />}
                    </div>
                  ))}
                  <button className="add-item-btn" onClick={() => addItem(editSection)}>＋ 新增項目</button>
                </div>
              </>
            )}

            {adminTab === "employees" && (
              <>
                <div className="emp-manager">
                  <div className="emp-toolbar">
                    <div className="emp-input-row">
                      <input className="emp-input" value={newEmpId} onChange={e => setNewEmpId(e.target.value)}
                        placeholder="員工編號" onKeyDown={e => e.key === "Enter" && addEmployee()} />
                      <input className="emp-input" value={newEmpName} onChange={e => setNewEmpName(e.target.value)}
                        placeholder="姓名 (選填)" onKeyDown={e => e.key === "Enter" && addEmployee()} />
                      <button className="primary-btn" onClick={addEmployee}>新增</button>
                    </div>
                    <button className="excel-btn" onClick={() => fileInputRef.current?.click()}>📊 匯入 Excel</button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleExcelImport} />
                    <input className="emp-search" value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="🔍 搜尋員工..." />
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="emp-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>員工編號</th>
                          <th>姓名</th>
                          <th>身份</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmps.map((emp, i) => (
                          <tr key={emp.id}>
                            <td style={{ color: "var(--text-light)", fontSize: 13 }}>{i + 1}</td>
                            <td><strong>{emp.id}</strong></td>
                            <td>{emp.name || "—"}</td>
                            <td>
                              <span className={`badge ${emp.role === "admin" ? "badge-admin" : "badge-emp"}`}>
                                {emp.role === "admin" ? "管理員" : "員工"}
                              </span>
                            </td>
                            <td>
                              {emp.id !== ADMIN_CODE && (
                                <button className="delete-btn" onClick={() => deleteEmployee(emp.id)}>刪除</button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredEmps.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--text-light)" }}>查無結果</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="emp-count">共 {employees.length} 名成員　（Excel 格式：A欄員工編號、B欄姓名）</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderTopColor: selectedItem.sectionColor, borderTopWidth: 4, borderTopStyle: "solid", borderRadius: "24px 24px 0 0" }}>
                <div className="modal-title">{selectedItem.icon} {selectedItem.label}</div>
                <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
              </div>
              <div className="modal-body">
                {selectedItem.image && <img src={selectedItem.image} className="modal-img" alt={selectedItem.label} />}
                {selectedItem.content ? (
                  <div className="modal-content">{selectedItem.content}</div>
                ) : (
                  <div className="modal-empty">此項目尚無說明內容{isAdmin ? "，請至後台編輯" : ""}</div>
                )}
                {selectedItem.link && (
                  <a className="modal-link" href={selectedItem.link} target="_blank" rel="noreferrer">
                    🔗 前往連結
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <Toast msg={toast} />
      </div>
    </>
  );
}
