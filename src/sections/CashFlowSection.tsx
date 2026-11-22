import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleAlert, Wallet } from 'lucide-react'
import Reveal from '../components/Reveal'

const opening = 18000
const plannedReceipts = [{ day: 10, amount: 6200, name: 'Morgan Lee' }, { day: 17, amount: 1040, name: 'Client payments' }, { day: 20, amount: 850, name: 'Client payments' }, { day: 26, amount: 650, name: 'Client payments' }]
const plannedBills = [{ day: 5, amount: 1800, name: 'Studio rent' }, { day: 13, amount: 3100, name: 'Equipment & supplies' }, { day: 24, amount: 1250, name: 'Subscriptions & tools' }]
const days = Array.from({ length: 31 }, (_, i) => i)

function project(delayDays: number) {
  let balance = opening
  let lowest = opening
  const balances = days.map(day => {
    for (const bill of plannedBills) if (bill.day === day) balance -= bill.amount
    for (const receipt of plannedReceipts) {
      const shiftedDay = receipt.name === 'Morgan Lee' ? receipt.day + delayDays : receipt.day
      if (shiftedDay === day) balance += receipt.amount
    }
    lowest = Math.min(lowest, balance)
    return balance
  })
  return { balances, ending: balances[30], lowest }
}

function points(values: number[]) {
  const min = 10000
  const max = 26000
  return values.map((value, day) => `${(day / 30 * 620).toFixed(1)},${(132 - Math.max(0, Math.min(1, (value - min) / (max - min))) * 132).toFixed(1)}`).join(' ')
}

export default function CashFlowSection() {
  const [delay, setDelay] = useState(0)
  const current = useMemo(() => project(delay), [delay])
  const base = useMemo(() => project(0), [])
  const delayedAmount = delay > 0 && delay > 20 ? 6200 : 0
  const movement = Math.max(0, base.lowest - current.lowest)
  return <section className="cash-section" id="cash-flow">
    <div className="cash-section-top"><Reveal><span className="eyebrow eyebrow-on-dark"><i/> A VIEW A LITTLE FURTHER AHEAD</span><h2>Feel the shape<br/>of <em>what’s next.</em></h2><p>Expected money in. Known bills out. A more grounded view of the weeks ahead.</p><div className="cash-explainer"><span><i className="key-line key-income"/> Expected receipts</span><span><i className="key-line key-expense"/> Upcoming bills</span><span><i className="key-line key-sim"/> Delayed payment</span></div></Reveal></div>
    <Reveal className="forecast-frame"><div className="forecast-frame-head"><div><span className="tiny-index">CASH FLOW PREVIEW</span><h3>The next 30 days</h3></div><span className="preview-tag">ILLUSTRATIVE SCENARIO</span></div>
      <div className="forecast-summary"><div><small>PROJECTED ENDING BALANCE</small><strong>${current.ending.toLocaleString()}<span>.00</span></strong><em>{delayedAmount ? 'One payment falls outside this view' : 'Based on planned activity'}</em></div><div className={current.lowest < 15000 ? 'low-balance low-balance-alert' : 'low-balance'}><span className="low-icon">{current.lowest < 15000 ? <CircleAlert size={13}/> : <Wallet size={13}/>}</span><div><small>LOWEST POINT</small><b>${current.lowest.toLocaleString()}</b></div></div></div>
      <div className="forecast-plot"><div className="plot-y-labels"><span>$26K</span><span>$20K</span><span>$14K</span><span>$10K</span></div><div className="plot-area"><div className="plot-grid"><i/><i/><i/><i/></div><div className="buffer-line"><span>$15K PLANNING BUFFER · ILLUSTRATIVE</span></div><svg viewBox="0 0 620 132" preserveAspectRatio="none" role="img" aria-label={`Illustrative projected cash balance over thirty days. Current scenario ending balance is ${current.ending} dollars.`} key={`chart-${delay}`}>
        {delay > 0 && <polyline className="forecast-baseline" points={points(base.balances)} fill="none" stroke="#a7b19b" strokeWidth="1.5" strokeDasharray="4 5"/>}
        <polyline className="forecast-current" points={points(current.balances)} pathLength={1} fill="none" stroke={current.lowest < 15000 ? '#d08a68' : '#bdc6ae'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg><div className="plot-axis"><span>NOW</span><span>7 DAYS</span><span>14 DAYS</span><span>21 DAYS</span><span>30 DAYS</span></div></div></div>
      <div className="forecast-ledger"><div><i className="ledger-icon ledger-in"><ArrowDownRight size={14}/></i><span><b>Money coming in</b><small>{delay ? 'Morgan Lee · ' + (10 + delay) + ' days' : '4 expected payments'}</small></span><strong>+${(8740 - delayedAmount).toLocaleString()}</strong></div><div><i className="ledger-icon ledger-out"><ArrowUpRight size={14}/></i><span><b>Money going out</b><small>3 upcoming bills</small></span><strong>−$6,150</strong></div></div>
      <div className="scenario-control"><div className="scenario-control-head"><label htmlFor="delay-range"><CalendarClock size={14}/> WHAT IF MORGAN PAYS LATE?</label><output htmlFor="delay-range">{delay === 0 ? 'On time' : delay + ' days later'}</output></div><input id="delay-range" type="range" min="0" max="30" step="5" value={delay} onChange={event => setDelay(Number(event.target.value))} aria-describedby="scenario-description"/><div className="range-markers"><span>On time</span><span>15 days</span><span>30 days</span></div><p id="scenario-description" aria-live="polite">{delay === 0 ? 'Move the largest expected receipt to see how its timing changes the forecast.' : movement > 0 ? `The lowest projected point moves down by $${movement.toLocaleString()}. Your illustrative $15,000 planning buffer is ${current.lowest < 15000 ? 'crossed' : 'still covered'}.` : `The expected receipt moves ${delay} days later. It remains inside the 30-day view, so the ending balance is unchanged.`}</p></div>
    </Reveal>
  </section>
}
