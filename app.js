/* Income/Expense Tracker - Thai UI
 * Data is stored in localStorage under 'tx.v1'
 */
(() => {
  const LS_KEY = 'tx.v1';
  const TH_LOCALE = 'th-TH';
  const CURRENCY = 'THB';

  /** Categories */
  const CATS = {
    income: ['เงินเดือน', 'ฟรีแลนซ์', 'ดอกเบี้ย/ปันผล', 'ของขาย', 'อื่น ๆ รายรับ'],
    expense: ['อาหาร', 'เดินทาง', 'ที่พัก/บิล', 'สุขภาพ', 'บันเทิง', 'ช้อปปิ้ง', 'การศึกษา', 'อื่น ๆ รายจ่าย'],
  };

  /** Elements */
  const $ = (q, ctx=document) => ctx.querySelector(q);
  const $$ = (q, ctx=document) => [...ctx.querySelectorAll(q)];

  const el = {
    balance: $('#balance'),
    form: $('#txForm'),
    type: $('#type'),
    amount: $('#amount'),
    category: $('#category'),
    date: $('#date'),
    note: $('#note'),
    resetForm: $('#resetForm'),
    list: $('#txList'),
    empty: $('#emptyState'),
    month: $('#month'),
    filterCat: $('#filterCategory'),
    search: $('#search'),
    clearFilters: $('#clearFilters'),
    exportCSV: $('#exportCSV'),
    exportJSON: $('#exportJSON'),
    importFile: $('#importFile'),
    legend: $('#legend'),
  };

  /** State */
  let tx = load();
  let editId = null;
  let chart;

  init();

  function init() {
    // Seed selects
    fillCategories();
    fillFilterCategories();

    // Defaults
    el.date.valueAsDate = new Date();
    el.month.value = new Date().toISOString().slice(0,7);

    // Events
    el.form.addEventListener('submit', onSubmit);
    el.resetForm.addEventListener('click', clearForm);
    el.type.addEventListener('change', onTypeChange);
    el.month.addEventListener('change', render);
    el.filterCat.addEventListener('change', render);
    el.search.addEventListener('input', debounce(render, 200));
    el.clearFilters.addEventListener('click', clearFilters);
    el.exportCSV.addEventListener('click', exportCSV);
    el.exportJSON.addEventListener('click', exportJSON);
    el.importFile.addEventListener('change', importFile);
    el.list.addEventListener('click', onListClick);

    // First render
    render();
  }

  function onTypeChange() {
    const t = el.type.value;
    buildCategoryOptions(t, el.category);
  }

  function fillCategories() {
    buildCategoryOptions(el.type.value, el.category);
  }

  function buildCategoryOptions(type, selectEl) {
    selectEl.innerHTML = '';
    CATS[type].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      selectEl.appendChild(opt);
    });
  }

  function fillFilterCategories() {
    const all = new Set([...CATS.income, ...CATS.expense]);
    all.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      el.filterCat.appendChild(opt);
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    const type = el.type.value;
    const amount = parseFloat(el.amount.value || '0');
    const category = el.category.value;
    const date = el.date.value;
    const note = (el.note.value || '').trim();

    if (!amount || amount <= 0 || !date) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const item = {
      id: editId || crypto.randomUUID(),
      type, amount, category, date, note,
      createdAt: editId ? findById(editId).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      const idx = tx.findIndex(t => t.id === editId);
      tx[idx] = item;
      editId = null;
    } else {
      tx.push(item);
    }
    save();
    clearForm();
    render();
  }

  function onListClick(e) {
    const itemEl = e.target.closest('.tx-item');
    if (!itemEl) return;
    const id = itemEl.dataset.id;
    if (e.target.classList.contains('delete')) {
      if (confirm('ลบรายการนี้?')) {
        tx = tx.filter(t => t.id !== id);
        save(); render();
      }
    } else if (e.target.classList.contains('edit')) {
      const item = findById(id);
      editId = id;
      el.type.value = item.type;
      buildCategoryOptions(item.type, el.category);
      el.amount.value = item.amount;
      el.category.value = item.category;
      el.date.value = item.date;
      el.note.value = item.note;
      el.amount.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function clearForm() {
    editId = null;
    el.type.value = 'income';
    buildCategoryOptions('income', el.category);
    el.amount.value = '';
    el.category.selectedIndex = 0;
    el.date.valueAsDate = new Date();
    el.note.value = '';
  }

  function clearFilters() {
    el.month.value = new Date().toISOString().slice(0,7);
    el.filterCat.value = '';
    el.search.value = '';
    render();
  }

  function render() {
    // Filters
    const ym = el.month.value; // 'YYYY-MM'
    const cat = el.filterCat.value;
    const q = el.search.value.toLowerCase();

    const list = tx.filter(t => {
      const matchMonth = !ym || t.date.startsWith(ym);
      const matchCat = !cat || t.category === cat;
      const matchQ = !q || [t.note, t.category].join(' ').toLowerCase().includes(q);
      return matchMonth && matchCat && matchQ;
    }).sort((a,b) => (a.date < b.date ? 1 : -1) || (a.createdAt < b.createdAt ? 1 : -1));

    // Render list
    el.list.innerHTML = '';
    const tpl = $('#txItemTemplate');
    list.forEach(item => {
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.dataset.id = item.id;
      li.querySelector('.badge').dataset.type = item.type;
      li.querySelector('.badge').textContent = item.type === 'income' ? 'รับ' : 'จ่าย';
      li.querySelector('.note').textContent = item.note || '(ไม่มีบันทึก)';
      li.querySelector('.cat').textContent = 'หมวด: ' + item.category;
      li.querySelector('.date').textContent = formatDate(item.date);
      const sign = item.type === 'expense' ? '-' : '+';
      li.querySelector('.amount').textContent = sign + ' ' + formatMoney(item.amount);
      el.list.appendChild(li);
    });

    el.empty.style.display = list.length ? 'none' : 'block';

    // Balance & summary
    const totalIncome = sum(list.filter(i => i.type==='income').map(i => i.amount));
    const totalExpense = sum(list.filter(i => i.type==='expense').map(i => i.amount));
    const balance = totalIncome - totalExpense;
    el.balance.textContent = formatMoney(balance);

    // Chart for the selected month over all categories
    drawChart(ym);
    buildLegend();
  }

  function drawChart(ym) {
    const byDay = {}; // { 'YYYY-MM-DD': { income: n, expense: n } }
    tx.filter(t => t.date.startsWith(ym)).forEach(t => {
      byDay[t.date] ||= { income: 0, expense: 0 };
      byDay[t.date][t.type] += t.amount;
    });

    const days = Object.keys(byDay).sort();
    const income = days.map(d => byDay[d].income);
    const expense = days.map(d => byDay[d].expense);

    const data = {
      labels: days.map(d => d.slice(8,10)),
      datasets: [
        { label: 'รายรับ', data: income, tension: .3 },
        { label: 'รายจ่าย', data: expense, tension: .3 },
      ]
    };

    const ctx = $('#summaryChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, labels: { color: '#cbd5e1' } },
          tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + formatMoney(ctx.parsed.y || 0) } }
        },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148,163,184,.12)' } },
          y: { ticks: { color: '#9ca3af', callback: v => formatMoney(v) }, grid: { color: 'rgba(148,163,184,.12)' } }
        }
      }
    });
  }

  function buildLegend() {
    const incomeTotal = sum(tx.filter(i => i.type==='income').map(i => i.amount));
    const expenseTotal = sum(tx.filter(i => i.type==='expense').map(i => i.amount));
    el.legend.innerHTML = '';
    const make = (label, total) => {
      const wrap = document.createElement('span');
      wrap.className = 'chip';
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = label === 'รายรับ' ? '#22c55e' : '#f87171';
      const text = document.createElement('span');
      text.textContent = label + ': ' + formatMoney(total);
      wrap.append(dot, text);
      el.legend.appendChild(wrap);
    };
    make('รายรับ', incomeTotal);
    make('รายจ่าย', expenseTotal);
  }

  /** Utilities */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(tx));
  }
  function findById(id) { return tx.find(t => t.id === id); }
  const sum = arr => arr.reduce((a,b) => a + b, 0);
  function formatMoney(n) {
    return new Intl.NumberFormat(TH_LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2 }).format(n);
  }
  function formatDate(d) {
    try {
      const [y,m,day] = d.split('-').map(Number);
      const date = new Date(y, m-1, day);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  }
  function debounce(fn, ms=200) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); };
  }

  /** Export/Import */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(tx, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'transactions.json');
  }
  function exportCSV() {
    const header = ['id','type','amount','category','date','note','createdAt','updatedAt'];
    const rows = tx.map(o => header.map(k => JSON.stringify(o[k] ?? '')).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'transactions.csv');
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  async function importFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) { tx = data; save(); render(); alert('นำเข้าข้อมูล JSON สำเร็จ'); }
        else alert('รูปแบบไฟล์ไม่ถูกต้อง');
      } catch { alert('อ่านไฟล์ไม่ได้'); }
    } else if (file.name.endsWith('.csv')) {
      const lines = text.trim().split(/\r?\n/);
      const [header, ...rows] = lines;
      const cols = header.split(',').map(s => s.replace(/^"|"$/g,''));
      const index = (k) => cols.indexOf(k);
      tx = rows.map(r => {
        const cells = parseCSVRow(r);
        return {
          id: cells[index('id')] || crypto.randomUUID(),
          type: cells[index('type')] || 'expense',
          amount: parseFloat(cells[index('amount')] || '0'),
          category: cells[index('category')] || 'อื่น ๆ รายจ่าย',
          date: cells[index('date')] || new Date().toISOString().slice(0,10),
          note: cells[index('note')] || '',
          createdAt: cells[index('createdAt')] || new Date().toISOString(),
          updatedAt: cells[index('updatedAt')] || new Date().toISOString(),
        };
      });
      save(); render(); alert('นำเข้า CSV สำเร็จ');
    } else {
      alert('รองรับเฉพาะ .json และ .csv');
    }
    e.target.value = '';
  }
  function parseCSVRow(row) {
    const out = []; let cur = '', inQ = false;
    for (let i=0; i<row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQ && row[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
      else { cur += ch; }
    }
    out.push(cur);
    return out.map(s => s.replace(/^"|"$/g,''));
  }
})();