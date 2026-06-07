'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, QrCode, Layers, RefreshCw,
  Users, BarChart3, Smartphone, MapPin, Activity, LayoutDashboard, Bell,
  Check, Phone, Mail, Globe, User, MessageCircle, TrendingUp, Wifi, Link2, StickyNote,
} from 'lucide-react'

// ─── Module-level data ────────────────────────────────────────────────────────

const QR_CELLS = Array.from({ length: 441 }, (_, i) => {
  const r = Math.floor(i / 21), c = i % 21
  if (r < 7 && c < 7)   return r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)
  if (r < 7 && c >= 14) return r===0||r===6||c===14||c===20||(r>=2&&r<=4&&c>=16&&c<=18)
  if (r >= 14 && c < 7) return r===14||r===20||c===0||c===6||(r>=16&&r<=18&&c>=2&&c<=4)
  if ((r===7&&c<9)||(c===7&&r<9)) return false
  if (r===6&&c>7&&c<13) return c%2===0
  if (c===6&&r>7&&r<13) return r%2===0
  return (r*17+c*11+r*c*3)%5!==0
})

const UPDATE_FIELDS = [
  { label:'Job title', old:'Sales Executive',   next:'Head of Partnerships' },
  { label:'Phone',     old:'+91 98765 00001',   next:'+91 98765 43210'      },
  { label:'Company',   old:'StartupXYZ Ltd.',   next:'Envitra Technologies'  },
]

const BAR_DATA = [
  { day:'Mon',v:40},{day:'Tue',v:65},{day:'Wed',v:48},
  { day:'Thu',v:82},{day:'Fri',v:95},{day:'Sat',v:55},{day:'Sun',v:30},
]

const HEAT_LOCS  = ['Entry Door','Main Booth','Seminar Hall']
const HEAT_HOURS = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm']
const HEAT_DATA  = [
  [2,4,6,5,3,6,9,6,3],
  [1,3,5,7,4,5,7,5,3],
  [2,2,4,5,4,6,8,5,2],
]

const LEADS = [
  { name:'Priya Sharma', co:'TechCorp India', status:'New',       sc:'bg-blue-500/10 text-blue-500',    dot:'bg-blue-500',   badge:null          },
  { name:'Rohan Mehta',  co:'GrowthFund VC',  status:'Contacted', sc:'bg-amber-500/10 text-amber-600',  dot:'bg-amber-500',  badge:'Nudge Sent'  },
  { name:'Asha Nair',    co:'RetailBrand',    status:'Qualified', sc:'bg-emerald-500/10 text-emerald-600', dot:'bg-emerald-500', badge:null        },
  { name:'Dev Patel',    co:'SaaS.io',        status:'Warm',      sc:'bg-orange-500/10 text-orange-600', dot:'bg-orange-500', badge:'Escalated ↑' },
]

const LC_STEPS = [
  { label:'Tap',     icon:Zap,        detail:'Card tapped at entry',    ac:'border-purple-500/40 bg-purple-500/15 text-purple-500'   },
  { label:'Capture', icon:Users,      detail:'Contact details captured', ac:'border-blue-500/40 bg-blue-500/15 text-blue-500'         },
  { label:'Contact', icon:Phone,      detail:'Agent follow-up logged',   ac:'border-amber-500/40 bg-amber-500/15 text-amber-600'      },
  { label:'Qualify', icon:Check,      detail:'Lead marked qualified',    ac:'border-emerald-500/40 bg-emerald-500/15 text-emerald-600' },
  { label:'Close',   icon:TrendingUp, detail:'Deal closed & attributed', ac:'border-rose-500/40 bg-rose-500/15 text-rose-500'         },
]

const PROFILES = [
  { label:'Work',      gradient:'from-purple-600 to-indigo-700',  role:'Senior Sales Manager',       co:'Envitra Technologies'    },
  { label:'Personal',  gradient:'from-emerald-500 to-teal-700',   role:'Coffee lover & trail runner', co:'@manojr_life'           },
  { label:'Freelance', gradient:'from-orange-500 to-rose-600',    role:'UX / Product Designer',      co:'Available for projects'  },
]

const NOTIFS = [
  { icon:Users,         color:'bg-purple-500/10 text-purple-500',  title:'New lead captured',   body:'Priya Sharma submitted via your profile', time:'just now' },
  { icon:Zap,           color:'bg-amber-500/10 text-amber-600',    title:'Card tapped',          body:'Scanned at NASSCOM Summit · Hall B',       time:'2m ago'   },
  { icon:TrendingUp,    color:'bg-emerald-500/10 text-emerald-600',title:'Lead qualified',       body:'Rohan M. moved to Qualified status',       time:'5m ago'   },
  { icon:MessageCircle, color:'bg-blue-500/10 text-blue-500',      title:'WhatsApp nudge sent',  body:'Auto follow-up sent to 3 dormant leads',  time:'12m ago'  },
]

// ─── Widgets (theme-aware via CSS vars) ───────────────────────────────────────

function QRWidget() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* White bg is intentional — QR standard */}
      <div className="relative bg-white rounded-xl p-3 shadow-md shadow-black/10 border border-black/8">
        <div style={{display:'grid',gridTemplateColumns:'repeat(21,1fr)',width:130,height:130,gap:1}}>
          {QR_CELLS.map((dark,i)=><div key={i} className={`rounded-[1px] ${dark?'bg-zinc-900':'bg-white'}`}/>)}
        </div>
        <motion.div className="absolute left-3 right-3 h-0.5 bg-purple-500/80 rounded-full"
          style={{boxShadow:'0 0 6px 2px rgba(48,80,216,0.5)'}}
          animate={{top:['10%','88%','10%']}} transition={{duration:2.8,repeat:Infinity,ease:'easeInOut'}}/>
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">Scan with any camera app</p>
    </div>
  )
}

function ProfilesWidget() {
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      <div className="flex gap-1.5">
        {PROFILES.map((p,i)=>(
          <button key={p.label} onClick={()=>setActive(i)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${
              active===i
                ? 'bg-purple-600 text-white'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] border border-[var(--border)]'
            }`}
          >{p.label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{opacity:0,y:8,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:0.97}}
          transition={{duration:0.2}}
          className="w-full rounded-xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-md)]">
          {/* Gradient profile header — always coloured */}
          <div className={`bg-gradient-to-br ${PROFILES[active].gradient} px-4 py-3 flex items-center gap-3`}>
            <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
              <User size={16} className="text-white"/>
            </div>
            <div>
              <p className="font-bold text-white text-xs">Manoj R.</p>
              <p className="text-white/75 text-[10px]">{PROFILES[active].role}</p>
            </div>
          </div>
          {/* Action bar */}
          <div className="bg-[var(--bg-muted)] px-3 py-2 flex gap-1.5">
            {[{icon:Phone,label:'Call'},{icon:Mail,label:'Email'},{icon:MessageCircle,label:'Chat'}].map(a=>(
              <button key={a.label}
                className="flex-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-page)] rounded-md py-1.5 flex items-center justify-center gap-1 border border-[var(--border)] transition-colors">
                <a.icon size={9} className="text-[var(--text-secondary)]"/>
                <span className="text-[10px] text-[var(--text-primary)] font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function RichContactWidget() {
  const chips = [
    { icon:Phone,      label:'Work phone',    color:'text-purple-500 bg-purple-500/10 border-purple-500/25' },
    { icon:Phone,      label:'Mobile',        color:'text-purple-500 bg-purple-500/10 border-purple-500/25' },
    { icon:Mail,       label:'Work email',    color:'text-blue-500   bg-blue-500/10   border-blue-500/25'   },
    { icon:Mail,       label:'Personal email',color:'text-blue-500   bg-blue-500/10   border-blue-500/25'   },
    { icon:Link2,      label:'LinkedIn',      color:'text-sky-500    bg-sky-500/10    border-sky-500/25'     },
    { icon:Globe,      label:'Website',       color:'text-emerald-600 bg-emerald-500/10 border-emerald-500/25'},
    { icon:StickyNote, label:'Notes',         color:'text-amber-600  bg-amber-500/10  border-amber-500/25'  },
    { icon:MapPin,     label:'Location',      color:'text-rose-500   bg-rose-500/10   border-rose-500/25'   },
  ]
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
          <User size={13} className="text-white"/>
        </div>
        <div>
          <p className="text-[var(--text-primary)] font-bold text-xs leading-tight">Manoj R.</p>
          <p className="text-[var(--text-muted)] text-[9px] leading-tight">8 fields · saves in one tap</p>
        </div>
        <motion.div
          className="ml-auto text-[8px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0"
          animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2, repeat:Infinity }}>
          ● Live
        </motion.div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c,i) => (
          <motion.div key={c.label}
            initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:i*0.06, duration:0.2 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-semibold ${c.color}`}
          >
            <c.icon size={8}/>{c.label}
          </motion.div>
        ))}
      </div>
      <button className="w-full py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-500 text-[10px] font-semibold flex items-center justify-center gap-1">
        <Check size={9}/> Save complete contact
      </button>
    </div>
  )
}

function UpdatesWidget() {
  const [step,setStep]       = useState(0)
  const [showing,setShowing] = useState<'old'|'new'>('old')
  useEffect(()=>{
    setShowing('old')
    const t1=setTimeout(()=>setShowing('new'),1600)
    const t2=setTimeout(()=>setStep(s=>(s+1)%UPDATE_FIELDS.length),3800)
    return ()=>{clearTimeout(t1);clearTimeout(t2)}
  },[step])
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      {UPDATE_FIELDS.map((f,i)=>(
        <div key={f.label} className={`rounded-lg px-3 py-2.5 border transition-all duration-300 ${
          i===step
            ? 'bg-[var(--bg-muted)] border-purple-500/50'
            : 'bg-[var(--bg-page)] border-[var(--border)]'
        }`}>
          <p className="text-[9px] text-[var(--text-muted)] mb-1 uppercase tracking-widest font-medium">{f.label}</p>
          <div className="h-4 flex items-center">
            {i===step ? (
              <AnimatePresence mode="wait">
                <motion.div key={showing}
                  initial={{opacity:0,y:3}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-3}}
                  transition={{duration:0.2}} className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${showing==='new' ? 'text-emerald-600' : 'text-[var(--text-primary)]'}`}>
                    {showing==='new' ? f.next : f.old}
                  </span>
                  {showing==='new' && (
                    <motion.span initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
                      className="text-[8px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 px-1 py-0.5 rounded-full">
                      Updated ✓
                    </motion.span>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">{f.old}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function NoAppWidget() {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-md)]">
        {/* Browser chrome */}
        <div className="bg-[var(--bg-muted)] px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            {['bg-red-400','bg-amber-400','bg-emerald-400'].map(c=><div key={c} className={`w-2 h-2 rounded-full ${c}`}/>)}
          </div>
          <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full px-2 py-0.5 flex items-center gap-1.5">
            <Globe size={8} className="text-emerald-600 shrink-0"/>
            <span className="text-[9px] text-[var(--text-secondary)] font-mono truncate">envitra.in/u/manoj-r</span>
          </div>
        </div>
        {/* Browser content */}
        <div className="bg-[var(--bg-page)] p-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <User size={22} className="text-white"/>
          </div>
          <div className="text-center">
            <p className="text-[var(--text-primary)] font-bold text-xs">Manoj R.</p>
            <p className="text-[var(--text-secondary)] text-[10px] mt-0.5">Head of Partnerships · Envitra</p>
          </div>
          <div className="flex gap-1.5 w-full">
            <button className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1">
              <Phone size={9}/>Call
            </button>
            <button className="flex-1 py-2 rounded-lg bg-[var(--bg-muted)] text-[var(--text-primary)] text-[10px] font-semibold flex items-center justify-center gap-1 border border-[var(--border)]">
              <Mail size={9}/>Email
            </button>
          </div>
          <motion.div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]"
            animate={{opacity:[0.5,1,0.5]}} transition={{duration:2.5,repeat:Infinity}}>
            <Check size={8} className="text-emerald-600"/>No app needed · Any browser
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function LeadCaptureWidget() {
  const [phase,setPhase] = useState<'form'|'success'>('form')
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase('success'),3200)
    const t2=setTimeout(()=>setPhase('form'),6200)
    return ()=>{clearTimeout(t1);clearTimeout(t2)}
  },[phase])
  const fields = [
    { icon:User,  value:'Priya Sharma',      delay:0.4  },
    { icon:Phone, value:'+91 99887 65432',   delay:0.9  },
    { icon:Mail,  value:'priya@techcorp.in', delay:1.4  },
  ]
  return (
    <div className="w-full max-w-xs mx-auto">
      <AnimatePresence mode="wait">
        {phase==='form' ? (
          <motion.div key="form"
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border)] space-y-3">
            <div>
              <p className="text-[var(--text-primary)] font-bold text-xs">Drop your details</p>
              <p className="text-[var(--text-secondary)] text-[10px] mt-0.5">Manoj R. will get back to you</p>
            </div>
            <div className="space-y-2">
              {fields.map(f=>(
                <div key={f.value} className="bg-[var(--bg-page)] rounded-lg px-2.5 py-2 flex items-center gap-2 border border-[var(--border)]">
                  <f.icon size={10} className="text-[var(--text-muted)] shrink-0"/>
                  <motion.span className="text-[11px] text-[var(--text-primary)]"
                    animate={{opacity:[0,1]}} transition={{delay:f.delay,duration:0.5}}>
                    {f.value}
                  </motion.span>
                </div>
              ))}
            </div>
            <motion.div animate={{opacity:[0,1]}} transition={{delay:1.9,duration:0.4}}>
              <button className="w-full py-2 rounded-lg bg-purple-600 text-white text-[11px] font-semibold">Send my details</button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="success"
            initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.92}}
            className="bg-[var(--bg-muted)] rounded-xl p-6 border border-emerald-500/25 flex flex-col items-center gap-2 text-center">
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',damping:12,stiffness:200}}
              className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Check size={22} className="text-emerald-600"/>
            </motion.div>
            <p className="text-[var(--text-primary)] font-bold text-xs">Lead captured!</p>
            <p className="text-[var(--text-secondary)] text-[10px] leading-relaxed">Priya landed in your dashboard instantly.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationsWidget() {
  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      {NOTIFS.map((n,i)=>(
        <motion.div key={n.title}
          initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:i*0.1,duration:0.3}}
          className="flex items-start gap-2.5 bg-[var(--bg-muted)] rounded-xl px-3 py-2.5 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors">
          <div className={`p-1.5 rounded-lg shrink-0 ${n.color}`}><n.icon size={11}/></div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">{n.title}</p>
            <p className="text-[9px] text-[var(--text-secondary)] leading-snug mt-0.5 truncate">{n.body}</p>
          </div>
          <span className="text-[8px] text-[var(--text-muted)] shrink-0 mt-0.5 whitespace-nowrap">{n.time}</span>
        </motion.div>
      ))}
    </div>
  )
}

function AnalyticsWidget() {
  const H=60, MAX=95
  return (
    <div className="w-full max-w-xs mx-auto bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[var(--text-secondary)] text-[10px] mb-0.5">Card taps this week</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">1,284</p>
        </div>
        <span className="text-emerald-600 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">↑ 24%</span>
      </div>
      <div className="flex items-end gap-1">
        {BAR_DATA.map((b,i)=>(
          <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
            <div style={{height:H}} className="w-full flex items-end">
              <motion.div className="w-full rounded-t-sm bg-gradient-to-t from-purple-600 to-purple-400"
                initial={{height:0}} animate={{height:Math.round((b.v/MAX)*H)}} transition={{delay:i*0.08,duration:0.55,ease:'easeOut'}}/>
            </div>
            <span className="text-[8px] text-[var(--text-muted)] leading-none">{b.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LocationWidget() {
  return (
    <div className="w-full max-w-sm mx-auto bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border)]">
      <p className="text-[var(--text-primary)] font-semibold text-xs mb-3">Tap heatmap · location × hour</p>
      <div>
        <div className="flex gap-0.5 pl-[68px] mb-0.5">
          {HEAT_HOURS.map(h=><span key={h} className="flex-1 text-[7px] text-[var(--text-muted)] text-center leading-none">{h}</span>)}
        </div>
        {HEAT_DATA.map((row,ri)=>(
          <div key={ri} className="flex items-center gap-0.5 mb-1">
            <span className="w-[64px] text-[8px] text-[var(--text-secondary)] text-right pr-2 shrink-0 leading-tight">{HEAT_LOCS[ri]}</span>
            {row.map((v,ci)=>{
              const isPeak=v===9
              return (
                <motion.div key={ci}
                  className={`flex-1 rounded-sm ${isPeak?'ring-1 ring-purple-500/60':''}`}
                  style={{aspectRatio:'1',backgroundColor:isPeak?'rgb(48,80,216)':`rgba(48,80,216,${(v/9)*0.55})`}}
                  animate={isPeak?{scale:[1,1.1,1]}:{}} transition={{duration:1.8,repeat:Infinity,ease:'easeInOut'}}/>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <motion.div className="w-1.5 h-1.5 rounded-full bg-purple-600" animate={{opacity:[1,0.3,1]}} transition={{duration:1.5,repeat:Infinity}}/>
        <span className="text-[10px] text-purple-600 font-medium">Peak: Entry Door · 3 PM · 9 taps</span>
      </div>
    </div>
  )
}

function PulseWidget() {
  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      {LEADS.map((l,i)=>(
        <motion.div key={l.name}
          initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*0.1,duration:0.3}}
          className="flex items-center gap-2.5 bg-[var(--bg-muted)] rounded-xl px-3 py-2.5 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${l.dot}`}/>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{l.name}</p>
            <p className="text-[9px] text-[var(--text-muted)] truncate">{l.co}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {l.badge && (
              <span className="text-[8px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">{l.badge}</span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${l.sc}`}>{l.status}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function LifecycleWidget() {
  const [active,setActive]=useState(0)
  useEffect(()=>{
    const t=setInterval(()=>setActive(s=>(s+1)%LC_STEPS.length),1400)
    return ()=>clearInterval(t)
  },[])
  const curr=LC_STEPS[active]
  const CurrIcon=curr.icon
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-6">
      {/* Step trail */}
      <div className="flex items-center shrink-0">
        {LC_STEPS.map((s,i)=>{
          const Icon=s.icon; const done=i<=active
          return (
            <div key={s.label} className="flex items-center">
              <motion.div className="flex flex-col items-center gap-1.5" animate={{scale:i===active?1.1:1}} transition={{duration:0.25}}>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                  done ? s.ac : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}>
                  <Icon size={14}/>
                </div>
                <span className={`text-[8px] font-semibold tracking-wide transition-colors ${done?'text-[var(--text-primary)]':'text-[var(--text-muted)]'}`}>
                  {s.label}
                </span>
              </motion.div>
              {i<LC_STEPS.length-1 && (
                <div className={`w-5 h-0.5 rounded-full mx-1 mb-4 transition-all duration-500 ${i<active?'bg-purple-500':'bg-[var(--border)]'}`}/>
              )}
            </div>
          )
        })}
      </div>
      {/* Detail card */}
      <div className="flex-1 w-full bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border)] min-h-[56px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}
            transition={{duration:0.2}} className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border shrink-0 ${curr.ac}`}><CurrIcon size={13}/></div>
            <div>
              <p className="text-[var(--text-primary)] text-xs font-bold">{curr.label}</p>
              <p className="text-[var(--text-secondary)] text-[10px]">{curr.detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Feature definitions with bento spans ─────────────────────────────────────

const FEATURES = [
  { title:'QR code backup',               icon:QrCode,          pro:false, span:2, Widget:QRWidget,
    description:"Every card ships with a unique QR code on the back. When NFC isn't available, the QR delivers the same instant profile experience. One card, two pathways." },
  { title:'Multiple profiles',            icon:Layers,          pro:false, span:1, Widget:ProfilesWidget,
    description:"Switch between Work, Personal, or Freelance profiles with a tap. The next person who scans sees the version you chose. No second card. No awkward overlap." },
  { title:'Rich contact details',         icon:Link2,           pro:false, span:1, Widget:RichContactWidget,
    description:"Add multiple phone numbers, email addresses, website links, social profiles, and personal notes to your card. When someone taps, they receive a complete contact entry — every important detail saved in one go, nothing left out." },
  { title:'Real-time updates',            icon:RefreshCw,       pro:false, span:1, Widget:UpdatesWidget,
    description:"Changed jobs? New number? Update in the dashboard and every future tap reflects it immediately. Zero reprinting. Zero outdated details." },
  { title:'No app required',              icon:Smartphone,      pro:false, span:1, Widget:NoAppWidget,
    description:"Nothing to install on either side. Taps open directly in the browser. Works on iPhone, Android, and every modern browser without friction." },
  { title:'Lead capture',                 icon:Users,           pro:true,  span:1, Widget:LeadCaptureWidget,
    description:"Visitors drop their name, number, and email directly on your profile. Leads land in your dashboard instantly — no business card chase, no lost contacts." },
  { title:'Smart notifications',          icon:Bell,            pro:true,  span:2, Widget:NotificationsWidget,
    description:"Instant alerts for every key event — new lead, card tap, status change, deal closed. Customisable channels (email, WhatsApp, in-app) per agent or team." },
  { title:'Analytics',                    icon:BarChart3,       pro:true,  span:1, Widget:AnalyticsWidget,
    description:"Every tap, scan, and profile view is recorded. See which links convert, which agents perform, and what times drive the most activity." },
  { title:'Location & time intelligence', icon:MapPin,          pro:true,  span:2, Widget:LocationWidget,
    description:"Every tap logs where, when, and by whom. Over 90 days patterns emerge. Your best capture point is the entry door. Your peak hour is 3 PM." },
  { title:'Pulse point tracking',         icon:Activity,        pro:true,  span:1, Widget:PulseWidget,
    description:"Every lead carries a status: new, contacted, qualified, warm, closed. Agents update in one tap. Dormant leads trigger WhatsApp nudges automatically." },
  { title:'Full activity lifecycle',      icon:LayoutDashboard, pro:true,  span:2, Widget:LifecycleWidget,
    description:"Tap, capture, contact, qualify, close — all in one place. Agent activities, admin oversight, team leaderboards, event ROI, WhatsApp threads. One dashboard, multiple lenses." },
]

// ─── Main Component ────────────────────────────────────────────────────────────

export function Features() {
  return (
    <section id="features" className="py-24 bg-[var(--bg-page)] transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Everything your business<br className="hidden sm:block" /> card was missing
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Go beyond paper. Unlock a suite of networking tools designed to capture every opportunity.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            const W    = f.Widget
            const spanCls =
              f.span === 3 ? 'md:col-span-2 lg:col-span-3' :
              f.span === 2 ? 'md:col-span-2 lg:col-span-2' : ''

            return (
              <motion.div
                key={f.title}
                className={`${spanCls} flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden group hover:border-purple-500/40 hover:shadow-[var(--shadow-lg)] transition-all duration-300`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: (i % 3) * 0.07, duration: 0.4, ease: 'easeOut' }}
              >
                {/* Widget preview area */}
                <div className="bg-[var(--bg-page)] flex items-center justify-center px-6 py-8 overflow-hidden min-h-[220px] relative">
                  {/* Subtle dot-grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(48,80,216,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  <div className="relative z-10 w-full pointer-events-none">
                    <W />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 border-t border-[var(--border)] space-y-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-purple-600/10 text-purple-500 group-hover:bg-purple-600/15 transition-colors">
                      <Icon size={14} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug">
                      {f.title}
                    </h3>
                    {f.pro && (
                      <span className="ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-500 shrink-0">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
