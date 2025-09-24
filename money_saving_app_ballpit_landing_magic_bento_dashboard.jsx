import React, { useEffect, useState } from 'react'
import { PiggyBank, Plus, Trash2, Settings2 } from 'lucide-react'

// ===== Helpers =====
const THB = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'THB', maximumFractionDigits: 2 })
const parseAmount = (x: string) => { const n = Number((x || '').toString().replaceAll(',', '')); return isNaN(n) ? 0 : n }
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const LS = { goal: 'ms.goal.v4', rows: 'ms.rows.v4', bills: 'ms.bills.v1', lastRun: 'ms.recurring.lastRun' }
const CATS = ['ของกิน','เงินเดือน','เบี้ยเลี้ยง','ซื้อของ','ค่าเดินทาง','ค่าไฟ','ค่าเน็ต','อื่นๆ']


// ===== Global Styles (Light) =====
function GlobalStyles() {
  const css = `
  :root{--bg:#f8fafc;--card:#ffffff;--text:#0f172a;--muted:#475569;--border:#e5e7eb;--accent:#2563eb;--good:#059669;--bad:#dc2626}
  *{box-sizing:border-box}
  html,body,#root{height:100%}
  body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
  .container{width:min(1100px,92vw);margin:0 auto;padding:24px}
  .center{display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}
  .title-hero{font-weight:900;letter-spacing:.5px;font-size:clamp(40px,6vw,72px);margin:0}
  .sub-hero{color:var(--muted);margin-top:8px}
  .btn{border:1px solid var(--border);background:#fff;border-radius:12px;padding:.75rem 1.1rem;cursor:pointer}
  .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
  .btn.ghost{background:transparent}
  .btn.danger{background:#ef4444;border-color:#ef4444;color:#fff}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .brand{font-weight:800;letter-spacing:.4px}
  .grid{display:grid;gap:16px}
  @media (min-width:900px){.grid{grid-template-columns:repeat(12,1fr)}}
  .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px}
  .title{font-weight:800;margin:0 0 8px 0}
  .muted{color:var(--muted)}
  .row{display:grid;gap:12px}
  @media (min-width:720px){.row.cols-2{grid-template-columns:repeat(2,1fr)}.row.cols-3{grid-template-columns:repeat(3,1fr)}.row.cols-4{grid-template-columns:repeat(4,1fr)}}
  input,select,textarea{width:100%;padding:.65rem .85rem;border:1px solid var(--border);border-radius:12px;background:#fff;color:var(--text);outline:none}
  .kpi{display:flex;gap:18px;flex-wrap:wrap}
  .kpi .box{flex:1 min(220px,100%);background:#fff;border:1px solid var(--border);padding:12px 14px;border-radius:12px}
  .kpi .label{color:var(--muted);font-size:.9rem}
  .kpi .value{font-size:1.8rem;font-weight:900}
  .list{display:flex;flex-direction:column;gap:10px}
  .item{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px}
  .pill{font-size:.75rem;padding:.25rem .5rem;border-radius:999px;border:1px solid var(--border)}
  .pill.income{background:#ecfdf5;border-color:#34d399;color:#065f46}
  .pill.expense{background:#fef2f2;border-color:#fca5a5;color:#7f1d1d}
  table{width:100%;border-collapse:collapse}
  th,td{border-bottom:1px solid var(--border);padding:.5rem .6rem;text-align:left}
  thead th{color:var(--muted)}
  `
  return <style>{css}</style>
}

// ===== Types =====
type Goal = { amount: number; period: 'day'|'month'|'year' }
type Row = { id: string; date: string; type: 'income'|'expense'; category: string; note: string; amount: string }
type Bill = { id: string; name: string; amount: string; day: number; last?: string }

// ===== Landing =====
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="center">
      <div>
        <h1 className="title-hero">Money Saving</h1>
        <div className="sub-hero">ติดตามรายรับ–รายจ่าย ตั้งเป้าหมาย ออมเงินให้เติบโต</div>
        <div style={{ marginTop: 20 }}>
          <button className="btn primary" onClick={onStart}>เริ่มใช้งาน</button>
        </div>
      </div>
    </div>
  )
}

// ===== Goal Form =====
function GoalForm({ initial, onSave }: { initial?: Goal | null; onSave: (g: Goal) => void }) {
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0)
  const [period, setPeriod] = useState<Goal['period']>(initial?.period ?? 'month')
  return (
    <div className="card">
      <h3 className="title">กำหนดเป้าหมายการออม</h3>
      <div className="row cols-3" style={{ marginTop: 8 }}>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>จำนวนเงิน</div>
          <input type="number" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="3000" />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>รอบเวลา</div>
          <select value={period} onChange={e => setPeriod(e.target.value as Goal['period'])}>
            <option value="day">ต่อวัน</option>
            <option value="month">ต่อเดือน</option>
            <option value="year">ต่อปี</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn primary" style={{ width: '100%' }} onClick={() => onSave({ amount, period })}>บันทึกเป้าหมาย</button>
        </div>
      </div>
      <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>เช่น 3,000 บาท / เดือน</div>
    </div>
  )
}

// ===== Quick Add (Form) =====
function AddForm({ onAdd }: { onAdd: (r: Row) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const add = () => { if (!amount) return; onAdd({ id: uuid(), date, type, category, note, amount }); setAmount(''); setNote(''); setCategory('') }
  return (
    <div className="card">
      <h3 className="title">บันทึกรายการ (แบบฟอร์ม)</h3>
      <div className="row cols-4" style={{ marginTop: 8 }}>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
        <select value={type} onChange={e => setType(e.target.value as any)}>
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
        </select>
        <input list="catlist" placeholder="หมวดหมู่ (เลือกหรือพิมพ์เอง)" value={category} onChange={e => setCategory(e.target.value)} />
        <datalist id="catlist">
          {CATS.map(c => <option value={c} key={c} />)}
        </datalist>
        <input placeholder="จำนวนเงิน (บาท)" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="row cols-2" style={{ marginTop: 8 }}>
        <input placeholder="โน้ต (ถ้ามี)" value={note} onChange={e => setNote(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={add}><Plus size={16} style={{ marginRight: 6 }} />เพิ่มรายการ</button>
        </div>
      </div>
    </div>
  )
}

// ===== Spreadsheet-like Table =====
function TableEditor({ rows, setRows }: { rows: Row[]; setRows: React.Dispatch<React.SetStateAction<Row[]>> }) {
  const setCell = (id: string, key: keyof Row, value: any) => setRows(rows.map(r => (r.id === id ? { ...r, [key]: value } : r)))
  const remove = (id: string) => setRows(rows.filter(r => r.id !== id))
  const addRow = () => setRows([{ id: uuid(), date: new Date().toISOString().slice(0, 16), type: 'expense', category: '', note: '', amount: '' }, ...rows])

  const importFromText = (text: string) => {
    const trimmed = text.trim(); if (!trimmed) return
    const lines = trimmed.replaceAll('\r','').split('\n')
    const next = [...rows]
    lines.forEach(line => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',')
      const r: Row = { id: uuid(), date: new Date().toISOString().slice(0, 16), type: 'expense', category: '', note: '', amount: '' }
      if (parts[0] && !isNaN(Date.parse(parts[0]))) r.date = new Date(parts[0]).toISOString().slice(0, 16)
      const t = (parts[1] || '').toLowerCase(); r.type = t.startsWith('i') ? 'income' : t.startsWith('e') ? 'expense' : 'expense'
      r.category = parts[2] || ''; r.note = parts[3] || ''; r.amount = parts[4] || ''
      next.push(r)
    })
    setRows(next)
  }

  const exportTSV = () => {
    const header = ['date', 'type', 'category', 'note', 'amount']
    const body = rows.map(r => [r.date, r.type, r.category, r.note, r.amount].join('\t')).join('\n')
    const tsv = header.join('\t') + '\n' + body
    navigator.clipboard.writeText(tsv)
  }

  const [paste, setPaste] = useState('')

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="title">ตาราง (ถนัดแบบสเปรดชีท)</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={addRow}>เพิ่มแถว</button>
          <button className="btn" onClick={exportTSV}>คัดลอก TSV</button>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>วันที่/เวลา</th><th>ประเภท</th><th>หมวด</th><th>โน้ต</th><th>จำนวน</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td><input type="datetime-local" value={r.date} onChange={e => setCell(r.id, 'date', e.target.value)} /></td>
              <td>
                <select value={r.type} onChange={e => setCell(r.id, 'type', e.target.value as any)}>
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
              </td>
              <td><input list="catlist" value={r.category} onChange={e => setCell(r.id, 'category', e.target.value)} /></td>
              <td><input value={r.note} onChange={e => setCell(r.id, 'note', e.target.value)} /></td>
              <td><input inputMode="decimal" value={r.amount} onChange={e => setCell(r.id, 'amount', e.target.value)} /></td>
              <td><button className="btn danger" onClick={() => remove(r.id)}><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10 }} className="row cols-1">
        <textarea placeholder="วางข้อมูล TSV/CSV : date, type, category, note, amount" value={paste} onChange={e => setPaste(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => importFromText(paste)}>นำเข้า</button>
          <button className="btn ghost" onClick={() => setPaste('')}>ล้าง</button>
        </div>
      </div>
      {/* shared datalist for table too */}
      <datalist id="catlist">
        {CATS.map(c => <option value={c} key={c} />)}
      </datalist>
    </div>
  )
}

// ===== List View =====
function List({ rows, onDelete }: { rows: Row[]; onDelete: (id: string) => void }) {
  const fmt = (s: string) => { try { return new Date(s).toLocaleString() } catch { return s } }
  return (
    <div className="card">
      <h3 className="title">ประวัติรายการ</h3>
      <div className="list">
        {rows.length === 0 && <div className="muted">ยังไม่มีรายการ</div>}
        {rows.map(r => (
          <div className="item" key={r.id}>
            <span className={`pill ${r.type}`}>{r.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.category || 'ทั่วไป'} {r.note && <span className="muted">— {r.note}</span>}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{fmt(r.date)}</div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 140, fontWeight: 900 }}>{(r.type === 'expense' ? '-' : '+')}{THB(parseAmount(r.amount))}</div>
            <button className="btn danger" style={{ marginLeft: 6 }} onClick={() => onDelete(r.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Summary, Pie, Motivation =====
function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const positive = data.filter(d => d.value > 0)
  const total = positive.reduce((s, d) => s + d.value, 0)
  const getColor = (i: number) => `hsl(${(i * 63) % 360}, 70%, 55%)`
  const radius = 80; const cx = 90; const cy = 90; let angle = -Math.PI / 2

  if (total <= 0) {
    return (
      <div>
        <svg width={180} height={180} viewBox="0 0 180 180" aria-label="pie chart (empty)">
          <circle cx={90} cy={90} r={80} fill="#f1f5f9" />
          <text x={90} y={96} textAnchor="middle" fontSize="12" fill="#94a3b8">ไม่มีข้อมูล</text>
        </svg>
      </div>
    )
  }

  if (positive.length === 1) {
    const color = getColor(0)
    return (
      <div>
        <svg width={180} height={180} viewBox="0 0 180 180" aria-label="pie chart (single)">
          <circle cx={90} cy={90} r={80} fill={color} />
        </svg>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:6,marginTop:6}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:10,height:10,background:color,borderRadius:2,display:'inline-block'}} />
            <span className="muted" style={{fontSize:12}}>{positive[0].label} — {THB(positive[0].value)} (100%)</span>
          </div>
        </div>
      </div>
    )
  }

  const paths: JSX.Element[] = []
  positive.forEach((d, i) => {
    const portion = d.value / total
    const theta = portion * Math.PI * 2
    const x1 = cx + radius * Math.cos(angle)
    const y1 = cy + radius * Math.sin(angle)
    angle += theta
    const x2 = cx + radius * Math.cos(angle)
    const y2 = cy + radius * Math.sin(angle)
    const large = theta > Math.PI ? 1 : 0
    const color = getColor(i)
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`
    paths.push(<path key={i} d={path} fill={color} />)
  })

  return (
    <div>
      <svg width={180} height={180} viewBox="0 0 180 180" aria-label="pie chart">
        <circle cx={cx} cy={cy} r={radius} fill="#f1f5f9" />
        {paths}
      </svg>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:6,marginTop:6}}>
        {positive.map((d, i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:10,height:10,background:getColor(i),borderRadius:2,display:'inline-block'}} />
            <span className="muted" style={{fontSize:12}}>{d.label} — {THB(d.value)} ({Math.round((d.value/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Summary({ rows, goal }: { rows: Row[]; goal: Goal | null }) {
  const income = rows.reduce((s, r) => s + (r.type === 'income' ? parseAmount(r.amount) : 0), 0)
  const expense = rows.reduce((s, r) => s + (r.type === 'expense' ? parseAmount(r.amount) : 0), 0)
  const left = income - expense
  const msg = left >= 0 ? 'เยี่ยม! เดินหน้าต่อไปทีละก้าว' : 'ใจเย็น ๆ จัดลำดับความสำคัญก่อนนะ'
  const catTotals: Record<string, number> = {}
  rows.filter(r => r.type === 'expense').forEach(r => { const k = r.category || 'อื่นๆ'; catTotals[k] = (catTotals[k] || 0) + parseAmount(r.amount) })
  const pieData = Object.entries(catTotals).map(([label, value]) => ({ label, value }))
  return (
    <div className="card">
      <h3 className="title">สรุป</h3>
      <div className="kpi" style={{ marginBottom: 10 }}>
        <div className="box"><div className="label">คงเหลือ (รายรับ − รายจ่าย)</div><div className="value">{THB(left)}</div></div>
        <div className="box"><div className="label">รายรับ</div><div className="value" style={{ color: 'var(--good)' }}>{THB(income)}</div></div>
        <div className="box"><div className="label">รายจ่าย</div><div className="value" style={{ color: 'var(--bad)' }}>{THB(expense)}</div></div>
      </div>
      <div className="row cols-2">
        <div>
          <div className="muted">วันนี้คุณทำได้ดีแค่ไหน?</div>
          <p>คงเหลือ {THB(left)} — {msg} {goal ? `| เป้าหมาย ${THB(goal.amount)} / ${goal.period === 'day' ? 'วัน' : goal.period === 'month' ? 'เดือน' : 'ปี'}` : ''}</p>
          <div className="muted" style={{ fontSize: 12 }}>เคล็ดลับ: จดทุกค่าใช้จ่ายแม้เล็กน้อย ความสม่ำเสมอคือพลัง 💪</div>
        </div>
        <div>
          <PieChart data={pieData} />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>แผนภาพวงกลม: สัดส่วนรายจ่ายแยกตามหมวด</div>
        </div>
      </div>
    </div>
  )
}

// ===== Dividend & Growth =====
function DividendCalc() {
  const [principal, setPrincipal] = useState(100000)
  const [yieldPct, setYieldPct] = useState(5)
  const [freq, setFreq] = useState<'day'|'month'|'year'>('month')
  const yearly = principal * (yieldPct / 100)
  const monthly = yearly / 12
  const daily = yearly / 365
  const val = freq === 'day' ? daily : freq === 'month' ? monthly : yearly
  return (
    <div className="card">
      <h3 className="title">คำนวณเงินปันผล</h3>
      <div className="row cols-3" style={{ marginTop: 8 }}>
        <div><div className="muted" style={{ marginBottom: 6 }}>เงินลงทุน</div><input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} /></div>
        <div><div className="muted" style={{ marginBottom: 6 }}>ผลตอบแทนต่อปี (%)</div><input type="number" value={yieldPct} onChange={e => setYieldPct(Number(e.target.value))} /></div>
        <div><div className="muted" style={{ marginBottom: 6 }}>รับเป็น</div><select value={freq} onChange={e => setFreq(e.target.value as any)}><option value="day">รายวัน</option><option value="month">รายเดือน</option><option value="year">รายปี</option></select></div>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>ประมาณการ: <b>{THB(val)}</b> | ต่อปี {THB(yearly)} · ต่อเดือน {THB(monthly)} · ต่อวัน {THB(daily)}</div>
    </div>
  )
}

function GrowthCalc() {
  const [principal, setPrincipal] = useState(50000)
  const [monthly, setMonthly] = useState(3000)
  const [rate, setRate] = useState(5) // % ต่อปี
  const [years, setYears] = useState(5)
  const n = years * 12
  const r = rate / 100 / 12
  const fv = principal * Math.pow(1 + r, n) + (monthly * (Math.pow(1 + r, n) - 1)) / r
  return (
    <div className="card">
      <h3 className="title">คำนวณการเติบโต (ดอกเบี้ยทบต้น)</h3>
      <div className="row cols-4" style={{ marginTop: 8 }}>
        <div><div className="muted" style={{ marginBottom: 6 }}>เงินตั้งต้น</div><input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} /></div>
        <div><div className="muted" style={{ marginBottom: 6 }}>เพิ่มต่อเดือน</div><input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} /></div>
        <div><div className="muted" style={{ marginBottom: 6 }}>อัตราต่อปี (%)</div><input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} /></div>
        <div><div className="muted" style={{ marginBottom: 6 }}>ระยะเวลา (ปี)</div><input type="number" value={years} onChange={e => setYears(Number(e.target.value))} /></div>
      </div>
      <div className="muted" style={{ marginTop: 8 }}>มูลค่าโดยประมาณเมื่อครบกำหนด: <b>{THB(isFinite(fv) ? fv : 0)}</b></div>
    </div>
  )
}

// ===== Recurring Monthly Bills =====
function daysInMonth(year: number, monthIndex0: number) { return new Date(year, monthIndex0 + 1, 0).getDate() }
function setDay(d: Date, day: number) { const dt = new Date(d); const dim = daysInMonth(dt.getFullYear(), dt.getMonth()); dt.setDate(Math.min(day, dim)); return dt }

function RecurringBills({ bills, setBills, onProcess }: { bills: Bill[]; setBills: React.Dispatch<React.SetStateAction<Bill[]>>; onProcess: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [day, setDayN] = useState(15)
  const add = () => { if (!name || !amount) return; setBills([...bills, { id: uuid(), name, amount, day }]); setName(''); setAmount('') }
  const remove = (id: string) => setBills(bills.filter(b => b.id !== id))
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="title">รายจ่ายรายเดือนอัตโนมัติ</h3>
        <button className="btn" onClick={onProcess}><Settings2 size={16} style={{ marginRight: 6 }} />ประมวลผลตอนนี้</button>
      </div>
      <div className="row cols-4" style={{ marginTop: 8 }}>
        <input placeholder="ชื่อค่าใช้จ่าย เช่น อินเทอร์เน็ต" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="จำนวนเงิน" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
        <input type="number" min={1} max={31} value={day} onChange={e => setDayN(Number(e.target.value))} />
        <button className="btn primary" onClick={add}><Plus size={16} style={{ marginRight: 6 }} />เพิ่ม</button>
      </div>
      <div className="list" style={{ marginTop: 10 }}>
        {bills.length === 0 && <div className="muted">ยังไม่มีรายการ</div>}
        {bills.map(b => (
          <div className="item" key={b.id}>
            <span className="pill expense">ตัดวันที่ {b.day}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>จะหักอัตโนมัติทุกเดือน</div>
            </div>
            <div style={{ fontWeight: 900, minWidth: 120, textAlign: 'right' }}>{THB(parseAmount(b.amount))}</div>
            <button className="btn danger" style={{ marginLeft: 6 }} onClick={() => remove(b.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function processRecurring(bills: Bill[], setBills: React.Dispatch<React.SetStateAction<Bill[]>>, addRow: (r: Row) => void) {
  const today = new Date();
  const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastRunStr = localStorage.getItem(LS.lastRun);
  let cursor = lastRunStr ? new Date(lastRunStr) : todayYMD;
  if (cursor < todayYMD) cursor = new Date(cursor.getTime() + 24 * 3600 * 1000);

  const updated = bills.map(b => ({ ...b }));
  while (cursor <= todayYMD) {
    updated.forEach(b => {
      const billDay = Math.min(b.day, daysInMonth(cursor.getFullYear(), cursor.getMonth()))
      const last = b.last ? new Date(b.last) : null
      if (cursor.getDate() === billDay) {
        const sameMonth = last && last.getFullYear() === cursor.getFullYear() && last.getMonth() === cursor.getMonth()
        if (!sameMonth) {
          const d = new Date(cursor); d.setHours(9, 0, 0, 0)
          addRow({ id: uuid(), date: d.toISOString().slice(0, 16), type: 'expense', category: b.name, note: 'ตัดทุกเดือน', amount: b.amount })
          b.last = d.toISOString()
        }
      }
    })
    cursor = new Date(cursor.getTime() + 24 * 3600 * 1000)
  }
  setBills(updated)
  localStorage.setItem(LS.lastRun, todayYMD.toISOString())
}

// ===== App =====
export default function App() {
  const [landing, setLanding] = useState(true)
  const [goal, setGoal] = useState<Goal | null>(() => { try { const raw = localStorage.getItem(LS.goal); return raw ? JSON.parse(raw) : null } catch { return null } })
  const [rows, setRows] = useState<Row[]>(() => { try { return JSON.parse(localStorage.getItem(LS.rows) || '[]') } catch { return [] } })
  const [bills, setBills] = useState<Bill[]>(() => { try { return JSON.parse(localStorage.getItem(LS.bills) || '[]') } catch { return [] } })

  useEffect(() => { localStorage.setItem(LS.rows, JSON.stringify(rows)) }, [rows])
  useEffect(() => { localStorage.setItem(LS.goal, JSON.stringify(goal)) }, [goal])
  useEffect(() => { localStorage.setItem(LS.bills, JSON.stringify(bills)) }, [bills])

  const addRow = (r: Row) => setRows(prev => [r, ...prev])
  const deleteRow = (id: string) => setRows(prev => prev.filter(x => x.id !== id))

  useEffect(() => { if (!landing && bills.length) processRecurring(bills, setBills, addRow) }, [landing])

  if (landing) return (<><GlobalStyles /><Landing onStart={() => setLanding(false)} /></>)

  const income = rows.reduce((s, r) => s + (r.type === 'income' ? parseAmount(r.amount) : 0), 0)
  const expense = rows.reduce((s, r) => s + (r.type === 'expense' ? parseAmount(r.amount) : 0), 0)
  const left = income - expense

  return (
    <div className="container">
      <GlobalStyles />
      <div className="header">
        <div className="brand">Money Saving</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setLanding(true)}>กลับหน้าแรก</button>
          {goal && <button className="btn" onClick={() => { localStorage.removeItem(LS.goal); setGoal(null) }}>รีเซ็ตเป้าหมาย</button>}
        </div>
      </div>

      <div className="grid">
        {/* Summary */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="kpi">
            <div className="box"><div className="label">คงเหลือ</div><div className="value">{THB(left)}</div></div>
            <div className="box"><div className="label">รายรับ</div><div className="value" style={{ color: 'var(--good)' }}>{THB(income)}</div></div>
            <div className="box"><div className="label">รายจ่าย</div><div className="value" style={{ color: 'var(--bad)' }}>{THB(expense)}</div></div>
          </div>
        </div>

        {/* Goal */}
        <div style={{ gridColumn: 'span 12' }}><GoalForm initial={goal} onSave={g => setGoal(g)} /></div>

        {/* Add & List */}
        <div style={{ gridColumn: 'span 12' }}><AddForm onAdd={addRow} /></div>
        <div style={{ gridColumn: 'span 12' }}><TableEditor rows={rows} setRows={setRows} /></div>
        <div style={{ gridColumn: 'span 12' }}><List rows={rows} onDelete={deleteRow} /></div>

        {/* Summary paragraph & pie */}
        <div style={{ gridColumn: 'span 12' }}><Summary rows={rows} goal={goal} /></div>

        {/* Dividend & Growth */}
        <div style={{ gridColumn: 'span 6' }}><DividendCalc /></div>
        <div style={{ gridColumn: 'span 6' }}><GrowthCalc /></div>

        {/* Recurring bills */}
        <div style={{ gridColumn: 'span 12' }}>
          <RecurringBills bills={bills} setBills={setBills} onProcess={() => processRecurring(bills, setBills, addRow)} />
        </div>
      </div>
    </div>
  )
}
