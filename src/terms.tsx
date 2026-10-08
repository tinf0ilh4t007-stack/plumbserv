import React from 'react';
import { X } from 'lucide-react';

export const TERMS_VERSION = '2026-01';

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: '1. Consumer Protection Act Notice — Your Rights',
    body:
      'The Service Provider draws your attention to clauses that may limit liability or affect your rights: Clause 24 (Limitation of Liability), Clause 8 (Declined Repairs), and Clause 17 (Access & Reinstatement). You have the right to receive services performed with reasonable care and skill (Section 54 of the CPA). You have the right to cancel within 5 business days of signing without penalty (Section 16 – Cooling-Off Period) where the agreement was concluded as a result of direct marketing. Nothing in this Agreement excludes rights that cannot lawfully be excluded under the CPA.',
  },
  {
    title: '2. Nature of the Agreement',
    body:
      'This is a preventative plumbing maintenance subscription. It assists with ongoing maintenance, early identification of plumbing issues, and selected repair benefits. It is not an insurance policy, maintenance-free guarantee, replacement guarantee, or extended warranty. The Service Provider does not guarantee that plumbing failures, leaks, blockages, corrosion, or equipment failures will never occur.',
  },
  {
    title: '3. Acceptance & Cooling-Off',
    body:
      'You accept this Agreement by electronically accepting it, completing the online subscription, signing a written application, or paying the first Subscription Fee. Electronic acceptance has the same force as a handwritten signature. If this Agreement was concluded as a result of direct marketing, you may cancel within 5 business days of signing, without penalty or reason, by notifying the Service Provider in writing.',
  },
  {
    title: '4. Service Tiers & Changes',
    body:
      'You will be assigned a Service Tier (Bronze, Silver, or Gold) based on your selection. Your monthly Subscription Fee is confirmed in writing before your first payment. You may upgrade or downgrade at any time by written request; changes take effect on the first day of the next calendar month.',
  },
  {
    title: '5. Waiting Period',
    body:
      'A Waiting Period of 30 calendar days applies from the Effective Date. Subscription Benefits are not available during this period unless expressly stated in writing. The Waiting Period applies to all existing plumbing conditions that existed before its expiry. Emergency attendance during the Waiting Period is available at discounted subscriber rates, subject to availability.',
  },
  {
    title: '6. Pre-Existing Conditions',
    body:
      'The Service Provider has not inspected the Property before commencement unless an inspection was specifically arranged. Plumbing systems may contain pre-existing defects, wear, corrosion, blockages, or non-compliant installations. The Service Provider is not responsible for repairing or covering the cost of pre-existing defects solely because a Subscription has commenced. Where pre-existing defects are identified, recommended repairs will be separately quoted.',
  },
  {
    title: '7. Declined Repairs — Clear Warning',
    body:
      'Where the Service Provider recommends a repair outside the Subscription Benefits, you will receive a clear written quote, an explanation of why the work is recommended, a warning of the risks of not proceeding, and at least 7 calendar days to consider the recommendation. If you decline recommended work, you accept full responsibility for any deterioration, failure, or damage arising from that decision. The Service Provider is not liable for loss or damage resulting from declined recommended repairs.',
  },
  {
    title: '8. Monthly Call-Out Benefits',
    body:
      'Monthly call-out allowances are: Bronze 1, Silver 2, Gold 3 per calendar month. A call-out includes attendance to investigate, inspect, diagnose, or perform qualifying maintenance or repairs. Multiple issues attended to during the same visit may be treated as a single call-out. Unused monthly call-outs expire at the end of each calendar month and do not accumulate, roll over, convert into credits, or become refundable.',
  },
  {
    title: '9. Repair Material Credit',
    body:
      'Once during each calendar month you are entitled to a Repair Material Credit equal to 30% of your monthly Subscription Fee, excluding VAT, applied to qualifying repair materials supplied and installed by the Service Provider. The credit does not apply to labour, call-out allowances, delivery, after-hours charges, emergency fees, supplier surcharges, municipal charges, or third-party costs. Unused credit expires at the end of the calendar month and is not refundable or transferable.',
  },
  {
    title: '10. Geyser Rust-Prevention Service',
    body:
      'Preventative geyser maintenance is provided at the intervals applicable to your tier: Bronze 1, Silver 2, Gold 3 per 24 months. This may include inspection, checking for visible corrosion or leaks, valve inspection, flushing, and sacrificial anode inspection where the design permits. This service is preventative only and does not guarantee the continued operation, lifespan, or future performance of the geyser. Existing corrosion, internal tank deterioration, electrical faults, or catastrophic tank failure remain excluded.',
  },
  {
    title: '11. Toilet Mechanism Replacement',
    body:
      'Faulty toilet cistern mechanisms are replaced using standard components where included in your tier: Bronze 1, Silver 2, Gold 3 per 12 months. Covered mechanisms include standard float valves, inlet/outlet valves, flush mechanisms, and seals. Cosmetic parts, ceramic components, concealed cisterns requiring structural access, and electronic or imported specialty systems are excluded unless otherwise agreed.',
  },
  {
    title: '12. Acoustic Leak Detection',
    body:
      'Where a concealed leak is reasonably suspected, non-invasive acoustic leak detection may be performed. This is an investigative service only and does not include repair work. Detection cannot be guaranteed in every circumstance. This benefit does not include thermal imaging, CCTV pipe inspections, excavation, or destructive investigation of any kind.',
  },
  {
    title: '13. Drain Clearing Services',
    body:
      'Drain clearing is provided only where an actual blockage, restriction, or drainage fault exists. The Service Provider does not perform routine mechanical drain cleaning as preventative maintenance, as this may accelerate wear and reduce the service life of older drainage systems. Root intrusion removal may be performed where reasonably accessible. Permanent repair of damaged drainage systems, collapsed pipes, and civil works remain excluded unless separately quoted.',
  },
  {
    title: '14. After-Hours & Emergency Services',
    body:
      'Subscription Benefits apply only during normal operating hours (Monday to Friday, 08:00 to 17:00, excluding public holidays) unless expressly stated otherwise. Emergency services outside these hours are not included within the standard monthly Subscription, but discounted subscriber rates apply where available. Availability cannot be guaranteed and depends on technician availability and operational capacity.',
  },
  {
    title: '15. Subscriber Responsibilities',
    body:
      'You must keep all information true, accurate, and up to date; provide safe and timely access to the Property; ensure a responsible adult (18+) is present during scheduled visits; notify the Service Provider promptly of any plumbing fault; take reasonable steps to minimise further damage (including shutting off the water supply); and not misuse or tamper with plumbing installations.',
  },
  {
    title: '16. Access & Structural Reinstatement',
    body:
      'The Service Provider is not responsible for delays caused by locked premises, security restrictions, absence of an authorised representative, unsecured pets, or unsafe conditions. Where plumbing is concealed behind walls, ceilings, or flooring, the Service Provider is not responsible for creating access unless included in your plan. Reinstatement of walls, ceilings, floors, tiles, paintwork, and decorative finishes after access work remains excluded unless expressly agreed in writing.',
  },
  {
    title: '17. Appointments & Missed Visits',
    body:
      'Services are provided by prior appointment. Estimated arrival times are estimates only and are not guaranteed. You must provide at least 24 hours notice to cancel or reschedule. Where the Service Provider attends at the agreed time and cannot gain access through no fault of the Service Provider, the appointment is a missed appointment. Repeated missed appointments may incur a reasonable missed appointment fee.',
  },
  {
    title: '18. Fees, Payment & Billing',
    body:
      'You must pay the monthly Subscription Fee by debit order (via Netcash) or another approved method. Benefits remain available only while your account is active and payments are in good standing. Where a payment is unsuccessful, the Service Provider may attempt to collect the outstanding amount again. You must notify the Service Provider of any changes to banking or contact details. The Service Provider may suspend benefits where fees remain unpaid, subject to consumer protection legislation.',
  },
  {
    title: '19. Price Adjustments',
    body:
      'The Service Provider may review and adjust the monthly Subscription Fee from time to time to reflect increases in operating costs, inflation, supplier pricing, labour, fuel, municipal tariffs, or other reasonable expenses. Not less than 30 calendar days prior written notice will be given. Should you not wish to continue under the revised fee, you may cancel before the revised pricing becomes effective, without penalty.',
  },
  {
    title: '20. Suspension of Services',
    body:
      'The Service Provider may suspend Subscription Benefits where fees remain unpaid, payments repeatedly fail, you materially breach this Agreement, you refuse reasonable access, fraudulent or unlawful conduct is suspected, conditions present an unreasonable safety risk, or continued service would breach any law. Where reasonably practicable, you will be notified of the reason and given an opportunity to remedy the breach.',
  },
  {
    title: '21. Complaints & Escalation',
    body:
      'If you are dissatisfied with any aspect of the service, you may lodge a complaint by contacting our customer service team. You will receive an acknowledgement within 2 Business Days and a formal response within 10 Business Days. If unsatisfied, you may escalate to management. If the matter remains unresolved, you may refer the dispute to the National Consumer Commission (www.thencc.gov.za) or the Consumer Goods and Services Ombud (www.cgso.org.za).',
  },
  {
    title: '22. Cancellation & Termination',
    body:
      'You may terminate by providing not less than 1 calendar month written notice, with no penalty after the initial 6-month period. Where you have received major Subscription Benefits and terminate within the first 6 months, a fair and reasonable clawback fee may apply, capped at a maximum of two months Subscription Fees. The Service Provider may terminate immediately for material breach, repeated non-payment, false information, abusive or unlawful conduct, or deliberate damage.',
  },
  {
    title: '23. Limitation of Liability',
    body:
      'The Service Provider is only liable for direct physical loss or damage proven to have been caused solely by its gross negligence or wilful misconduct. Total aggregate liability shall not exceed the total Subscription Fees paid during the 12 months preceding the claim. Nothing excludes liability for fraud, gross negligence, death or personal injury caused by negligence, or any liability that cannot lawfully be excluded under the Consumer Protection Act. The Service Provider is not liable for indirect, consequential, or special damages.',
  },
  {
    title: '24. Force Majeure',
    body:
      'Neither party is liable for delay or failure caused by circumstances beyond reasonable control, including floods, storms, fire, epidemics, government action, civil unrest, strikes, municipal or water supply interruptions, electricity failures or load shedding, supplier shortages, transport disruptions, and road closures. Where the Service Provider is prevented from performing its obligations due to a Force Majeure event, the Subscription Benefits are suspended for the duration of the event. The Subscriber will not be forced to pay the monthly Subscription Fee for any period during which the Service Provider is unable to provide the Subscription Benefits as a result of such event.',
  },
  {
    title: '25. System & Web Application Outages',
    body:
      'The Service Provider relies on its web application and online systems to manage client records, schedule appointments, and dispatch technicians. Where the web application or any supporting system is unavailable, offline, or otherwise inaccessible due to a technical failure, server outage, software error, hosting or connectivity disruption, cyber incident, or any event beyond the reasonable control of the Service Provider, the Service Provider may be unable to access client details, service histories, and appointment schedules. In such circumstances, the Service Provider is excused from its performance obligations for the duration of the outage, and any resulting delay in servicing clients is not a breach of this Agreement. The Service Provider will use reasonable efforts to restore access to its systems as promptly as practicable. Where the Service Provider is unable to provide the Subscription Benefits as a result of such an outage, the Subscriber will not be required to pay the monthly Subscription Fee for the period during which the Service Provider was unable to perform.',
  },
  {
    title: '26. POPIA, Privacy & Records',
    body:
      'The Service Provider collects, processes, stores, and uses your personal information only to the extent reasonably necessary to administer this Agreement, provide benefits, communicate with you, and comply with legal obligations, in accordance with the Protection of Personal Information Act, 2013 (POPIA). Service visits may be documented by photographs, videos, and written reports for quality control and dispute resolution. Personal information is not sold or disclosed to unrelated third parties except where required by law or reasonably necessary to perform services. Records may be retained for up to 7 years.',
  },
  {
    title: '27. Dispute Resolution & Governing Law',
    body:
      'The parties shall use reasonable efforts to resolve disputes through good-faith negotiations before formal proceedings. Where unresolved, either party may refer the dispute to the National Consumer Commission, the Consumer Goods and Services Ombud, mediation or arbitration, or a court of competent jurisdiction. This Agreement is governed by the laws of the Republic of South Africa. If any provision is found unlawful or unenforceable, the remaining provisions remain in full force.',
  },
  {
    title: '28. General Provisions',
    body:
      'This Agreement constitutes the entire agreement between the parties. No amendment is valid unless recorded in writing and accepted by both parties. You may not assign or transfer rights without prior written consent. Electronic signatures, acceptance, and records have the same legal force as handwritten signatures. Clauses relating to payment, liability, indemnities, privacy, record retention, and dispute resolution survive termination. This Agreement becomes legally binding upon acceptance and remains in force until validly cancelled or terminated.',
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Why is there a 30-day waiting period?',
    a:
      'The waiting period exists because this is a preventative maintenance subscription, not an insurance policy. It prevents the plan from being used to claim benefits for plumbing conditions that already existed before the subscription began. After the 30 calendar days, covered benefits become available as described in your Service Tier.',
  },
  {
    q: 'What happens if I need a plumber during the waiting period?',
    a:
      'You can still request emergency attendance during the waiting period, and it will be provided at discounted subscriber rates, subject to availability. Standard Subscription Benefits are not available during this period unless expressly stated in writing.',
  },
  {
    q: 'Does the waiting period apply to new plumbing issues?',
    a:
      'No. The waiting period applies to existing plumbing conditions that existed before its expiry. If a genuinely new plumbing issue arises after your subscription begins, it is treated in line with the terms of your plan. If you are unsure whether an issue is pre-existing, contact our team and we will assess it on its merits.',
  },
  {
    q: 'Can the waiting period be waived?',
    a:
      'The waiting period may only be waived where expressly stated in writing. If a waiver applies to your plan, it will be confirmed in your subscription documents before your first payment.',
  },
];

export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[#2F2F2F] bg-[#262626]">
        <div className="flex items-center justify-between border-b border-[#2F2F2F] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Plumbing Maintenance Service Agreement</h2>
          <button onClick={onClose} aria-label="Close terms" className="rounded-lg p-1 text-[#A3A3A3] hover:bg-[#171717] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="rounded-xl bg-[#171717] p-4 text-sm text-[#A3A3A3]">
            <p className="font-semibold text-white">Schreuders Plumbing (Pty) Ltd — Residential Subscription Plan</p>
            <p className="mt-2">
              This Agreement is between Schreuders Plumbing (Pty) Ltd (the "Service Provider") and the Subscriber whose
              details are recorded during the online application process. By electronically accepting this Agreement,
              completing the online registration process, or paying the first Subscription Fee, the Subscriber confirms
              they have read, understood, and agree to be legally bound by these terms.
            </p>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A3A3A3]">{s.body}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[#2F2F2F] bg-[#171717] p-5">
            <h3 className="text-base font-semibold text-white">Waiting-Period FAQ</h3>
            <div className="mt-4 space-y-4">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <p className="text-sm font-semibold text-[#9E7FFF]">{f.q}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#A3A3A3]">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[#2F2F2F] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#9E7FFF] py-3 font-semibold text-black transition-transform hover:scale-[1.01]"
          >
            I have read the Terms & Conditions
          </button>
        </div>
      </div>
    </div>
  );
}
