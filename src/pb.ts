import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_PB_URL);

export type Plan = 'bronze' | 'silver' | 'gold';

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: Plan;
  status: 'pending' | 'ready' | 'serviced' | 'paused';
  termsAccepted: boolean;
  termsVersion: number;
  mandateActive?: boolean;
  mandateDate?: string;
  waitingPeriodEnds?: string;
  lastServiced?: string;
  created: string;
};

export type Payment = {
  id: string;
  client: string;
  amount: number;
  month: string;
  paid: boolean;
  created: string;
};

export type ServiceLog = {
  id: string;
  client: string;
  date: string;
  workDone: string;
  notes: string;
  arrivalTime?: string;
  doneTime?: string;
  durationMinutes?: number;
  plumber?: string;
  created: string;
};

export type Referral = {
  id: string;
  referrer: string;
  name: string;
  email: string;
  date: string;
  created: string;
};

export type Plumber = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  status: 'active' | 'on-leave' | 'inactive';
  pin: string;
  created: string;
};

export type Message = {
  id: string;
  client: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  body: string;
  read: boolean;
  created: string;
};

export type PlanFeature = { text: string; detail?: string };

export const PLANS: Record<Plan, { name: string; price: number; tagline: string; features: PlanFeature[] }> = {
  bronze: {
    name: 'Bronze',
    price: 376,
    tagline: 'Essential protection for every home',
    features: [
      { text: 'Monthly preventative plumbing inspection', detail: 'A full check of your plumbing system every month to catch issues early.' },
      { text: 'Geyser rust-prevention with anode replacement', detail: 'Inspection, valve check, flushing and sacrificial anode replacement to extend geyser life.' },
      { text: 'Toilet mechanism replacement', detail: 'Faulty cistern float and flush valves replaced with standard components.' },
      { text: 'Discounted work on work outside maintenance scope', detail: 'Reduced rates on any repair or maintenance work that falls outside your plan benefits.' },
      { text: '1 monthly call-out', detail: 'One attendance per calendar month included in your plan.' },
      { text: '30% repair material credit', detail: 'Once a month, get 30% of your fee back as a credit on qualifying repair parts.' },
    ],
  },
  silver: {
    name: 'Silver',
    price: 485,
    tagline: 'More coverage, priority service',
    features: [
      { text: 'Everything in Bronze', detail: 'All Bronze benefits included, plus the upgrades below.' },
      { text: '15% discounted work', detail: 'Save 15% on all qualifying repair and maintenance work.' },
      { text: 'Priority scheduling', detail: 'Your calls are moved ahead of standard bookings.' },
      { text: '×2 rotor root-cutting drain services per year', detail: 'Two annual drain services using rotor root-cutting to clear roots and stubborn blockages.' },
      { text: '2 monthly call-outs', detail: 'Two attendances per calendar month included in your plan.' },
      { text: 'Geyser maintenance every 24 months', detail: 'Rust-prevention care for your geyser at a longer, lower-cost interval.' },
    ],
  },
  gold: {
    name: 'Gold',
    price: 621,
    tagline: 'Our most complete protection',
    features: [
      { text: 'Everything in Silver', detail: 'All Silver benefits included, plus the upgrades below.' },
      { text: '20% discounted work', detail: 'Save 20% on all qualifying repair and maintenance work.' },
      { text: 'Same-day priority service', detail: 'We aim to attend on the same day wherever possible.' },
      { text: 'Extensive pipe and rust care', detail: 'More comprehensive care across your plumbing system, including deeper pipe and rust protection.' },
      { text: '3 monthly call-outs', detail: 'Three attendances per calendar month included in your plan.' },
      { text: 'Extensive geyser component replacements and servicing', detail: 'More thorough servicing and replacement of geyser components to keep it running reliably.' },
    ],
  },
};
