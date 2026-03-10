// src/pages/LandingPage.tsx — AI Recruitment with "Softly" Design Aesthetic
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { GrainOverlay } from '../components/shared/GrainOverlay';
import s from './SoftlyLanding.module.css';

/* ──────────────────────────────────────────
   Scroll-Reveal Wrapper
   ────────────────────────────────────────── */
const Reveal = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${s.sectionReveal} ${visible ? s.visible : ''} ${className}`}>
      {children}
    </div>
  );
};

/* ──────────────────────────────────────────
   FAQ Accordion Item
   ────────────────────────────────────────── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.faqItem}>
      <div className={s.faqHeader} onClick={() => setOpen(!open)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setOpen(!open); }}>
        <span className={s.faqQuestion}>{q}</span>
        <span className={`${s.faqIcon} ${open ? s.faqIconOpen : ''}`}>+</span>
      </div>
      <div className={`${s.faqBody} ${open ? s.faqBodyOpen : ''}`}>
        <p className={s.faqAnswer}>{a}</p>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────
   DATA
   ────────────────────────────────────────── */
const scenarios = [
  { time: 'Step 1', text: 'Post a job in under 60 seconds' },
  { time: 'Step 2', text: 'AI screens & scores every resume' },
  { time: 'Step 3', text: 'Candidates flow through your pipeline' },
  { time: 'Step 4', text: 'Visual workflows auto-advance stages' },
  { time: 'Step 5', text: 'Hire the best — backed by data' },
];

const testimonials = [
  { date: 'Feb 12, 2026', text: 'We cut our time-to-hire by 60%. The AI screening alone saved our recruiting team 25 hours per week. It\'s not just software — it\'s a competitive advantage.', name: 'Sarah K., VP Talent' },
  { date: 'Jan 28, 2026', text: 'The visual workflow builder changed everything. We went from spreadsheet chaos to an elegant pipeline in one afternoon. Our hiring managers actually enjoy using it.', name: 'Alex M., Head of HR' },
  { date: 'Feb 5, 2026', text: 'We evaluated six ATS platforms before choosing AI Recruit. Nothing comes close in terms of design clarity and intelligent automation. It\'s recruitment, refined.', name: 'Jamie L., CTO' },
  { date: 'Feb 20, 2026', text: 'The analytics dashboard finally gives us real visibility. We can see exactly where candidates drop off and optimize our process. Data-driven hiring is no longer a buzzword for us.', name: 'Priya R., People Ops' },
];

const faqs = [
  { q: 'What is AI Recruit?', a: 'AI Recruit is a multi-tenant B2B SaaS platform that combines intelligent applicant tracking, automated AI screening, and visual workflow management into one beautifully minimal experience.' },
  { q: 'How does the AI screening work?', a: 'Our AI automatically extracts skills from uploaded resumes, scores candidates against your custom job requirements, and ranks applicants — all with zero bias and full transparency into how scores are calculated.' },
  { q: 'Can I customize hiring workflows?', a: 'Absolutely. The drag-and-drop workflow builder lets you design multi-stage pipelines with manual review steps, automated AI stages, interview rounds, and custom gates. Toggle between modes effortlessly.' },
  { q: 'Is there a free trial?', a: 'Yes — every plan starts with a 14-day free trial. No credit card required. You can explore the full platform including AI screening, workflows, and analytics before committing.' },
  { q: 'How is candidate data handled?', a: 'Security is foundational. All data is encrypted at rest and in transit. Each tenant\'s data is fully isolated. We comply with GDPR and SOC 2 requirements, and you can export or delete data at any time.' },
];

const features = [
  { icon: '⚡', title: 'AI-Powered Screening', desc: 'Automatically extract skills from resumes and score candidates against your job requirements with zero bias.' },
  { icon: '🔀', title: 'Visual Workflows', desc: 'Design custom staging pipelines with our drag-and-drop builder. Toggle between manual and AI-driven stages.' },
  { icon: '📊', title: 'Actionable Analytics', desc: 'Minimalist, highly legible charts that track conversion metrics and interview progressions accurately.' },
];

const plans = [
  { name: 'Growth', price: '499', desc: 'Perfect for scaling startups.', items: ['Up to 50 active jobs', 'Standard AI screening', 'Basic workflows', 'Email support'], highlighted: false },
  { name: 'Enterprise', price: '999', desc: 'For unlimited hiring volume.', items: ['Unlimited active jobs', 'Advanced AI matching', 'Custom visual workflows', 'Premium analytics suite', 'Dedicated account manager'], highlighted: true },
];

/* ──────────────────────────────────────────
   LANDING PAGE
   ────────────────────────────────────────── */
export const LandingPage = () => {
  const { user, logout } = useAuth();
  const homePath = user ? getHomePath(user) : null;

  return (
    <div className={s.layout}>
      <GrainOverlay />

      {/* ── FLOATING NAV ── */}
      <nav className={s.nav}>
        <div className={s.navLogo}>
          <div className={s.navLogoCircle} />
          <span className={s.navLogoText}>AI Recruit</span>
        </div>
        <div className={s.navLinks}>
          <a href="#features" className={s.navLink}>Features</a>
          <a href="#how-it-works" className={s.navLink}>How it works</a>
          <a href="#pricing" className={s.navLink}>Pricing</a>
          <Link to="/jobs" className={s.navLink}>Job Board</Link>
        </div>
        {user ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to={homePath!} className={s.navCta}>Dashboard</Link>
            <button
              onClick={() => { logout(); }}
              className={s.navLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/login" className={s.navLink}>Sign in</Link>
            <Link to="/register" className={s.navCta}>Get started</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero}>
        <div className={s.heroBlob1} />
        <div className={s.heroBlob2} />
        <div className={s.heroContent}>
          <h1 className={s.heroTitle}>
            Recruitment, entirely{' '}
            <span className={s.heroCursive}>re-engineered</span>
          </h1>
          <p className={s.heroSub}>
            A professional, multi-tenant platform that leverages AI to streamline
            applicant tracking, automated screening, and dynamic workflows — without the clutter.
          </p>
          <div className={s.heroCtas}>
            <Link to={user ? homePath! : "/register"} className={s.ctaPrimary}>
              {user ? 'Go to dashboard' : 'Get started free'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <a href="#features" className={s.ctaSecondary}>See how it works</a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Reveal>
        <section className={s.featuresSection} id="features">
          <h2 className={s.sectionTitle}>Built for modern hiring teams</h2>
          <p className={s.sectionSub}>
            Our platform abstracts the complexity of recruitment into a clean, human-crafted experience.
          </p>
          <div className={s.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={s.featureCard}>
                <div className={s.featureIcon}>{f.icon}</div>
                <h3 className={s.featureCardTitle}>{f.title}</h3>
                <p className={s.featureCardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── HOW IT WORKS — HORIZONTAL SCROLL ── */}
      <Reveal>
        <section className={s.scenarios} id="how-it-works">
          <h2 className={s.scenariosTitle}>How it works</h2>
          <p className={s.scenariosSub}>
            From job post to signed offer — five effortless steps.
          </p>
          <div className={s.scenariosTrack}>
            {scenarios.map((sc) => (
              <div key={sc.time} className={s.scenarioCard}>
                <span className={s.scenarioTime}>{sc.time}</span>
                <span className={s.scenarioText}>{sc.text}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── APP EXPERIENCE PREVIEW ── */}
      <Reveal>
        <section className={s.appPreview}>
          <h2 className={s.appPreviewTitle}>Experience the dashboard</h2>
          <p className={s.appPreviewSub}>
            Minimalist design meets intelligent automation. Three core views, zero clutter.
          </p>
          <div className={s.phonesWrapper}>
            {/* Left — Candidates */}
            <div className={`${s.phone} ${s.phoneLeft}`}>
              <div className={`${s.phoneScreen} ${s.screenSage}`}>
                <div className={s.phoneNotch} />
                <span className={s.phoneTitle}>Candidates</span>
                <span className={s.phoneSub}>Track every applicant in one view</span>
                <span className={`${s.phonePill} ${s.pillSage}`}>12 new today</span>
                <div className={s.phoneBar} />
                <div className={s.phoneBarShort} />
              </div>
            </div>
            {/* Center — AI Screening */}
            <div className={`${s.phone} ${s.phoneCenter}`}>
              <div className={`${s.phoneScreen} ${s.screenCoral}`}>
                <div className={s.phoneNotch} />
                <span className={s.phoneTitle}>AI Screening</span>
                <span className={s.phoneSub}>Automated scoring in real-time</span>
                <button className={s.breatheBtn}>98%</button>
              </div>
            </div>
            {/* Right — Workflows */}
            <div className={`${s.phone} ${s.phoneRight}`}>
              <div className={`${s.phoneScreen} ${s.screenLavender}`}>
                <div className={s.phoneNotch} />
                <span className={s.phoneTitle}>Workflows</span>
                <span className={s.phoneSub}>Visual drag-and-drop pipelines</span>
                <span className={`${s.phonePill} ${s.pillLavender}`}>5 stages active</span>
                <div className={s.phoneBar} />
                <div className={s.phoneBarShort} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── TESTIMONIALS ── */}
      <Reveal>
        <section className={s.diary} id="stories">
          <h2 className={s.diaryTitle}>What hiring teams are saying</h2>
          <p className={s.diarySub}>
            Real feedback from teams who transformed their recruitment process.
          </p>
          <div className={s.diaryGrid}>
            {testimonials.map((entry) => (
              <div key={entry.name} className={s.diaryCard}>
                <div className={s.diaryDate}>{entry.date}</div>
                <p className={s.diaryText}>{entry.text}</p>
                <div className={s.diarySig}>
                  <span className={s.diarySigLine} />
                  <span className={s.diarySigName}>{entry.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── PRICING ── */}
      <Reveal>
        <section className={s.pricingSection} id="pricing">
          <h2 className={s.sectionTitle}>Simple, transparent pricing</h2>
          <p className={s.sectionSub}>Start scaling your team today.</p>
          <div className={s.pricingGrid}>
            {plans.map((plan) => (
              <div key={plan.name} className={`${s.pricingCard} ${plan.highlighted ? s.pricingCardHighlighted : ''}`}>
                {plan.highlighted && <div className={s.pricingBadge}>Most popular</div>}
                <h3 className={s.pricingName}>{plan.name}</h3>
                <div className={s.pricingPrice}>
                  <span className={s.pricingCurrency}>$</span>
                  <span className={s.pricingAmount}>{plan.price}</span>
                  <span className={s.pricingPeriod}>/mo</span>
                </div>
                <p className={s.pricingDesc}>{plan.desc}</p>
                <ul className={s.pricingList}>
                  {plan.items.map((item) => (
                    <li key={item} className={s.pricingListItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.checkSvg}><path d="M20 6 9 17l-5-5"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={user ? homePath! : "/register"}
                  className={plan.highlighted ? s.ctaPrimary : s.ctaSecondary}
                  style={{ textAlign: 'center', justifyContent: 'center', width: '100%' }}
                >
                  {plan.highlighted ? 'Contact sales' : 'Start free trial'}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── FAQ ── */}
      <Reveal>
        <section className={s.faq} id="faq">
          <h2 className={s.faqTitle}>Questions & answers</h2>
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </section>
      </Reveal>

      {/* ── CTA / WAITLIST ── */}
      <Reveal>
        <section className={s.waitlist} id="cta">
          <div className={s.waitlistBlob1} />
          <div className={s.waitlistBlob2} />
          <div className={s.waitlistInner}>
            <div className={s.waitlistIcon} />
            <h2 className={s.waitlistTitle}>Ready to transform your hiring?</h2>
            <p className={s.waitlistSub}>
              Get early access to AI Recruit. No spam — just an invite when your
              tenant is ready.
            </p>
            <form className={s.waitlistForm} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="work@company.com"
                className={s.waitlistInput}
                required
              />
              <button type="submit" className={s.waitlistSubmit}>Request access</button>
            </form>
          </div>
        </section>
      </Reveal>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <div className={s.footerLogoCircle} />
            <span className={s.footerLogoText}>AI Recruit</span>
          </div>
          <p className={s.footerCopy}>&copy; 2026 AI Recruitment Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
