import React, { useEffect, useRef, useState } from 'react';
import {
  pb, PLANS,
  type Client, type Plan, type Payment, type ServiceLog, type Referral, type Message,
} from './pb';
import { TermsModal, TERMS_VERSION } from './terms';
import { motion } from 'framer-motion';
import { buildMandateUrl, simulateWebhook, NETCASH_CONFIG } from './netcash';
import AreasMarquee from './AreasMarquee';
import {
  Wrench, Check, Menu, X, LayoutDashboard, Users, CreditCard, MapPin,
  Phone, Mail, Star, LogOut, ShieldCheck, ClipboardList, Download, Gift,
  UserCircle, History, Share2, Copy, Wallet, TrendingUp, ExternalLink,
  ArrowLeft, Send, HardHat, Clock, Route, Pause, Trash2, Play, MessageSquare,
  Inbox, Timer, Droplets, Home, AlertTriangle, ChevronRight, QrCode,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;
const SERVICE_INTERVAL_DAYS = 30;

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / DAY_MS);
}

function serviceState(c: Client): 'never' | 'due' | 'overdue' | 'fresh' {
  const d = daysSince(c.lastServiced);
  if (d === null) return 'never';
  if (d >= SERVICE_INTERVAL_DAYS + 5) return 'overdue';
  if (d >= SERVICE_INTERVAL_DAYS) return 'due';
  return 'fresh';
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(mins?: number): string {
  if (mins === undefined || mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------
function TierCard({
  plan, selected, onSelect, index, cta,
}: { plan: Plan; selected?: boolean; onSelect: () => void; index: number; cta?: string }) {
  const p = PLANS[plan];
  const isGold = plan === 'gold';
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      className={`relative flex w-full flex-col rounded-2xl border p-6 text-left transition-all ${
        selected
          ? 'border-[#9E7FFF] bg-[#262626] shadow-[0_0_30px_rgba(158,127,255,0.25)]'
          : 'border-[#2F2F2F] bg-[#171717] hover:border-[#9E7FFF]/50'
      }`}
    >
      {isGold && (
        <span className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-[#9E7FFF] px-3 py-1 text-xs font-semibold text-black">
          <Star className="h-3 w-3" /> Most popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{p.name}</h3>
        {selected && <Check className="h-5 w-5 text-[#9E7FFF]" />}
      </div>
      <p className="mt-1 text-xs text-[#A3A3A3]">{p.tagline}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">R{p.price}</span>
        <span className="text-sm text-[#A3A3A3]">/month</span>
      </div>
      <ul className="mt-5 flex-1 space-y-3">
        {p.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm text-[#A3A3A3]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
            <span>
              <span className="block font-medium text-white">{f.text}</span>
              {f.detail && <span className="mt-0.5 block text-xs leading-relaxed text-[#A3A3A3]">{f.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#9E7FFF] py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]">
        {cta ?? (selected ? 'Selected' : 'Choose ' + p.name)}
      </div>
    </motion.button>
  );
}

function MobileMenu({
  items, open, onToggle,
}: {
  items: Array<{ label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean }>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="md:hidden">
      <button
        onClick={onToggle}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2F2F2F] text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute right-4 top-16 z-50 w-56 rounded-2xl border border-[#2F2F2F] bg-[#262626] p-2 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); onToggle(); }}
              className={`flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors ${
                item.primary
                  ? 'bg-[#9E7FFF] font-semibold text-black'
                  : 'text-[#A3A3A3] hover:bg-[#171717] hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<Client['status'], { dot: string; label: string; text: string }> = {
  pending: { dot: 'bg-[#f59e0b]', label: 'Pending', text: 'text-[#f59e0b]' },
  ready: { dot: 'bg-[#38bdf8]', label: 'Ready to service', text: 'text-[#38bdf8]' },
  serviced: { dot: 'bg-[#10b981]', label: 'Serviced', text: 'text-[#10b981]' },
  paused: { dot: 'bg-[#ef4444]', label: 'Paused', text: 'text-[#ef4444]' },
};

const SERVICE_STYLE: Record<ReturnType<typeof serviceState>, { label: string; cls: string }> = {
  never: { label: 'Never serviced', cls: 'bg-[#A3A3A3]/15 text-[#A3A3A3]' },
  fresh: { label: 'Serviced recently', cls: 'bg-[#10b981]/15 text-[#10b981]' },
  due: { label: 'Service due', cls: 'bg-[#f59e0b]/15 text-[#f59e0b]' },
  overdue: { label: 'Service overdue', cls: 'bg-[#ef4444]/15 text-[#ef4444]' },
};

function StatusPill({ status }: { status: Client['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${s.dot} text-black`}>
      <span className="h-1.5 w-1.5 rounded-full bg-black/40" />{s.label}
    </span>
  );
}

function ServicePill({ client }: { client: Client }) {
  const st = serviceState(client);
  const s = SERVICE_STYLE[st];
  const d = daysSince(client.lastServiced);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
      <Clock className="h-3 w-3" /> {s.label}{d !== null ? ` · ${d}d ago` : ''}
    </span>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [view, setView] = useState<'home' | 'signup' | 'dashboard' | 'client' | 'plumber'>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('bronze');
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [signupMsg, setSignupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'payment'>('details');
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);
  const [statusFilter, setStatusFilter] = useState<'all' | Client['status']>('all');
  const [logClient, setLogClient] = useState<Client | null>(null);
  const [logForm, setLogForm] = useState({ date: '', workDone: '', notes: '' });
  const [logMsg, setLogMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailMode, setEmailMode] = useState<'pick' | 'all'>('pick');

  const [clientEmail, setClientEmail] = useState('');
  const [clientError, setClientError] = useState('');
  const [clientLoggedIn, setClientLoggedIn] = useState(false);
  const [clientRecord, setClientRecord] = useState<Client | null>(null);
  const [clientLogs, setClientLogs] = useState<ServiceLog[]>([]);
  const [clientReferrals, setClientReferrals] = useState<Referral[]>([]);
  const [clientMessages, setClientMessages] = useState<Message[]>([]);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralMsg, setReferralMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [clientTab, setClientTab] = useState<'overview' | 'history' | 'referrals' | 'messages'>('overview');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgStatus, setMsgStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [msgSending, setMsgSending] = useState(false);

  const [plumberEmail, setPlumberEmail] = useState('');
  const [plumberPass, setPlumberPass] = useState('');
  const [plumberError, setPlumberError] = useState('');
  const [plumberLoggedIn, setPlumberLoggedIn] = useState(false);
  const [plumberName, setPlumberName] = useState('');
  const [plumberClients, setPlumberClients] = useState<Client[]>([]);
  const [plumberFilter, setPlumberFilter] = useState<'all' | Client['status']>('all');
  const [jobClient, setJobClient] = useState<Client | null>(null);
  const [jobArrival, setJobArrival] = useState<string | null>(null);
  const [jobDone, setJobDone] = useState<string | null>(null);
  const [jobWork, setJobWork] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [jobMsg, setJobMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    pb.authStore.onChange(() => setLoggedIn(pb.authStore.isValid));
  }, []);

  // Stopwatch — ticks while a job is open and not yet completed.
  useEffect(() => {
    if (jobArrival && !jobDone) {
      const start = new Date(jobArrival).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      tickRef.current = window.setInterval(tick, 1000);
      return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
    }
    return undefined;
  }, [jobArrival, jobDone]);

  // ------------------------- Admin data -------------------------
  const loadData = async () => {
    if (!pb.authStore.isValid) return;
    try {
      const c = await pb.collection('clients').getList<Client>(1, 200, { sort: '-created' });
      setClients(c.items);
      const p = await pb.collection('payments').getList<Payment>(1, 500, { sort: '-created' });
      setPayments(p.items);
      const l = await pb.collection('service_logs').getList<ServiceLog>(1, 500, { sort: '-date' });
      setLogs(l.items);
      const m = await pb.collection('messages').getList<Message>(1, 500, { sort: '-created' });
      setMessages(m.items);
    } catch (e) { console.error(e); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await pb.collection('users').authWithPassword(authEmail, authPass);
      await loadData();
    } catch { setAuthError('Invalid email or password.'); }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setClients([]); setPayments([]); setLogs([]); setMessages([]);
  };

  // ------------------------- Plumber -------------------------
  const handlePlumberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlumberError('');
    try {
      const result = await pb.collection('plumbers').getFirstListItem<{ id: string; name: string; email: string; pin: string }>(
        `email = "${plumberEmail}"`
      );
      if (result.pin === plumberPass) {
        setPlumberName(result.name);
        setPlumberLoggedIn(true);
        await loadPlumberData();
      } else {
        setPlumberError('Invalid PIN. Please try again.');
      }
    } catch { setPlumberError('No plumber account found with that email.'); }
  };

  const loadPlumberData = async () => {
    try {
      const c = await pb.collection('clients').getList<Client>(1, 200, { sort: '-created' });
      setPlumberClients(c.items);
    } catch (e) { console.error(e); }
  };

  const handlePlumberLogout = () => {
    setPlumberLoggedIn(false); setPlumberName(''); setPlumberClients([]);
    setPlumberEmail(''); setPlumberPass(''); closeJob();
  };

  const openJob = (c: Client) => {
    setJobClient(c);
    setJobArrival(null); setJobDone(null);
    setJobWork(''); setJobNotes(''); setJobMsg(null); setElapsed(0);
  };

  const closeJob = () => {
    setJobClient(null); setJobArrival(null); setJobDone(null);
    setJobWork(''); setJobNotes(''); setJobMsg(null); setElapsed(0);
  };

  const startJob = () => {
    setJobArrival(new Date().toISOString());
    setJobDone(null);
    setElapsed(0);
  };

  const finishJob = () => {
    if (!jobArrival) return;
    setJobDone(new Date().toISOString());
  };

  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobMsg(null);
    if (!jobClient || !jobArrival) { setJobMsg({ ok: false, text: 'Start the timer when you arrive first.' }); return; }
    if (!jobWork.trim()) { setJobMsg({ ok: false, text: 'Describe the work done.' }); return; }
    const done = jobDone ?? new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round((new Date(done).getTime() - new Date(jobArrival).getTime()) / 60000));
    try {
      await pb.collection('service_logs').create({
        client: jobClient.id,
        date: new Date().toISOString().slice(0, 10),
        workDone: jobWork,
        notes: jobNotes,
        arrivalTime: jobArrival,
        doneTime: done,
        durationMinutes,
        plumber: plumberName,
      });
      await pb.collection('clients').update(jobClient.id, {
        status: 'serviced',
        lastServiced: new Date().toISOString(),
      });
      await loadPlumberData();
      setJobMsg({ ok: true, text: 'Job saved and client marked as serviced.' });
      setTimeout(closeJob, 900);
    } catch (err) {
      setJobMsg({ ok: false, text: 'Something went wrong. Please try again.' });
      console.error(err);
    }
  };

  // ------------------------- Client -------------------------
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    try {
      const result = await pb.collection('clients').getFirstListItem<Client>(`email = "${clientEmail}"`);
      setClientRecord(result);
      setClientLoggedIn(true);
      await loadClientData(result.id);
    } catch { setClientError('No account found with that email. Please sign up first.'); }
  };

  const loadClientData = async (clientId: string) => {
    try {
      const l = await pb.collection('service_logs').getList<ServiceLog>(1, 200, {
        filter: `client = "${clientId}"`, sort: '-date',
      });
      setClientLogs(l.items);
      const r = await pb.collection('referrals').getList<Referral>(1, 200, {
        filter: `referrer = "${clientId}"`, sort: '-created',
      });
      setClientReferrals(r.items);
      const m = await pb.collection('messages').getList<Message>(1, 200, {
        filter: `client = "${clientId}"`, sort: '-created',
      });
      setClientMessages(m.items);
    } catch (e) { console.error(e); }
  };

  const handleClientLogout = () => {
    setClientLoggedIn(false); setClientRecord(null); setClientLogs([]);
    setClientReferrals([]); setClientMessages([]); setClientEmail('');
    setMsgSubject(''); setMsgBody(''); setMsgStatus(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgStatus(null);
    if (!clientRecord) return;
    if (!msgSubject.trim() || !msgBody.trim()) {
      setMsgStatus({ ok: false, text: 'Please add a subject and a message.' }); return;
    }
    setMsgSending(true);
    try {
      await pb.collection('messages').create({
        client: clientRecord.id,
        clientName: clientRecord.name,
        clientEmail: clientRecord.email,
        subject: msgSubject,
        body: msgBody,
        read: false,
      });
      setMsgStatus({ ok: true, text: 'Message sent to the PlumbServ team.' });
      setMsgSubject(''); setMsgBody('');
      await loadClientData(clientRecord.id);
    } catch (err) {
      setMsgStatus({ ok: false, text: 'Could not send your message. Please try again.' });
      console.error(err);
    }
    setMsgSending(false);
  };

  const submitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralMsg(null);
    if (!clientRecord) return;
    if (!referralEmail) { setReferralMsg({ ok: false, text: 'Please enter your friend email address.' }); return; }
    try {
      await pb.collection('referrals').create({
        referrer: clientRecord.id, name: '', email: referralEmail,
        date: new Date().toISOString().slice(0, 10),
      });
      setReferralMsg({ ok: true, text: 'Referral sent! You will earn R100 once your friend signs up.' });
      setReferralEmail('');
      await loadClientData(clientRecord.id);
    } catch (err) {
      setReferralMsg({ ok: false, text: 'Something went wrong. Please try again.' });
      console.error(err);
    }
  };

  const copyReferralLink = async () => {
    const link = `${window.location.origin}?ref=${clientRecord?.id ?? ''}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };

  const referralCount = clientReferrals.length;
  const referralBalance = referralCount * 100;

  // ------------------------- Signup -------------------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupMsg(null);
    if (!accepted) { setSignupMsg({ ok: false, text: 'Please accept the terms and conditions to continue.' }); return; }
    if (!form.name || !form.email || !form.phone || !form.address) {
      setSignupMsg({ ok: false, text: 'Please fill in all your details.' }); return;
    }
    try {
      const client = await pb.collection('clients').create({
        name: form.name, email: form.email, phone: form.phone, address: form.address,
        plan: selectedPlan, termsAccepted: true, termsVersion: TERMS_VERSION, status: 'pending',
      });
      setCreatedClient(client);
      setSignupStep('payment');
    } catch (err) {
      setSignupMsg({ ok: false, text: 'Something went wrong. Please try again.' });
      console.error(err);
    }
  };

  const goToNetcash = () => {
    if (!createdClient) return;
    window.open(buildMandateUrl(createdClient), '_blank', 'noopener');
  };

  const simulateMandate = async () => {
    if (!createdClient) return;
    setProcessingPayment(true);
    setPaymentMsg(null);
    const res = await simulateWebhook(createdClient.id, 'mandate_approved');
    if (res.ok) {
      const pay = await simulateWebhook(createdClient.id, 'payment_success', PLANS[createdClient.plan].price);
      setPaymentMsg({
        ok: pay.ok,
        text: pay.ok
          ? 'Mandate approved and first payment received! Your 30-day waiting period starts today. Our team will contact you shortly.'
          : 'Mandate approved, but the payment simulation failed.',
      });
    } else {
      setPaymentMsg({ ok: false, text: res.text });
    }
    setProcessingPayment(false);
  };

  // ------------------------- Admin actions -------------------------
  const setClientStatus = async (id: string, status: Client['status']) => {
    await pb.collection('clients').update(id, { status });
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setPlumberClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const togglePause = async (c: Client) => {
    await setClientStatus(c.id, c.status === 'paused' ? 'ready' : 'paused');
  };

  const deleteClient = async (c: Client) => {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    try {
      await pb.collection('clients').delete(c.id);
      setClients((prev) => prev.filter((x) => x.id !== c.id));
      setPlumberClients((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) { console.error(err); }
  };

  const togglePayment = async (id: string, paid: boolean) => {
    await pb.collection('payments').update(id, { paid });
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, paid } : p)));
  };

  const markMessageRead = async (m: Message, read: boolean) => {
    try {
      await pb.collection('messages').update(m.id, { read });
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
    } catch (err) { console.error(err); }
  };

  const openLogModal = (client: Client) => {
    setLogClient(client);
    setLogForm({ date: new Date().toISOString().slice(0, 10), workDone: '', notes: '' });
    setLogMsg(null);
  };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogMsg(null);
    if (!logClient) return;
    if (!logForm.date || !logForm.workDone) {
      setLogMsg({ ok: false, text: 'Please add a date and describe the work done.' }); return;
    }
    try {
      await pb.collection('service_logs').create({
        client: logClient.id, date: logForm.date, workDone: logForm.workDone, notes: logForm.notes,
      });
      await pb.collection('clients').update(logClient.id, {
        status: 'serviced',
        lastServiced: new Date(logForm.date).toISOString(),
      });
      await loadData();
      await loadPlumberData();
      setLogMsg({ ok: true, text: 'Service logged successfully.' });
      setLogClient(null);
    } catch (err) {
      setLogMsg({ ok: false, text: 'Something went wrong. Please try again.' });
      console.error(err);
    }
  };

  const exportCSV = () => {
    const esc = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const clientRows = [
      ['Name', 'Email', 'Phone', 'Address', 'Plan', 'Price (R)', 'Status', 'Last serviced', 'Terms Accepted', 'Signed Up'],
      ...clients.map((c) => [
        c.name, c.email, c.phone, c.address, PLANS[c.plan].name, String(PLANS[c.plan].price),
        c.status, c.lastServiced ? fmtDate(c.lastServiced) : '—', c.termsAccepted ? 'Yes' : 'No', fmtDate(c.created),
      ]),
    ];
    const clientsCSV = clientRows.map((r) => r.map(esc).join(',')).join('\n');
    const paymentRows = [
      ['Client', 'Amount (R)', 'Month', 'Paid', 'Date'],
      ...payments.map((p) => {
        const client = clients.find((c) => c.id === p.client);
        return [client?.name ?? 'Unknown', String(p.amount), p.month, p.paid ? 'Yes' : 'No', fmtDate(p.created)];
      }),
    ];
    const paymentsCSV = paymentRows.map((r) => r.map(esc).join(',')).join('\n');
    const logRows = [
      ['Client', 'Date', 'Arrival', 'Done', 'Duration', 'Work Done', 'Notes', 'Plumber'],
      ...logs.map((l) => {
        const client = clients.find((c) => c.id === l.client);
        return [
          client?.name ?? 'Unknown', fmtDate(l.date), fmtTime(l.arrivalTime), fmtTime(l.doneTime),
          fmtDuration(l.durationMinutes), l.workDone, l.notes, l.plumber ?? '',
        ];
      }),
    ];
    const logsCSV = logRows.map((r) => r.map(esc).join(',')).join('\n');
    const ts = new Date().toISOString().slice(0, 10);
    [
      { name: `plumbserv-clients-${ts}.csv`, content: clientsCSV },
      { name: `plumbserv-payments-${ts}.csv`, content: paymentsCSV },
      { name: `plumbserv-service-logs-${ts}.csv`, content: logsCSV },
    ].forEach((file) => {
      const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const openEmailComposer = () => {
    setEmailModalOpen(true); setSelectedEmails(new Set());
    setEmailSubject(''); setEmailBody(''); setEmailMode('pick');
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  };

  const sendEmail = () => {
    const recipients = emailMode === 'all' ? clients.map((c) => c.email) : Array.from(selectedEmails);
    if (recipients.length === 0) return;
    const to = recipients.join(',');
    const subject = encodeURIComponent(emailSubject || 'PlumbServ update');
    const body = encodeURIComponent(emailBody || '');
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setEmailModalOpen(false);
  };

  const filteredClients = statusFilter === 'all' ? clients : clients.filter((c) => c.status === statusFilter);
  const filteredPlumberClients = plumberFilter === 'all' ? plumberClients : plumberClients.filter((c) => c.status === plumberFilter);
  const paidCount = payments.filter((p) => p.paid).length;
  const readyCount = clients.filter((c) => c.status === 'ready').length;
  const servicedCount = clients.filter((c) => c.status === 'serviced').length;
  const dueCount = clients.filter((c) => ['due', 'overdue', 'never'].includes(serviceState(c)) && c.status !== 'paused').length;
  const unreadCount = messages.filter((m) => !m.read).length;

  // =====================================================================
  // PLUMBER PORTAL
  // =====================================================================
  if (view === 'plumber') {
    if (!plumberLoggedIn) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#171717] px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2F2F2F] bg-[#262626] p-8">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-white">
              <HardHat className="h-7 w-7 text-[#9E7FFF]" /> PlumbServ
            </div>
            <p className="mt-2 text-center text-sm text-[#A3A3A3]">Plumber portal</p>
            <form onSubmit={handlePlumberLogin} className="mt-6 space-y-4">
              <input value={plumberEmail} onChange={(e) => setPlumberEmail(e.target.value)} placeholder="Plumber email" type="email"
                className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              <input value={plumberPass} onChange={(e) => setPlumberPass(e.target.value)} placeholder="PIN" type="password"
                className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              {plumberError && <p className="text-sm text-[#ef4444]">{plumberError}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">Log in</button>
            </form>
            <button onClick={() => setView('home')} className="mt-4 w-full text-center text-sm text-[#A3A3A3] hover:text-white">Back to site</button>
          </div>
        </div>
      );
    }

    const pReady = plumberClients.filter((c) => c.status === 'ready').length;
    const pPending = plumberClients.filter((c) => c.status === 'pending').length;
    const pServiced = plumberClients.filter((c) => c.status === 'serviced').length;

    return (
      <div className="min-h-screen bg-[#171717] text-white">
        <header className="border-b border-[#2F2F2F] bg-[#262626] px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold"><HardHat className="h-6 w-6 text-[#9E7FFF]" /> PlumbServ</div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] sm:flex">
                <HardHat className="h-4 w-4 text-[#9E7FFF]" /> {plumberName}
              </div>
              <button onClick={handlePlumberLogout} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#ef4444] hover:text-[#ef4444]">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-[#2F2F2F] bg-gradient-to-br from-[#262626] to-[#1f1f1f] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#A3A3A3]">Welcome,</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{plumberName}</h1>
                <p className="mt-2 text-sm text-[#A3A3A3]">Open a job card, start the stopwatch on arrival, then log the work and finish time.</p>
              </div>
              <button onClick={loadPlumberData} className="flex items-center justify-center gap-2 rounded-xl border border-[#2F2F2F] px-5 py-2.5 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white">
                <LayoutDashboard className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ready to service', value: pReady, icon: Wrench, color: 'text-[#38bdf8]' },
              { label: 'Pending', value: pPending, icon: Clock, color: 'text-[#f59e0b]' },
              { label: 'Serviced', value: pServiced, icon: Check, color: 'text-[#10b981]' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#A3A3A3]">{s.label}</p>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {(['all', 'pending', 'ready', 'serviced', 'paused'] as const).map((f) => (
              <button key={f} onClick={() => setPlumberFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                  plumberFilter === f ? 'bg-[#9E7FFF] text-black' : 'border border-[#2F2F2F] text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white'
                }`}>
                {f === 'all' ? 'All clients' : STATUS_STYLE[f].label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlumberClients.length === 0 && (
              <div className="col-span-full rounded-2xl border border-[#2F2F2F] bg-[#262626] p-10 text-center">
                <Users className="mx-auto h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm text-[#A3A3A3]">No clients in this view yet.</p>
              </div>
            )}
            {filteredPlumberClients.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="flex flex-col rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{c.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A3A3A3]"><MapPin className="h-3 w-3 shrink-0" /> {c.address}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-semibold text-[#9E7FFF]">{PLANS[c.plan].name} · R{PLANS[c.plan].price}</span>
                  <ServicePill client={c} />
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-[#A3A3A3]">
                  <p className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0 text-[#9E7FFF]" /><a href={`tel:${c.phone}`} className="hover:text-white">{c.phone}</a></p>
                  <p className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0 text-[#9E7FFF]" /><a href={`mailto:${c.email}`} className="truncate hover:text-white">{c.email}</a></p>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ', South Africa')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#2F2F2F] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#9E7FFF] hover:text-white">
                    <Route className="h-3 w-3 text-[#9E7FFF]" /> Directions
                  </a>
                  <button onClick={() => openJob(c)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#9E7FFF] px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#b39aff]">
                    <Timer className="h-3 w-3" /> Open job
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        {/* job flow card */}
        {jobClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Job card — {jobClient.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A3A3A3]"><MapPin className="h-3 w-3" /> {jobClient.address}</p>
                </div>
                <button onClick={closeJob} aria-label="Close job card" className="rounded-lg p-1 text-[#A3A3A3] hover:bg-[#171717] hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="mt-5 rounded-xl border border-[#2F2F2F] bg-[#171717] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#A3A3A3]"><Timer className="h-4 w-4 text-[#9E7FFF]" /> On-site stopwatch</div>
                  <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-semibold text-[#9E7FFF]">
                    {jobArrival ? (jobDone ? 'Finished' : 'Running') : 'Not started'}
                  </span>
                </div>
                <p className="mt-3 font-mono text-4xl font-bold tabular-nums text-white">
                  {String(Math.floor(elapsed / 3600)).padStart(2, '0')}:
                  {String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:
                  {String(elapsed % 60).padStart(2, '0')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#A3A3A3]">
                  <p>Arrival: <span className="text-white">{fmtTime(jobArrival ?? undefined)}</span></p>
                  <p>Done: <span className="text-white">{fmtTime(jobDone ?? undefined)}</span></p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={startJob} disabled={!!jobArrival}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#9E7FFF] px-3 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#b39aff] disabled:cursor-not-allowed disabled:opacity-40">
                    <Play className="h-3 w-3" /> {jobArrival ? 'Arrived' : 'Start — I have arrived'}
                  </button>
                  <button onClick={finishJob} disabled={!jobArrival || !!jobDone}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#10b981] px-3 py-2.5 text-xs font-semibold text-[#10b981] transition-colors hover:bg-[#10b981]/10 disabled:cursor-not-allowed disabled:opacity-40">
                    <Check className="h-3 w-3" /> Stop — work done
                  </button>
                </div>
              </div>

              <form onSubmit={saveJob} className="mt-5 space-y-4">
                <input value={jobWork} onChange={(e) => setJobWork(e.target.value)} placeholder="What work was done"
                  className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                <textarea value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} placeholder="Notes for the client (visible in their portal)" rows={3}
                  className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                {jobMsg && <p className={`text-sm ${jobMsg.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{jobMsg.text}</p>}
                <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">
                  Save job &amp; mark serviced
                </button>
              </form>
            </div>
          </div>
        )}

        <footer className="border-t border-[#2F2F2F] bg-[#262626] px-4 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[#A3A3A3] sm:flex-row">
            <p>© 2026 PlumbServ. All rights reserved.</p>
            <p>Made by <a href="https://dappit.io" target="_blank" rel="noopener" className="text-[#9E7FFF] hover:opacity-80">dappit.io</a></p>
          </div>
        </footer>
      </div>
    );
  }

  // =====================================================================
  // CLIENT PORTAL
  // =====================================================================
  if (view === 'client') {
    if (!clientLoggedIn) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#171717] px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2F2F2F] bg-[#262626] p-8">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-white"><Wrench className="h-7 w-7 text-[#9E7FFF]" /> PlumbServ</div>
            <p className="mt-2 text-center text-sm text-[#A3A3A3]">Client portal</p>
            <form onSubmit={handleClientLogin} className="mt-6 space-y-4">
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email used at signup" type="email"
                className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              {clientError && <p className="text-sm text-[#ef4444]">{clientError}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">Log in</button>
            </form>
            <p className="mt-4 text-center text-xs text-[#A3A3A3]">New here? <button onClick={() => setView('signup')} className="font-semibold text-[#9E7FFF] hover:underline">Sign up</button></p>
            <button onClick={() => setView('home')} className="mt-4 w-full text-center text-sm text-[#A3A3A3] hover:text-white">Back to site</button>
          </div>
        </div>
      );
    }
    const planInfo = clientRecord ? PLANS[clientRecord.plan] : null;
    return (
      <div className="min-h-screen bg-[#171717] text-white">
        <header className="border-b border-[#2F2F2F] bg-[#262626] px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-lg font-bold"><Wrench className="h-6 w-6 text-[#9E7FFF]" /> PlumbServ</button>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] sm:flex">
                <UserCircle className="h-4 w-4 text-[#9E7FFF]" /> {clientRecord?.name}
              </div>
              <button onClick={handleClientLogout} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#ef4444] hover:text-[#ef4444]">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-[#2F2F2F] bg-gradient-to-br from-[#262626] to-[#1f1f1f] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#A3A3A3]">Welcome back,</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{clientRecord?.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-semibold text-[#9E7FFF]">{planInfo?.name} plan · R{planInfo?.price}/m</span>
                  <StatusPill status={clientRecord?.status ?? 'pending'} />
                  {clientRecord && <ServicePill client={clientRecord} />}
                </div>
              </div>
              <button onClick={() => setClientTab('messages')} className="flex items-center gap-2 rounded-xl bg-[#9E7FFF] px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]">
                <MessageSquare className="h-4 w-4" /> Message the team
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Service visits', value: clientLogs.length, icon: History, color: 'text-[#38bdf8]' },
              { label: 'Referrals', value: referralCount, icon: Users, color: 'text-[#f472b6]' },
              { label: 'Cash balance', value: `R${referralBalance}`, icon: Wallet, color: 'text-[#10b981]' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#A3A3A3]">{s.label}</p>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
              { id: 'history' as const, label: 'Inspection notes', icon: History },
              { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
              { id: 'referrals' as const, label: 'Referrals', icon: Gift },
            ].map((t) => (
              <button key={t.id} onClick={() => setClientTab(t.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                  clientTab === t.id ? 'bg-[#9E7FFF] text-black' : 'border border-[#2F2F2F] text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white'
                }`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>

          {clientTab === 'overview' && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <h2 className="text-lg font-semibold">Your plan</h2>
                <p className="mt-1 text-sm text-[#A3A3A3]">{planInfo?.tagline}</p>
                <ul className="mt-4 space-y-3">
                  {planInfo?.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm text-[#A3A3A3]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                      <span>
                        <span className="block font-medium text-white">{f.text}</span>
                        {f.detail && <span className="mt-0.5 block text-xs leading-relaxed text-[#A3A3A3]">{f.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <h2 className="text-lg font-semibold">Your details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-[#9E7FFF]" /><div><p className="text-xs text-[#A3A3A3]">Email</p><p className="text-sm text-white">{clientRecord?.email}</p></div></div>
                  <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-[#9E7FFF]" /><div><p className="text-xs text-[#A3A3A3]">Phone</p><p className="text-sm text-white">{clientRecord?.phone}</p></div></div>
                  <div className="flex items-start gap-3 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 text-[#9E7FFF]" /><div><p className="text-xs text-[#A3A3A3]">Service address</p><p className="text-sm text-white">{clientRecord?.address}</p></div></div>
                </div>
              </div>
            </div>
          )}

          {clientTab === 'history' && (
            <div className="mt-6">
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[#9E7FFF]" /><h2 className="text-lg font-semibold">Monthly inspection notes</h2></div>
                <p className="mt-1 text-sm text-[#A3A3A3]">Everything our team noted while inspecting and working on your property.</p>
                {clientLogs.length === 0 ? (
                  <div className="mt-6 rounded-xl bg-[#171717] p-6 text-center"><History className="mx-auto h-8 w-8 text-[#A3A3A3]" /><p className="mt-3 text-sm text-[#A3A3A3]">No services recorded yet. Your first visit will appear here once completed.</p></div>
                ) : (
                  <div className="mt-6 space-y-0">
                    {clientLogs.map((l, i) => (
                      <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }} className="relative flex gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <span className="flex h-3 w-3 shrink-0 rounded-full bg-[#9E7FFF]" />
                          {i < clientLogs.length - 1 && <span className="mt-1 w-px flex-1 bg-[#2F2F2F]" />}
                        </div>
                        <div className="flex-1 rounded-xl border border-[#2F2F2F] bg-[#171717] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-white">{l.workDone}</p>
                            <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-medium text-[#9E7FFF]">{fmtDate(l.date)}</span>
                          </div>
                          {l.notes && <p className="mt-2 text-sm leading-relaxed text-[#A3A3A3]">{l.notes}</p>}
                          {(l.arrivalTime || l.doneTime || l.plumber) && (
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#A3A3A3]">
                              {l.plumber && <span className="flex items-center gap-1"><HardHat className="h-3 w-3 text-[#9E7FFF]" /> {l.plumber}</span>}
                              {l.arrivalTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#9E7FFF]" /> Arrived {fmtTime(l.arrivalTime)}</span>}
                              {l.doneTime && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[#10b981]" /> Done {fmtTime(l.doneTime)}</span>}
                              {l.durationMinutes !== undefined && <span className="flex items-center gap-1"><Timer className="h-3 w-3 text-[#9E7FFF]" /> {fmtDuration(l.durationMinutes)} on site</span>}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {clientTab === 'messages' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <div className="flex items-center gap-2"><Send className="h-5 w-5 text-[#9E7FFF]" /><h2 className="text-lg font-semibold">Send the team a message</h2></div>
                <p className="mt-1 text-sm text-[#A3A3A3]">Your message goes straight to the PlumbServ admin inbox — only you and the team can see it.</p>
                <form onSubmit={sendMessage} className="mt-4 space-y-3">
                  <input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Subject"
                    className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Your message" rows={5}
                    className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  {msgStatus && <p className={`text-sm ${msgStatus.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{msgStatus.text}</p>}
                  <button type="submit" disabled={msgSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-50">
                    <Send className="h-4 w-4" /> {msgSending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              </div>
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your sent messages</h3>
                  <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-semibold text-[#9E7FFF]">{clientMessages.length}</span>
                </div>
                {clientMessages.length === 0 ? (
                  <div className="mt-6 rounded-xl bg-[#171717] p-6 text-center"><Inbox className="mx-auto h-8 w-8 text-[#A3A3A3]" /><p className="mt-3 text-sm text-[#A3A3A3]">No messages yet. Anything you send will show here.</p></div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {clientMessages.map((m) => (
                      <div key={m.id} className="rounded-xl bg-[#171717] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{m.subject}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${m.read ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f59e0b]/15 text-[#f59e0b]'}`}>
                            {m.read ? 'Read' : 'Sent'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#A3A3A3]">{m.body}</p>
                        <p className="mt-2 text-xs text-[#A3A3A3]">{fmtDate(m.created)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {clientTab === 'referrals' && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#2F2F2F] bg-gradient-to-br from-[#262626] to-[#1f1f1f] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><Gift className="h-6 w-6 text-[#f472b6]" /><h2 className="text-xl font-bold">Refer friends, earn R100</h2></div>
                    <p className="mt-2 max-w-md text-sm text-[#A3A3A3]">For every friend who signs up for a PlumbServ plan using your referral link, you earn R100 cash towards your next subscription payment.</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#171717] p-5">
                    <p className="text-xs text-[#A3A3A3]">Your cash balance</p>
                    <p className="text-4xl font-bold text-[#10b981]">R{referralBalance}</p>
                    <p className="text-xs text-[#A3A3A3]">{referralCount} referral{referralCount === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3">
                    <Share2 className="h-4 w-4 shrink-0 text-[#9E7FFF]" />
                    <span className="truncate text-sm text-[#A3A3A3]">{window.location.origin}?ref={clientRecord?.id}</span>
                  </div>
                  <button onClick={copyReferralLink} className="flex items-center justify-center gap-2 rounded-xl bg-[#9E7FFF] px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
                <form onSubmit={submitReferral} className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input value={referralEmail} onChange={(e) => setReferralEmail(e.target.value)} placeholder="Friend email address" type="email"
                    className="flex-1 rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  <button type="submit" className="flex items-center justify-center gap-2 rounded-xl border border-[#2F2F2F] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#9E7FFF]">
                    <Mail className="h-4 w-4 text-[#9E7FFF]" /> Send invite
                  </button>
                </form>
                {referralMsg && <p className={`mt-3 text-sm ${referralMsg.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{referralMsg.text}</p>}
              </div>
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your referrals</h3>
                  <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-semibold text-[#f472b6]">{referralCount} total</span>
                </div>
                {clientReferrals.length === 0 ? (
                  <div className="mt-6 rounded-xl bg-[#171717] p-6 text-center"><Users className="mx-auto h-8 w-8 text-[#A3A3A3]" /><p className="mt-3 text-sm text-[#A3A3A3]">No referrals yet. Share your link or invite a friend by email to start earning.</p></div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {clientReferrals.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#171717] p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f472b6]/15"><Mail className="h-4 w-4 text-[#f472b6]" /></span>
                          <div><p className="text-sm font-medium text-white">{r.email}</p><p className="mt-0.5 text-xs text-[#A3A3A3]">Invited {fmtDate(r.date)}</p></div>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-3 py-1 text-xs font-semibold text-[#10b981]"><TrendingUp className="h-3 w-3" /> R100 earned</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        <footer className="border-t border-[#2F2F2F] bg-[#262626] px-4 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[#A3A3A3] sm:flex-row">
            <p>© 2026 PlumbServ. All rights reserved.</p>
            <p>Made by <a href="https://dappit.io" target="_blank" rel="noopener" className="text-[#9E7FFF] hover:opacity-80">dappit.io</a></p>
          </div>
        </footer>
      </div>
    );
  }

  // =====================================================================
  // SIGNUP
  // =====================================================================
  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-[#171717] text-white">
        <header className="border-b border-[#2F2F2F] bg-[#171717] px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-lg font-bold text-white"><Wrench className="h-6 w-6 text-[#9E7FFF]" /> PlumbServ</button>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 md:flex">
                <button onClick={() => setView('client')} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"><UserCircle className="h-4 w-4" /> Client login</button>
                <button onClick={() => setView('plumber')} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"><HardHat className="h-4 w-4" /> Plumber login</button>
                <button onClick={() => setView('dashboard')} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"><LayoutDashboard className="h-4 w-4" /> Owner login</button>
              </div>
              <MobileMenu open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)}
                items={[
                  { label: 'Client login', icon: <UserCircle className="h-4 w-4" />, onClick: () => setView('client') },
                  { label: 'Plumber login', icon: <HardHat className="h-4 w-4" />, onClick: () => setView('plumber') },
                  { label: 'Owner login', icon: <LayoutDashboard className="h-4 w-4" />, onClick: () => setView('dashboard') },
                ]} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-12">
          <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-3">
            <div className={`flex items-center gap-2 ${signupStep === 'details' ? 'text-[#9E7FFF]' : 'text-[#10b981]'}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${signupStep === 'details' ? 'bg-[#9E7FFF] text-black' : 'bg-[#10b981] text-black'}`}>
                {signupStep === 'details' ? '1' : <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-sm font-medium">Your details</span>
            </div>
            <span className="h-px w-10 bg-[#2F2F2F]" />
            <div className={`flex items-center gap-2 ${signupStep === 'payment' ? 'text-[#9E7FFF]' : 'text-[#A3A3A3]'}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${signupStep === 'payment' ? 'bg-[#9E7FFF] text-black' : 'bg-[#2F2F2F] text-[#A3A3A3]'}`}>2</span>
              <span className="text-sm font-medium">Payment setup</span>
            </div>
          </div>

          {signupStep === 'details' ? (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold sm:text-4xl">Choose your plan</h1>
                <p className="mx-auto mt-3 max-w-xl text-[#A3A3A3]">Pick the tier that fits your home. All plans are billed monthly via Netcash debit order.</p>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {(Object.keys(PLANS) as Plan[]).map((plan, i) => (
                  <TierCard key={plan} plan={plan} selected={selectedPlan === plan} onSelect={() => setSelectedPlan(plan)} index={i} />
                ))}
              </div>
              <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
                <div className="flex items-start gap-3">
                  <input id="terms" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-[#9E7FFF]" />
                  <label htmlFor="terms" className="text-sm text-[#A3A3A3]">
                    I have read and accept the{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="font-semibold text-[#9E7FFF] underline">Terms &amp; Conditions</button>.
                  </label>
                </div>
                <form onSubmit={handleSignup} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                      className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" type="email"
                      className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  </div>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number"
                    className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Service address" rows={2}
                    className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                  <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3.5 font-semibold text-black transition-transform hover:scale-[1.01]">
                    Continue to payment setup
                  </button>
                </form>
                {signupMsg && (
                  <div className={`mt-4 rounded-xl p-4 text-sm ${signupMsg.ok ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                    {signupMsg.text}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9E7FFF]/15">
                    <CreditCard className="h-5 w-5 text-[#9E7FFF]" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">Set up your debit order</h2>
                    <p className="text-sm text-[#A3A3A3]">{PLANS[selectedPlan].name} plan · R{PLANS[selectedPlan].price}/month via Netcash</p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-[#171717] p-5">
                  <p className="text-sm leading-relaxed text-[#A3A3A3]">
                    To activate your subscription, you will sign a <span className="font-semibold text-white">DebiCheck mandate</span> with
                    your bank. This authorises Netcash to debit <span className="font-semibold text-white">R{PLANS[selectedPlan].price}</span>{' '}
                    from your account on a monthly basis. The mandate is secure and managed through your banking app.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <button onClick={goToNetcash} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9E7FFF] py-3.5 font-semibold text-black transition-transform hover:scale-[1.01]">
                    <ExternalLink className="h-4 w-4" /> Sign mandate on Netcash
                  </button>
                  <p className="text-center text-xs text-[#A3A3A3]">You will be redirected to Netcash secure page to complete the mandate.</p>
                </div>
                {!NETCASH_CONFIG.live && (
                  <div className="mt-6 rounded-xl border border-dashed border-[#2F2F2F] bg-[#171717]/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">Sandbox mode — no Netcash account configured</p>
                    <p className="mt-2 text-sm text-[#A3A3A3]">
                      You are running without Netcash credentials, so the hosted page will not process real mandates. Use the button below to
                      simulate the webhook (mandate approved + first payment received) and see the full flow end-to-end.
                    </p>
                    <button onClick={simulateMandate} disabled={processingPayment}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#9E7FFF] py-3 text-sm font-semibold text-[#9E7FFF] transition-colors hover:bg-[#9E7FFF]/10 disabled:opacity-50">
                      {processingPayment ? 'Processing…' : 'Simulate mandate approval + first payment'}
                    </button>
                    {paymentMsg && <p className={`mt-3 text-sm ${paymentMsg.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{paymentMsg.text}</p>}
                  </div>
                )}
              </div>
              <button onClick={() => setSignupStep('details')} className="mt-6 flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to details
              </button>
            </div>
          )}
        </main>
        <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
      </div>
    );
  }

  // =====================================================================
  // ADMIN DASHBOARD
  // =====================================================================
  if (view === 'dashboard') {
    if (!loggedIn) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#171717] px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2F2F2F] bg-[#262626] p-8">
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-white"><Wrench className="h-7 w-7 text-[#9E7FFF]" /> PlumbServ</div>
            <p className="mt-2 text-center text-sm text-[#A3A3A3]">Owner dashboard</p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" type="email"
                className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              <input value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Password" type="password"
                className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              {authError && <p className="text-sm text-[#ef4444]">{authError}</p>}
              <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">Log in</button>
            </form>
            <button onClick={() => setView('home')} className="mt-4 w-full text-center text-sm text-[#A3A3A3] hover:text-white">Back to site</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#171717] text-white">
        <header className="border-b border-[#2F2F2F] bg-[#262626] px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold"><Wrench className="h-6 w-6 text-[#9E7FFF]" /> PlumbServ</div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <button onClick={openEmailComposer} className="flex items-center gap-2 rounded-xl bg-[#9E7FFF] px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]">
                  <Send className="h-4 w-4" /> Email clients
                </button>
                <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white">
                  <Download className="h-4 w-4" /> Export
                </button>
                <button onClick={loadData} className="rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white">Refresh</button>
                <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#ef4444] hover:text-[#ef4444]">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
              <MobileMenu open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)}
                items={[
                  { label: 'Email clients', icon: <Send className="h-4 w-4" />, onClick: openEmailComposer, primary: true },
                  { label: 'Export CSV', icon: <Download className="h-4 w-4" />, onClick: exportCSV },
                  { label: 'Refresh', icon: <LayoutDashboard className="h-4 w-4" />, onClick: loadData },
                  { label: 'Log out', icon: <LogOut className="h-4 w-4" />, onClick: handleLogout },
                ]} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total clients', value: clients.length, icon: Users, color: 'text-[#9E7FFF]' },
              { label: 'Service due', value: dueCount, icon: AlertTriangle, color: 'text-[#f59e0b]' },
              { label: 'Serviced', value: servicedCount, icon: Check, color: 'text-[#10b981]' },
              { label: 'Payments collected', value: paidCount, icon: CreditCard, color: 'text-[#38bdf8]' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#A3A3A3]">{s.label}</p>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <button onClick={openEmailComposer}
              className="flex items-center gap-4 rounded-2xl border border-[#9E7FFF]/40 bg-gradient-to-br from-[#262626] to-[#1f1f1f] p-5 text-left transition-all hover:border-[#9E7FFF] hover:shadow-[0_0_30px_rgba(158,127,255,0.2)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9E7FFF]"><Send className="h-5 w-5 text-black" /></span>
              <div>
                <p className="font-semibold text-white">Email clients</p>
                <p className="mt-0.5 text-xs text-[#A3A3A3]">All {clients.length} or pick individually with tick boxes.</p>
              </div>
            </button>
            <div className="flex items-center gap-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f472b6]/15"><Inbox className="h-5 w-5 text-[#f472b6]" /></span>
              <div>
                <p className="font-semibold text-white">Admin inbox</p>
                <p className="mt-0.5 text-xs text-[#A3A3A3]">{unreadCount} unread · {messages.length} total — private to you.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#38bdf8]/15"><Wrench className="h-5 w-5 text-[#38bdf8]" /></span>
              <div>
                <p className="font-semibold text-white">Ready to service</p>
                <p className="mt-0.5 text-xs text-[#A3A3A3]">{readyCount} clients waiting for a visit.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {(['all', 'pending', 'ready', 'serviced', 'paused'] as const).map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                  statusFilter === f ? 'bg-[#9E7FFF] text-black' : 'border border-[#2F2F2F] text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white'
                }`}>
                {f === 'all' ? 'All clients' : STATUS_STYLE[f].label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2F2F2F] bg-[#262626]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#2F2F2F] text-xs uppercase tracking-wider text-[#A3A3A3]">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Service cycle</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[#A3A3A3]">No clients yet. Share the QR code to start signing people up.</td></tr>
                )}
                {filteredClients.map((c) => {
                  const clientPayments = payments.filter((p) => p.client === c.id);
                  const hasPayment = clientPayments.length > 0;
                  const paid = clientPayments.some((p) => p.paid);
                  const clientLogs = logs.filter((l) => l.client === c.id);
                  const st = serviceState(c);
                  return (
                    <tr key={c.id} className="border-b border-[#2F2F2F]/50 last:border-0 hover:bg-[#171717]/50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A3A3A3]"><Mail className="h-3 w-3" /> {c.email}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A3A3A3]"><Phone className="h-3 w-3" /> {c.phone}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A3A3A3]"><MapPin className="h-3 w-3" /> {c.address}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#9E7FFF]/15 px-3 py-1 text-xs font-semibold text-[#9E7FFF]">{PLANS[c.plan].name} · R{PLANS[c.plan].price}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={c.status} />
                        {c.mandateActive && (
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-[#10b981]"><ShieldCheck className="h-3 w-3" /> Mandate active</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <ServicePill client={c} />
                        {st === 'overdue' && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-[#ef4444]"><AlertTriangle className="h-3 w-3" /> Book a visit now</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasPayment ? (
                          <button onClick={() => togglePayment(clientPayments[0].id, !paid)}
                            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              paid ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#ef4444]/15 text-[#ef4444]'
                            }`}>
                            <span className={`relative h-4 w-7 rounded-full transition-colors ${paid ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}>
                              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${paid ? 'left-3.5' : 'left-0.5'}`} />
                            </span>
                            {paid ? 'Paid' : 'Unpaid'}
                          </button>
                        ) : (
                          <span className="text-xs text-[#A3A3A3]">No payment on file</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => openLogModal(c)} className="flex items-center gap-1.5 rounded-lg border border-[#2F2F2F] px-3 py-1.5 text-xs text-[#A3A3A3] transition-colors hover:border-[#9E7FFF] hover:text-white">
                            <ClipboardList className="h-3 w-3" /> {clientLogs.length} log{clientLogs.length === 1 ? '' : 's'}
                          </button>
                          <button onClick={() => togglePause(c)} title={c.status === 'paused' ? 'Resume client' : 'Pause client'}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                              c.status === 'paused'
                                ? 'border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10'
                                : 'border-[#2F2F2F] text-[#A3A3A3] hover:border-[#f59e0b] hover:text-[#f59e0b]'
                            }`}>
                            {c.status === 'paused' ? <><Play className="h-3 w-3" /> Resume</> : <><Pause className="h-3 w-3" /> Pause</>}
                          </button>
                          <button onClick={() => deleteClient(c)} title="Delete client"
                            className="flex items-center gap-1.5 rounded-lg border border-[#2F2F2F] px-3 py-1.5 text-xs text-[#A3A3A3] transition-colors hover:border-[#ef4444] hover:text-[#ef4444]">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* admin inbox */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-[#f472b6]" />
                <h2 className="text-lg font-semibold">Admin inbox</h2>
              </div>
              <span className="rounded-full bg-[#f472b6]/15 px-3 py-1 text-xs font-semibold text-[#f472b6]">{unreadCount} unread</span>
            </div>
            <p className="mt-1 text-sm text-[#A3A3A3]">Messages sent by clients. Only you can see this inbox — clients never see each other's messages.</p>
            {messages.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] p-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm text-[#A3A3A3]">No client messages yet.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-2xl border p-5 ${m.read ? 'border-[#2F2F2F] bg-[#262626]' : 'border-[#f472b6]/40 bg-[#262626]'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{m.subject}</p>
                        <p className="mt-0.5 text-xs text-[#A3A3A3]">{m.clientName} · {m.clientEmail} · {fmtDate(m.created)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${m.read ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f59e0b]/15 text-[#f59e0b]'}`}>
                          {m.read ? 'Read' : 'Unread'}
                        </span>
                        <button onClick={() => markMessageRead(m, !m.read)}
                          className="rounded-lg border border-[#2F2F2F] px-3 py-1.5 text-xs text-[#A3A3A3] transition-colors hover:border-[#9E7FFF] hover:text-white">
                          {m.read ? 'Mark unread' : 'Mark read'}
                        </button>
                        <a href={`mailto:${m.clientEmail}?subject=${encodeURIComponent('Re: ' + m.subject)}`}
                          className="flex items-center gap-1.5 rounded-lg bg-[#9E7FFF] px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]">
                          <Mail className="h-3 w-3" /> Reply
                        </a>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#A3A3A3]">{m.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* email composer modal */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Email clients</h2>
                <button onClick={() => setEmailModalOpen(false)} aria-label="Close" className="text-[#A3A3A3] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEmailMode('pick')} className={`rounded-full px-4 py-1.5 text-sm ${emailMode === 'pick' ? 'bg-[#9E7FFF] text-black' : 'border border-[#2F2F2F] text-[#A3A3A3]'}`}>Pick clients</button>
                <button onClick={() => setEmailMode('all')} className={`rounded-full px-4 py-1.5 text-sm ${emailMode === 'all' ? 'bg-[#9E7FFF] text-black' : 'border border-[#2F2F2F] text-[#A3A3A3]'}`}>All clients</button>
              </div>
              {emailMode === 'pick' && (
                <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-[#2F2F2F] bg-[#171717] p-3">
                  {clients.length === 0 && <p className="text-sm text-[#A3A3A3]">No clients to email yet.</p>}
                  {clients.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#262626]">
                      <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleEmail(c.email)} className="h-4 w-4 accent-[#9E7FFF]" />
                      <span className="text-sm text-white">{c.name}</span>
                      <span className="ml-auto text-xs text-[#A3A3A3]">{c.email}</span>
                    </label>
                  ))}
                </div>
              )}
              <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject"
                className="mt-4 w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Message" rows={4}
                className="mt-3 w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
              <button onClick={sendEmail} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">
                <Send className="h-4 w-4" /> Open in email app
              </button>
            </div>
          </div>
        )}

        {/* service log modal */}
        {logClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Log service — {logClient.name}</h2>
                <button onClick={() => setLogClient(null)} aria-label="Close" className="text-[#A3A3A3] hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={submitLog} className="mt-4 space-y-4">
                <input value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} type="date"
                  className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white focus:border-[#9E7FFF] focus:outline-none" />
                <input value={logForm.workDone} onChange={(e) => setLogForm({ ...logForm, workDone: e.target.value })} placeholder="Work done"
                  className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                <textarea value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} placeholder="Notes" rows={3}
                  className="w-full rounded-xl border border-[#2F2F2F] bg-[#171717] px-4 py-3 text-sm text-white placeholder-[#A3A3A3] focus:border-[#9E7FFF] focus:outline-none" />
                {logMsg && <p className={`text-sm ${logMsg.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{logMsg.text}</p>}
                <button type="submit" className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]">Save service log</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // HOME — QR landing page
  // =====================================================================
  return (
    <div className="min-h-screen bg-[#171717] text-white">
      <header className="border-b border-[#2F2F2F] bg-[#171717] px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold"><Wrench className="h-6 w-6 text-[#9E7FFF]" /> PlumbServ</div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <button onClick={() => setView('client')} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"><UserCircle className="h-4 w-4" /> Client login</button>
              <button onClick={() => setView('signup')} className="rounded-xl bg-[#9E7FFF] px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]">Sign up</button>
              <button onClick={() => setView('dashboard')} className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-4 py-2 text-sm text-[#A3A3A3] hover:border-[#9E7FFF] hover:text-white"><LayoutDashboard className="h-4 w-4" /> Owner</button>
            </div>
            <MobileMenu open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)}
              items={[
                { label: 'Client login', icon: <UserCircle className="h-4 w-4" />, onClick: () => setView('client') },
                { label: 'Sign up', icon: <Star className="h-4 w-4" />, onClick: () => setView('signup'), primary: true },
                { label: 'Owner', icon: <LayoutDashboard className="h-4 w-4" />, onClick: () => setView('dashboard') },
              ]} />
          </div>
        </div>
      </header>

      <main>
        {/* hero — QR arrival */}
        <section className="relative overflow-hidden px-4 py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f1f] via-[#171717] to-[#171717]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2F2F2F] bg-[#262626] px-4 py-1.5 text-xs text-[#A3A3A3]">
                  <QrCode className="h-3 w-3 text-[#9E7FFF]" /> You scanned our QR code — welcome
                </span>
                <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                  Preventative plumbing maintenance, on a subscription
                </h1>
                <p className="mt-5 max-w-xl text-lg text-[#A3A3A3]">
                  PlumbServ looks after your geyser, pipes, drains and toilets and catches the leaks before they even start the first drip.
                  It is the perfect plan for homes with wooden floors that cannot afford a flooding.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => setView('signup')} className="rounded-xl bg-[#9E7FFF] px-6 py-3 font-semibold text-black transition-transform hover:scale-[1.02]">Sign up</button>
                  <a href="tel:0645875808" className="flex items-center gap-2 rounded-xl border border-[#2F2F2F] px-6 py-3 font-semibold text-white transition-colors hover:border-[#9E7FFF]">
                    <Phone className="h-4 w-4 text-[#9E7FFF]" /> 064 587 5808
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#A3A3A3]">
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> 21 year plumbing experience</span>
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Monthly schedule</span>
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Simple debit order, no invoicing needed</span>
                  <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#10b981]" /> Johannesburg South</span>
                </div>
              </div>

              {/* advertising panel */}
              <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-8">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[#9E7FFF]" />
                  <h2 className="text-lg font-semibold">What we do</h2>
                </div>
                <ul className="mt-6 space-y-4">
                  {[
                    { title: 'Preventative care', detail: 'Early detection of leaks and corrosion before they become costly emergencies. Blocked drains are fixed when they actually block.' },
                    { title: 'Geyser protection', detail: 'Rust-prevention maintenance and toilet mechanism replacements included in your tier.' },
                    { title: 'Simple monthly billing', detail: 'One debit order via Netcash. No surprise invoices, just predictable flat monthly pricing.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#10b981]" />
                      <span>
                        <span className="block font-medium text-white">{item.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-[#A3A3A3]">{item.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* savings pitch */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-[#2F2F2F] bg-[#262626] p-8 sm:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f472b6]/15 px-4 py-1.5 text-xs font-semibold text-[#f472b6]">
                    <Droplets className="h-3 w-3" /> Why prevention pays
                  </span>
                  <h2 className="mt-5 text-3xl font-bold sm:text-4xl">A small monthly fee beats a flooded floor</h2>
                  <p className="mt-4 text-[#A3A3A3]">
                    A burst geyser or a slow hidden leak does not announce itself. By the time you see the water, it has already soaked into
                    your wooden floors, ceilings and cupboards. A single flood repair can run into tens of thousands of rands — replacing
                    timber flooring, skirting, ceilings, cabinetry and repainting.
                  </p>
                  <p className="mt-4 text-[#A3A3A3]">
                    PlumbServ visits your home every month, checks the geyser, valves, pipes, toilets and drains, and catches the small faults
                    before they turn into a claim. You pay one predictable debit order, and you stop paying for emergencies.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Droplets, title: 'Flood damage', detail: 'A burst geyser or pipe soaks wooden floors, ceilings and cupboards — often tens of thousands of rands to repair.', tone: 'text-[#ef4444]' },
                    { icon: Home, title: 'Wood floor damage', detail: 'Timber flooring swells and warps the moment it gets wet. Replacement means lifting and re-laying the whole room.', tone: 'text-[#f59e0b]' },
                    { icon: ShieldCheck, title: 'Monthly inspection', detail: 'We check the geyser, valves, pipes, toilets and drains every month and fix small faults before they grow.', tone: 'text-[#10b981]' },
                    { icon: Wallet, title: 'One flat fee', detail: 'From R376 a month on a simple Netcash debit order. No invoices, no surprise call-out bills.', tone: 'text-[#9E7FFF]' },
                  ].map((card) => (
                    <div key={card.title} className="rounded-2xl border border-[#2F2F2F] bg-[#171717] p-5">
                      <card.icon className={`h-6 w-6 ${card.tone}`} />
                      <p className="mt-3 font-semibold text-white">{card.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#A3A3A3]">{card.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* areas marquee */}
        <AreasMarquee />

        {/* plans */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Three plans, one standard</h2>
              <p className="mx-auto mt-3 max-w-xl text-[#A3A3A3]">All billed monthly via Netcash debit order. Pick a tier below to sign up.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {(Object.keys(PLANS) as Plan[]).map((plan, i) => (
                <TierCard key={plan} plan={plan} selected={selectedPlan === plan} onSelect={() => { setSelectedPlan(plan); setView('signup'); }} index={i} cta={`Choose ${PLANS[plan].name}`} />
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#2F2F2F] bg-[#262626] p-6 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9E7FFF]/15"><ChevronRight className="h-5 w-5 text-[#9E7FFF]" /></span>
                <div>
                  <p className="font-semibold text-white">Ready to protect your home?</p>
                  <p className="mt-0.5 text-sm text-[#A3A3A3]">Sign up in two steps — your details, then your Netcash debit order.</p>
                </div>
              </div>
              <button onClick={() => setView('signup')} className="rounded-xl bg-[#9E7FFF] px-6 py-3 font-semibold text-black transition-transform hover:scale-[1.02]">Sign up</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2F2F2F] bg-[#262626] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[#A3A3A3] sm:flex-row">
          <div className="flex items-center gap-2 font-bold text-white"><Wrench className="h-5 w-5 text-[#9E7FFF]" /> PlumbServ</div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="tel:0645875808" className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-[#9E7FFF]" /> 064 587 5808</a>
            <a href="mailto:Plumb0Serv@gmail.com" className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-[#9E7FFF]" /> Plumb0Serv@gmail.com</a>
          </div>
          <p className="text-xs">© 2026 PlumbServ · Made by <a href="https://dappit.io" target="_blank" rel="noopener" className="text-[#9E7FFF] hover:opacity-80">dappit.io</a></p>
        </div>
      </footer>
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
