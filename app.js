/*
 * 外出記錄：在手機上先記，回家匯出 JSON，再到健身養寵的「📥 匯入紀錄」上傳。
 *
 * 全部存在這支手機的瀏覽器（localStorage），不連任何伺服器，所以電腦不用開著。
 * 每筆紀錄有自己的 uid，健身養寵靠它判斷「這筆匯入過了」，同一份檔案傳兩次只會記一次。
 */
(() => {
  'use strict';

  const D = window.FIT_DATA;
  const RECORDS_KEY = 'fit-record.records.v1';
  const MEMORY_KEY = 'fit-record.memory.v1';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const today = () => new Date().toLocaleDateString('sv-SE');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

  /* ---------------- 儲存 ---------------- */

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch {
      toast('存不進手機，可能是無痕模式或空間不足。請先匯出備份。', true);
      return false;
    }
  }

  let records = load(RECORDS_KEY, []);
  // 記過的食物與帳目：清除紀錄後還留著，下次輸入同名稱直接帶入數字
  const memory = load(MEMORY_KEY, { meals: {}, expenses: {} });
  const persist = () => save(RECORDS_KEY, records);

  /* ---------------- 提示 ---------------- */

  let toastTimer;
  function toast(text, error = false) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.toggle('error', error);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, error ? 6000 : 2500);
  }

  /* ---------------- 分頁 ---------------- */

  const panels = {
    meal: $('#form-meal'), workout: $('#form-workout'), weight: $('#form-weight'),
    expense: $('#form-expense'), list: $('#panel-list'),
  };
  function showTab(tab) {
    for (const btn of $$('.tabs button')) btn.setAttribute('aria-selected', String(btn.dataset.tab === tab));
    for (const [k, el] of Object.entries(panels)) el.hidden = k !== tab;
    if (tab === 'list') renderList();
    try { sessionStorage.setItem('fit-record.tab', tab); } catch { /* 只是記住分頁 */ }
    window.scrollTo({ top: 0 });
  }
  for (const btn of $$('.tabs button')) btn.addEventListener('click', () => showTab(btn.dataset.tab));

  /* ---------------- 共用表單行為 ---------------- */

  const num = v => (v === '' || v == null ? null : Number(v));
  const editing = { meal: null, workout: null, weight: null, expense: null };

  function setEditing(form, id) {
    editing[form.dataset.type] = id;
    $('.edit-flag', form).hidden = !id;
    $('.cancel-edit', form).hidden = !id;
    $('button[type=submit]', form).textContent = id ? '更新' : '儲存';
  }

  function resetForm(form) {
    const keepDate = form.elements.date.value;
    form.reset();
    form.elements.date.value = keepDate || today();
    setEditing(form, null);
    if (form.dataset.type === 'workout') resetWorkout();
    if (form.dataset.type === 'expense') setKind(kind);
  }

  for (const form of Object.values(panels).filter(el => el.tagName === 'FORM')) {
    form.elements.date.value = today();
    $('.cancel-edit', form).addEventListener('click', () => resetForm(form));
  }

  function upsert(type, data) {
    const now = new Date().toISOString();
    const id = editing[type];
    const cur = id && records.find(r => r.uid === id);
    if (cur) {
      // 已匯出過的紀錄改了內容，健身養寵會因為 uid 一樣而跳過。
      // 換一個新 uid，讓它當成新的一筆（若舊的已經匯入，要到 App 裡刪掉舊的）。
      if (cur.exportedAt) { cur.uid = uid(); cur.exportedAt = null; }
      cur.data = data;
      cur.updatedAt = now;
    } else {
      records.push({ uid: uid(), type, data, createdAt: now, updatedAt: now, exportedAt: null });
    }
    persist();
    updateCount();
    return Boolean(cur);
  }

  function confirmEditExported(rec) {
    return !rec.exportedAt || window.confirm('這筆已經匯出過。修改後會當成新的一筆重新匯出；如果舊的已經匯入健身養寵，記得到 App 裡把舊的刪掉。要繼續嗎？');
  }

  /* ---------------- 飲食 ---------------- */

  const mealForm = panels.meal;
  function refreshMealMemory() {
    $('#meal-memory').innerHTML = Object.keys(memory.meals).sort()
      .map(n => `<option value="${esc(n)}"></option>`).join('');
  }
  mealForm.elements.name.addEventListener('change', () => {
    const m = memory.meals[mealForm.elements.name.value.trim()];
    if (!m || editing.meal) return;
    for (const k of ['portion', 'kcal', 'protein_g', 'carb_g', 'fat_g']) {
      if (m[k] != null && m[k] !== '') mealForm.elements[k].value = m[k];
    }
  });
  mealForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = mealForm.elements;
    const data = {
      date: f.date.value, meal_type: f.meal_type.value, name: f.name.value.trim(),
      portion: f.portion.value.trim(), kcal: num(f.kcal.value) ?? 0, protein_g: num(f.protein_g.value) ?? 0,
      carb_g: num(f.carb_g.value) ?? 0, fat_g: num(f.fat_g.value) ?? 0, note: f.note.value.trim(),
    };
    if (!data.name) return toast('請填食物名稱', true);
    const updated = upsert('meal', data);
    memory.meals[data.name] = { portion: data.portion, kcal: data.kcal, protein_g: data.protein_g, carb_g: data.carb_g, fat_g: data.fat_g };
    save(MEMORY_KEY, memory);
    refreshMealMemory();
    toast(updated ? '已更新' : `已記下 ${data.name}`);
    resetForm(mealForm);
  });

  /* ---------------- 訓練 ---------------- */

  const workoutForm = panels.workout;
  const setsEl = $('#sets');
  let mode = 'reps';

  function refreshExerciseList() {
    const cat = workoutForm.elements.category.value;
    const names = [...(D.exercises[cat] || []), ...(cat === 'other' ? Object.values(D.exercises).flat() : [])];
    $('#exercise-list').innerHTML = [...new Set(names)].map(n => `<option value="${esc(n)}"></option>`).join('');
  }

  function setMode(next) {
    mode = next;
    for (const b of $$('[data-mode]', workoutForm)) b.classList.toggle('on', b.dataset.mode === mode);
    for (const row of $$('.set', setsEl)) {
      $('.r', row).hidden = mode !== 'reps';
      $('.t', row).hidden = mode !== 'time';
    }
  }
  for (const b of $$('[data-mode]', workoutForm)) b.addEventListener('click', () => setMode(b.dataset.mode));

  function addSet(values = {}) {
    const row = $('#set-row').content.firstElementChild.cloneNode(true);
    // 新的一組沿用上一組的數字：大部分人每組重量次數一樣，少按幾下
    const last = $$('.set', setsEl).at(-1);
    for (const input of $$('input', row)) {
      const k = input.dataset.k;
      input.value = values[k] ?? (last ? $(`[data-k=${k}]`, last).value : '');
    }
    $('.del', row).addEventListener('click', () => {
      if ($$('.set', setsEl).length > 1) row.remove(); else for (const i of $$('input', row)) i.value = '';
      numberSets();
    });
    setsEl.append(row);
    numberSets();
    setMode(mode);
  }
  const numberSets = () => $$('.set', setsEl).forEach((row, i) => { $('.set-no', row).textContent = `第 ${i + 1} 組`; });
  $('#add-set').addEventListener('click', () => addSet());

  function toggleCardio() {
    const cardio = workoutForm.elements.category.value === 'cardio';
    $('.strength-only', workoutForm).hidden = cardio;
    $('.cardio-only', workoutForm).hidden = !cardio;
    workoutForm.elements.minutes.required = cardio;
    refreshExerciseList();
  }
  workoutForm.elements.category.addEventListener('change', toggleCardio);
  workoutForm.elements.exercise.addEventListener('change', () => {
    const name = workoutForm.elements.exercise.value.trim();
    if (D.timed.includes(name)) setMode('time');
    // 從清單選了別的部位的動作時，部位跟著換
    const cat = Object.entries(D.exercises).find(([, list]) => list.includes(name))?.[0];
    if (cat && cat !== workoutForm.elements.category.value) {
      workoutForm.elements.category.value = cat;
      toggleCardio();
    }
  });

  function resetWorkout() {
    setsEl.innerHTML = '';
    mode = 'reps';
    addSet();
    toggleCardio();
  }

  workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = workoutForm.elements;
    const category = f.category.value;
    const rpe = num(f.rpe.value) ?? 0;
    const data = { date: f.date.value, exercise: f.exercise.value.trim(), category, rpe, note: f.note.value.trim() };
    if (!data.exercise) return toast('請填動作名稱', true);
    if (rpe < 0 || rpe > 10) return toast('RPE 要在 0–10 之間', true);

    if (category === 'cardio') {
      const minutes = num(f.minutes.value);
      if (!(minutes > 0 && minutes <= 1440)) return toast('請填有氧時間（分鐘）', true);
      data.set_details = [{ weight_kg: 0, reps: 0, duration_s: Math.round(minutes * 60), rpe }];
      const kcal = num(f.calories_kcal.value);
      if (kcal != null) data.calories_kcal = kcal;
    } else {
      const sets = [];
      for (const [i, row] of $$('.set', setsEl).entries()) {
        const weight = num($('[data-k=weight_kg]', row).value) ?? 0;
        const reps = mode === 'reps' ? num($('[data-k=reps]', row).value) : 0;
        const secs = mode === 'time' ? num($('[data-k=duration_s]', row).value) : 0;
        if (mode === 'reps' && !(Number.isInteger(reps) && reps > 0)) return toast(`第 ${i + 1} 組請填次數（整數）`, true);
        if (mode === 'time' && !(secs > 0)) return toast(`第 ${i + 1} 組請填秒數`, true);
        if (weight < 0 || weight > 1000) return toast(`第 ${i + 1} 組重量不合理`, true);
        sets.push({ weight_kg: weight, reps: reps || 0, duration_s: secs || 0, rpe });
      }
      if (!sets.length) return toast('至少要有一組', true);
      data.set_details = sets;
    }
    const updated = upsert('workout', data);
    toast(updated ? '已更新' : `已記下 ${data.exercise}`);
    resetForm(workoutForm);
  });

  /* ---------------- 體態 ---------------- */

  const weightForm = panels.weight;
  weightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = weightForm.elements;
    const data = {
      date: f.date.value, weight_kg: num(f.weight_kg.value), body_fat_pct: num(f.body_fat_pct.value),
      waist_cm: num(f.waist_cm.value), note: f.note.value.trim(),
    };
    if (!(data.weight_kg > 0)) return toast('請填體重', true);
    // 一天一筆：同一天已經有了就覆蓋那筆，不要匯出兩筆互相蓋掉
    const sameDay = records.find(r => r.type === 'weight' && r.data.date === data.date && r.uid !== editing.weight);
    if (sameDay && !editing.weight) {
      if (!window.confirm(`${data.date} 已經記過體態，要改成這次的數字嗎？`)) return;
      if (!confirmEditExported(sameDay)) return;
      editing.weight = sameDay.uid;
    }
    const updated = upsert('weight', data);
    toast(updated ? '已更新' : `已記下 ${data.weight_kg} kg`);
    resetForm(weightForm);
  });

  /* ---------------- 記帳 ---------------- */

  const expenseForm = panels.expense;
  // 不能寫 elements.item：那是 HTMLFormCollection 內建的方法，拿不到欄位
  const itemInput = expenseForm.elements.namedItem('item');
  let kind = 'expense';
  let category = 'food';

  function renderCategories() {
    $('#categories').innerHTML = D.categories.filter(c => c.kind === kind).map(c =>
      `<button type="button" role="radio" data-cat="${c.id}" aria-checked="${c.id === category}" class="${c.id === category ? 'on' : ''}">${c.icon} ${esc(c.name)}</button>`).join('');
  }
  $('#categories').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    category = b.dataset.cat;
    renderCategories();
  });
  function setKind(next, cat) {
    kind = next;
    category = cat || (kind === 'income' ? 'salary' : 'food');
    for (const b of $$('[data-kind]', expenseForm)) b.classList.toggle('on', b.dataset.kind === kind);
    renderCategories();
  }
  for (const b of $$('[data-kind]', expenseForm)) b.addEventListener('click', () => setKind(b.dataset.kind));

  function refreshExpenseMemory() {
    $('#expense-memory').innerHTML = Object.keys(memory.expenses).sort()
      .map(n => `<option value="${esc(n)}"></option>`).join('');
  }
  itemInput.addEventListener('change', () => {
    const m = memory.expenses[itemInput.value.trim()];
    if (!m || editing.expense) return;
    setKind(m.kind, m.category);
    expenseForm.elements.amount.value = m.amount;
    expenseForm.elements.pay.value = m.pay;
  });
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = expenseForm.elements;
    const data = {
      date: f.date.value, kind, category, item: itemInput.value.trim(),
      amount: num(f.amount.value), pay: f.pay.value, note: f.note.value.trim(),
    };
    if (!data.item) return toast('請填項目', true);
    if (!(data.amount > 0)) return toast('金額要大於 0', true);
    const updated = upsert('expense', data);
    memory.expenses[data.item] = { kind, category, amount: data.amount, pay: data.pay };
    save(MEMORY_KEY, memory);
    refreshExpenseMemory();
    toast(updated ? '已更新' : `已記下 ${data.item} $${data.amount}`);
    resetForm(expenseForm);
  });

  /* ---------------- 清單 ---------------- */

  const ICON = { meal: '🍚', workout: '🏋️', weight: '⚖️', expense: '💰' };

  function describe(r) {
    const d = r.data;
    if (r.type === 'meal') {
      const macro = [d.protein_g && `P${d.protein_g}`, d.carb_g && `C${d.carb_g}`, d.fat_g && `F${d.fat_g}`].filter(Boolean).join(' ');
      return [`${D.mealTypes[d.meal_type] || ''} ${d.name}${d.portion ? ` ${d.portion}` : ''}`, d.kcal ? `${d.kcal} kcal ${macro}` : '熱量未填'];
    }
    if (r.type === 'workout') {
      if (d.category === 'cardio') return [d.exercise, `有氧 ${Math.round(d.set_details[0].duration_s / 6) / 10} 分鐘${d.calories_kcal != null ? ` · ${d.calories_kcal} kcal` : ''}`];
      return [`${D.workoutCategories[d.category] || ''} · ${d.exercise}`,
        d.set_details.map(s => (s.duration_s ? `${s.duration_s}秒` : `${s.weight_kg}kg×${s.reps}`)).join('、')];
    }
    if (r.type === 'weight') {
      return [`體重 ${d.weight_kg} kg`, [d.body_fat_pct != null && `體脂 ${d.body_fat_pct}%`, d.waist_cm != null && `腰圍 ${d.waist_cm}cm`].filter(Boolean).join(' · ')];
    }
    const cat = D.categories.find(c => c.id === d.category);
    return [`${cat ? cat.icon : ''} ${d.item}`, `${d.kind === 'income' ? '+' : '-'}$${d.amount} · ${D.payMethods[d.pay] || ''}`];
  }

  function renderList() {
    const list = $('#list');
    if (!records.length) {
      list.innerHTML = '<p class="empty">還沒有紀錄。</p>';
      return;
    }
    const byDate = new Map();
    for (const r of [...records].sort((a, b) => (b.data.date.localeCompare(a.data.date)) || b.createdAt.localeCompare(a.createdAt))) {
      if (!byDate.has(r.data.date)) byDate.set(r.data.date, []);
      byDate.get(r.data.date).push(r);
    }
    list.innerHTML = [...byDate].map(([date, rows]) => `
      <section class="card day">
        <h3>${esc(date)}</h3>
        <ul>${rows.map((r) => {
          const [title, detail] = describe(r);
          return `<li data-uid="${esc(r.uid)}">
            <span class="ico">${ICON[r.type]}</span>
            <span class="txt"><b>${esc(title)}</b><small>${esc(detail)}</small></span>
            ${r.exportedAt ? '<span class="badge">已匯出</span>' : ''}
            <button type="button" data-act="edit">改</button>
            <button type="button" data-act="del" class="danger">刪</button>
          </li>`;
        }).join('')}</ul>
      </section>`).join('');
  }

  $('#list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const rec = records.find(r => r.uid === btn.closest('li').dataset.uid);
    if (!rec) return;
    if (btn.dataset.act === 'del') {
      const extra = rec.exportedAt ? '\n（已匯出過；如果已經匯入健身養寵，那邊不會跟著刪除）' : '';
      if (!window.confirm(`刪除「${describe(rec)[0].trim()}」？${extra}`)) return;
      records = records.filter(r => r !== rec);
      persist();
      updateCount();
      renderList();
      return;
    }
    if (!confirmEditExported(rec)) return;
    edit(rec);
  });

  function edit(rec) {
    const form = panels[rec.type];
    const f = form.elements;
    const d = rec.data;
    showTab(rec.type);
    resetForm(form);
    if (rec.type === 'workout') {
      f.category.value = d.category;
      toggleCardio();
      if (d.category === 'cardio') {
        f.minutes.value = d.set_details[0].duration_s / 60;
        f.calories_kcal.value = d.calories_kcal ?? '';
      } else {
        setsEl.innerHTML = '';
        mode = d.set_details.some(s => s.duration_s > 0) ? 'time' : 'reps';
        for (const s of d.set_details) addSet({ weight_kg: s.weight_kg || '', reps: s.reps || '', duration_s: s.duration_s || '' });
      }
    }
    if (rec.type === 'expense') setKind(d.kind, d.category);
    for (const [k, v] of Object.entries(d)) {
      if (k === 'category' || k === 'set_details') continue;   // 上面已經處理過
      const el = f.namedItem(k);
      if (el && 'value' in el) el.value = v ?? '';
    }
    if (rec.type === 'workout' && !d.rpe) f.rpe.value = '';
    setEditing(form, rec.uid);
  }

  /* ---------------- 匯出 ---------------- */

  function updateCount() {
    const pending = records.filter(r => !r.exportedAt).length;
    $('#pending-count').textContent = pending;
    $('#pending-count').hidden = !pending;
  }

  async function exportAll() {
    if (!records.length) return toast('沒有紀錄可以匯出', true);
    const payload = {
      app: 'fit-record',
      version: 1,
      exportedAt: new Date().toISOString(),
      records: records.map(({ uid: id, type, data, createdAt }) => ({ uid: id, type, data, createdAt })),
    };
    const stamp = new Date().toLocaleString('sv-SE').replace(/[-: ]/g, '').slice(0, 12);
    const name = `fit-record-${stamp}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });

    // 手機上優先用分享面板：iPhone 可以直接「儲存到檔案」或傳到電腦（AirDrop、LINE、雲端硬碟）
    let shared = false;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        shared = true;
      } catch (err) {
        if (err.name === 'AbortError') return;   // 使用者自己取消，不算匯出
      }
    }
    if (!shared) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    }
    const now = new Date().toISOString();
    for (const r of records) r.exportedAt ||= now;
    persist();
    updateCount();
    if (!panels.list.hidden) renderList();
    toast(`已匯出 ${records.length} 筆`);
  }
  $('#export-btn').addEventListener('click', exportAll);
  $('#export-btn-2').addEventListener('click', exportAll);

  $('#clear-exported').addEventListener('click', () => {
    const done = records.filter(r => r.exportedAt);
    if (!done.length) return toast('沒有已匯出的紀錄');
    if (!window.confirm(`清除 ${done.length} 筆已匯出的紀錄？\n請先確認已經匯入健身養寵。`)) return;
    records = records.filter(r => !r.exportedAt);
    persist();
    updateCount();
    renderList();
    toast(`已清除 ${done.length} 筆`);
  });

  /* ---------------- 啟動 ---------------- */

  async function storageNote() {
    const el = $('#storage-note');
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    let persisted = false;
    try { persisted = await navigator.storage?.persist?.(); } catch { /* 不支援就算了 */ }
    el.textContent = standalone || persisted
      ? '紀錄只存在這支手機的瀏覽器裡。換手機或清除瀏覽資料前請先匯出。'
      : '紀錄只存在這支手機的瀏覽器裡。建議「加到主畫面」再使用：iPhone Safari 對沒加到主畫面的網站，7 天沒開可能清掉資料。';
  }

  refreshMealMemory();
  refreshExpenseMemory();
  resetWorkout();
  setKind('expense');
  updateCount();
  storageNote();
  let initial = 'meal';
  try { initial = sessionStorage.getItem('fit-record.tab') || 'meal'; } catch { /* 用預設分頁 */ }
  showTab(panels[initial] ? initial : 'meal');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 沒有離線快取也能用，只是要有網路才開得起來 */ });
  }
})();
