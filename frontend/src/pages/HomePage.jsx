import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/homePage.css";

// Waar alle "Demo aanvragen"-knoppen naartoe gaan. Pas dit aan als je
// een eigen planner of contactpagina hebt.
const CONTACT_URL = "mailto:support@raggy.nl?subject=Demo%20aanvragen";

// ── DATA ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  ["#hoe-het-werkt", "Hoe het werkt"],
  ["#functies", "Functies"],
  ["#privacy", "Privacy"],
  ["#prijzen", "Prijzen"],
  ["#faq", "FAQ"],
];

const SOURCES = [
  { name: "Werkt met", items: ["PDF", "Word (DOCX)", "Tekst (TXT)", "SDB Groep"] },
  { name: "Binnenkort", items: ["TOPdesk", "AFAS", "ONS Welzijn"] },
];

const STEPS = [
  {
    n: "01",
    icon: "upload",
    title: "Voeg je kennis toe",
    body: "Upload handboeken, procedures en contracten, of koppel een systeem dat je al gebruikt. Per team een eigen workspace.",
  },
  {
    n: "02",
    icon: "index",
    title: "Raggy leest alles door",
    body: "Documenten worden opgeknipt en doorzoekbaar gemaakt op betekenis, niet alleen op losse woorden.",
  },
  {
    n: "03",
    icon: "chat",
    title: "Je team stelt vragen",
    body: "Iedereen krijgt direct een helder antwoord, met een verwijzing naar het document waar het vandaan komt.",
  },
];

const PRIVACY_ITEMS = [
  "Verwerkersovereenkomst standaard inbegrepen",
  "Servers in Nederland (EU)",
  "Geen training van AI-modellen op jouw data",
  "Per workspace gescheiden data en rechten",
];

const FLOW = [
  { icon: "doc",    label: "Jouw documenten en systemen", pill: "jij beheert",  tone: "gray" },
  { icon: "lock",   label: "Verwerking en opslag",         pill: "EU servers",   tone: "green" },
  { icon: "search", label: "Zoeken op betekenis",          pill: "per workspace", tone: "green" },
  { icon: "chat",   label: "Antwoord aan je collega",      pill: "met bron",     tone: "blue" },
];

// Vul met echte klantquotes zodra je die hebt; leeg = sectie verborgen.
const TESTIMONIALS = [
  // { quote: "…", name: "Naam", role: "Functie · Organisatie", initials: "NA" },
];

const PLANS = [
  {
    tier: "Starter", price: "€199", per: "/mnd", featured: false,
    desc: "Voor kleinere teams die willen starten met kennisdeling.",
    features: ["Tot 500 documenten", "25 gebruikers", "Standaard connectoren", "E-mail support"],
    cta: "Demo aanvragen",
  },
  {
    tier: "Business", price: "€599", per: "/mnd", featured: true,
    desc: "Voor groeiende organisaties met meerdere afdelingen.",
    features: ["Onbeperkte documenten", "Onbeperkte gebruikers", "Rollen en rechten per workspace", "Meerdere workspaces", "Priority support"],
    cta: "Demo aanvragen",
  },
  {
    tier: "Enterprise", price: "Op maat", per: "", featured: false,
    desc: "Voor grote organisaties met eigen eisen aan infrastructuur.",
    features: ["Eigen omgeving mogelijk", "SLA-afspraken", "Begeleide implementatie", "SSO", "Vaste contactpersoon"],
    cta: "Contact opnemen",
  },
];

const FAQ = [
  {
    q: "Wat doet Raggy precies?",
    a: "Raggy doorzoekt de documenten en systemen van jouw organisatie en beantwoordt vragen van je team in gewone taal. Bij elk antwoord zie je uit welk document het komt, zodat je het altijd kunt controleren.",
  },
  {
    q: "Welke bestanden kan ik toevoegen?",
    a: "PDF, Word (DOCX) en tekstbestanden (TXT), tot 25 MB per bestand. Daarnaast kun je systemen koppelen; er komen steeds meer connecties bij.",
  },
  {
    q: "Waar staat mijn data?",
    a: "Op servers in Nederland, binnen de EU. Elke workspace is afgeschermd: alleen mensen die je uitnodigt hebben toegang.",
  },
  {
    q: "Wordt mijn data gebruikt om AI te trainen?",
    a: "Nee. Je documenten worden alleen gebruikt om vragen binnen jouw eigen workspace te beantwoorden.",
  },
  {
    q: "Kan ik mijn team uitnodigen?",
    a: "Ja. Je nodigt collega's uit per e-mail en geeft ze een rol: eigenaar, beheerder, editor of viewer.",
  },
  {
    q: "Zit ik ergens aan vast?",
    a: "Nee, abonnementen zijn maandelijks opzegbaar.",
  },
];

// ── HOOKS ─────────────────────────────────────────────────────────────────────

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".hp-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("hp-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("hp-visible");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function Nav({ scrolled }) {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`hp-nav ${scrolled ? "hp-nav--scrolled" : ""} ${open ? "hp-nav--open" : ""}`}>
      <div className="hp-nav-inner">
        <a className="hp-nav-logo" href="#top" aria-label="Raggy home">
          <img src="/images/logo.svg" alt="Raggy" width="108" height="40" />
        </a>

        <nav className="hp-nav-links" aria-label="Hoofdmenu">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>

        <div className="hp-nav-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="hp-btn hp-btn--dark hp-btn--sm">
              <span className="hp-nav-avatar">{user.name?.[0]?.toUpperCase()}</span>
              Open app
            </Link>
          ) : (
            <>
              <Link to="/inloggen" className="hp-btn hp-btn--ghost hp-btn--sm">Inloggen</Link>
              <Link to="/registreren" className="hp-btn hp-btn--dark hp-btn--sm">Gratis starten</Link>
            </>
          )}
        </div>

        <button
          className="hp-nav-burger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
        >
          <span /><span />
        </button>
      </div>

      {/* Mobiel menu */}
      <div className="hp-mobile-menu">
        {NAV_LINKS.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <div className="hp-mobile-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="hp-btn hp-btn--dark">Open app</Link>
          ) : (
            <>
              <Link to="/inloggen" className="hp-btn hp-btn--outline">Inloggen</Link>
              <Link to="/registreren" className="hp-btn hp-btn--dark">Gratis starten</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  return (
    <section className="hp-hero" id="top">
      <div className="hp-hero-bg" aria-hidden="true" />

      <div className="hp-hero-copy">
        <a className="hp-badge hp-fade" href="#early-access">
          <span className="hp-badge-dot" />
          Nu in early access
          <ArrowRight />
        </a>

        <h1 className="hp-hero-title hp-fade hp-d1">
          Stel een vraag.<br />
          <em>Raggy haalt het antwoord op.</em>
        </h1>

        <p className="hp-hero-sub hp-fade hp-d2">
          Raggy doorzoekt je handboeken, procedures en contracten en geeft je team direct het juiste antwoord, met de bron erbij.
        </p>

        <div className="hp-hero-actions hp-fade hp-d3">
          {isLoggedIn ? (
            <Link to="/dashboard" className="hp-btn hp-btn--dark hp-btn--lg">Open Raggy <ArrowRight /></Link>
          ) : (
            <Link to="/registreren" className="hp-btn hp-btn--dark hp-btn--lg">Gratis starten <ArrowRight /></Link>
          )}
          <a href={CONTACT_URL} className="hp-btn hp-btn--outline hp-btn--lg">Demo aanvragen</a>
        </div>

        <p className="hp-hero-note hp-fade hp-d3">Geen creditcard nodig · Data in de EU</p>
      </div>

      <ProductPreview />
    </section>
  );
}

// Nagebouwde schermafbeelding van de app (HTML/CSS, geen plaatje)
function ProductPreview() {
  return (
    <div className="hp-preview hp-fade hp-d4" aria-hidden="true">
      <div className="hp-preview-window">
        <div className="hp-preview-bar">
          <span /><span /><span />
          <div className="hp-preview-url">raggy.nl/w/jouw-bedrijf</div>
        </div>

        <div className="hp-preview-body">
          <aside className="hp-preview-side">
            <div className="hp-preview-ws">
              <span className="hp-preview-ws-logo">J</span>
              <div>
                <b>Jouw Bedrijf</b>
                <small>Eigenaar · Pro</small>
              </div>
            </div>
            <div className="hp-preview-new">+ Nieuw gesprek</div>
            <p className="hp-preview-label">Vandaag</p>
            <div className="hp-preview-chat hp-preview-chat--active">Opzegtermijn uitzendkrachten</div>
            <div className="hp-preview-chat">Declaratie reiskosten</div>
            <p className="hp-preview-label">Gisteren</p>
            <div className="hp-preview-chat">Onboarding nieuwe collega</div>
            <div className="hp-preview-chat">Verlofregeling 2026</div>
          </aside>

          <main className="hp-preview-main">
            <div className="hp-preview-q">Wat is de opzegtermijn voor uitzendkrachten?</div>

            <div className="hp-preview-a">
              <p className="hp-line hp-line-1">
                Voor uitzendkrachten geldt de opzegtermijn uit de cao <Cite n="1" />. Daarnaast staat in jullie handboek:
              </p>
              <ul>
                <li className="hp-line hp-line-2">In fase A kan de uitzendovereenkomst dagelijks worden beëindigd <Cite n="2" />.</li>
                <li className="hp-line hp-line-3">Na 52 gewerkte weken eindigt de overeenkomst automatisch <Cite n="1" />.</li>
              </ul>

              <div className="hp-preview-sources hp-line hp-line-4">
                <div className="hp-source">
                  <span className="hp-source-n">1</span>
                  <span><b>cao-uitzendkrachten.pdf</b><small>pagina 12</small></span>
                </div>
                <div className="hp-source">
                  <span className="hp-source-n">2</span>
                  <span><b>Personeelshandboek.docx</b><small>hoofdstuk 4</small></span>
                </div>
              </div>
            </div>

            <div className="hp-preview-composer">
              <span>Vraag iets aan Jouw Bedrijf…</span>
              <span className="hp-preview-send"><ArrowUp /></span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Cite({ n }) {
  return <span className="hp-cite">{n}</span>;
}

function Sources() {
  return (
    <section className="hp-sources" aria-label="Bronnen">
      {SOURCES.map(group => (
        <div key={group.name} className="hp-sources-group">
          <span className="hp-sources-label">{group.name}</span>
          {group.items.map(item => (
            <span key={item} className={`hp-chip ${group.name === "Binnenkort" ? "hp-chip--soon" : ""}`}>{item}</span>
          ))}
        </div>
      ))}
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="hp-section" id="hoe-het-werkt">
      <SectionHead
        label="Hoe het werkt"
        title={<>Van document naar <em>antwoord</em></>}
        sub="Geen ingewikkelde implementatie. Je zet je kennis erin, en je team kan meteen vragen stellen."
      />
      <div className="hp-steps">
        {STEPS.map((s, i) => (
          <article key={s.n} className="hp-step hp-reveal" style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="hp-step-top">
              <span className="hp-step-icon"><Icon name={s.icon} /></span>
              <span className="hp-step-n">{s.n}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="hp-section" id="functies">
      <SectionHead
        label="Functies"
        title={<>Gebouwd voor <em>serieuze organisaties</em></>}
        sub="Geen algemene chatbot, maar een assistent die alleen antwoordt vanuit jouw eigen kennis."
      />

      <div className="hp-bento">
        <article className="hp-card hp-card--wide hp-reveal">
          <div className="hp-card-text">
            <span className="hp-card-icon"><Icon name="quote" /></span>
            <h3>Elk antwoord met bron</h3>
            <p>Raggy laat zien uit welk document een antwoord komt. Even hoveren en je ziet de passage, zodat je collega's het antwoord kunnen vertrouwen.</p>
          </div>
          <div className="hp-card-visual hp-cite-visual">
            <p>… met een opzegtermijn van één maand <span className="hp-cite hp-cite--hover">1</span></p>
            <div className="hp-tooltip">
              <div className="hp-tooltip-head"><span className="hp-source-n">1</span><b>Arbeidsvoorwaarden 2026.pdf</b></div>
              <p>"De werknemer neemt bij opzegging een termijn van één kalendermaand in acht…"</p>
            </div>
          </div>
        </article>

        <article className="hp-card hp-reveal">
          <span className="hp-card-icon"><Icon name="search" /></span>
          <h3>Zoekt op betekenis</h3>
          <p>Vraag naar "vrije dagen" en Raggy vindt ook "verlof" en "vakantie-uren". Je hoeft de exacte woorden niet te kennen.</p>
        </article>

        <article className="hp-card hp-reveal">
          <span className="hp-card-icon"><Icon name="layers" /></span>
          <h3>Workspaces per team</h3>
          <p>Elke afdeling of klant een eigen omgeving, met eigen documenten, gesprekken en mensen.</p>
        </article>

        <article className="hp-card hp-reveal">
          <span className="hp-card-icon"><Icon name="shield" /></span>
          <h3>Rollen en rechten</h3>
          <p>Bepaal wie mag lezen, uploaden of beheren.</p>
          <div className="hp-roles">
            <span>Eigenaar</span><span>Beheerder</span><span>Editor</span><span>Viewer</span>
          </div>
        </article>

        <article className="hp-card hp-reveal">
          <span className="hp-card-icon"><Icon name="plug" /></span>
          <h3>Koppel je systemen</h3>
          <p>Laat Raggy ook zoeken in de systemen die je al gebruikt. Zet koppelingen per workspace aan of uit.</p>
        </article>

        <article className="hp-card hp-reveal">
          <span className="hp-card-icon"><Icon name="refresh" /></span>
          <h3>Altijd actueel</h3>
          <p>Nieuwe versie van een document? Upload hem en Raggy werkt zijn kennis meteen bij.</p>
        </article>
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section className="hp-section" id="privacy">
      <div className="hp-privacy">
        <div className="hp-reveal">
          <p className="hp-label">Privacy en beveiliging</p>
          <h2 className="hp-h2">Jouw data blijft <em>van jou</em></h2>
          <p className="hp-sub">
            Raggy gebruikt je documenten alleen om vragen binnen jouw eigen workspace te beantwoorden. AVG-proof, en gebouwd in Nederland.
          </p>
          <ul className="hp-checks">
            {PRIVACY_ITEMS.map(item => (
              <li key={item}><span className="hp-check"><Icon name="check" /></span>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hp-flow hp-reveal">
          {FLOW.map((item, i) => (
            <div key={item.label} className="hp-flow-step">
              <div className="hp-flow-item">
                <span className="hp-flow-icon"><Icon name={item.icon} /></span>
                <span className="hp-flow-label">{item.label}</span>
                <span className={`hp-pill hp-pill--${item.tone}`}>{item.pill}</span>
              </div>
              {i < FLOW.length - 1 && <div className="hp-flow-line" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EarlyAccess() {
  return (
    <section className="hp-early" id="early-access">
      <div className="hp-early-inner hp-reveal">
        <div>
          <p className="hp-label hp-label--light">Early access</p>
          <h2 className="hp-h2 hp-h2--light">Bouw mee aan <em>Raggy</em></h2>
          <p className="hp-early-sub">
            Raggy is nieuw en groeit samen met de eerste teams die het gebruiken. Doe mee en help bepalen wat we bouwen.
          </p>
          <div className="hp-early-actions">
            <Link to="/registreren" className="hp-btn hp-btn--white hp-btn--lg">Gratis starten <ArrowRight /></Link>
            <a href={CONTACT_URL} className="hp-btn hp-btn--outline-light hp-btn--lg">Plan een demo</a>
          </div>
        </div>
        <ul className="hp-early-list">
          <li><span><Icon name="hand" /></span><div><b>Persoonlijke hulp</b><p>We helpen je bij het opzetten van je eerste workspace.</p></div></li>
          <li><span><Icon name="chat" /></span><div><b>Directe lijn met de makers</b><p>Vragen of ideeën? Je spreekt meteen de mensen die het bouwen.</p></div></li>
          <li><span><Icon name="spark" /></span><div><b>Jouw feedback telt</b><p>Wat early access-teams nodig hebben, komt bovenaan de lijst.</p></div></li>
        </ul>
      </div>
    </section>
  );
}

function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="hp-section">
      <SectionHead label="Wat klanten zeggen" title={<>Teams die <em>kennis delen</em></>} />
      <div className="hp-quotes">
        {TESTIMONIALS.map(t => (
          <figure key={t.name} className="hp-quote hp-reveal">
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <span className="hp-quote-avatar">{t.initials}</span>
              <span><b>{t.name}</b><small>{t.role}</small></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="hp-section" id="prijzen">
      <SectionHead
        label="Prijzen"
        title={<>Eenvoudig <em>en transparant</em></>}
        sub="Geen verborgen kosten en geen lange contracten. Maandelijks opzegbaar."
      />
      <div className="hp-pricing">
        {PLANS.map(plan => (
          <article key={plan.tier} className={`hp-plan hp-reveal ${plan.featured ? "hp-plan--featured" : ""}`}>
            {plan.featured && <span className="hp-plan-badge">Meest gekozen</span>}
            <p className="hp-plan-tier">{plan.tier}</p>
            <p className="hp-plan-price">{plan.price}<span>{plan.per}</span></p>
            <p className="hp-plan-desc">{plan.desc}</p>
            <ul className="hp-plan-features">
              {plan.features.map(f => (
                <li key={f}><span className="hp-check hp-check--sm"><Icon name="check" /></span>{f}</li>
              ))}
            </ul>
            <a
              href={CONTACT_URL}
              className={`hp-btn hp-btn--block ${plan.featured ? "hp-btn--white" : "hp-btn--outline"}`}
            >
              {plan.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="hp-section hp-section--narrow" id="faq">
      <SectionHead label="Veelgestelde vragen" title={<>Goed om te <em>weten</em></>} />
      <div className="hp-faq hp-reveal">
        {FAQ.map(item => (
          <details key={item.q} className="hp-faq-item">
            <summary>
              {item.q}
              <span className="hp-faq-plus" aria-hidden="true" />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="hp-cta">
      <div className="hp-cta-card hp-reveal">
        <img src="/images/logo-mark.svg" alt="" width="56" height="56" className="hp-cta-mark" />
        <h2 className="hp-h2">Zet je kennis <em>aan het werk</em></h2>
        <p className="hp-sub">Maak in een paar minuten je eerste workspace aan, of laat je rondleiden met een demo.</p>
        <div className="hp-hero-actions">
          <Link to="/registreren" className="hp-btn hp-btn--dark hp-btn--lg">Gratis starten <ArrowRight /></Link>
          <a href={CONTACT_URL} className="hp-btn hp-btn--outline hp-btn--lg">Demo aanvragen</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="hp-footer">
      <div className="hp-footer-inner">
        <div className="hp-footer-brand">
          <img src="/images/logo.svg" alt="Raggy" width="108" height="40" />
          <p>Bedrijfskennis, direct beschikbaar.</p>
        </div>
        <nav className="hp-footer-links" aria-label="Footer">
          <a href="#hoe-het-werkt">Hoe het werkt</a>
          <a href="#prijzen">Prijzen</a>
          <a href="#faq">FAQ</a>
          <a href="/privacy">Privacybeleid</a>
          <a href="mailto:support@raggy.nl">Contact</a>
        </nav>
      </div>
      <p className="hp-footer-copy">© {new Date().getFullYear()} Raggy · raggy.nl</p>
    </footer>
  );
}

function SectionHead({ label, title, sub }) {
  return (
    <div className="hp-section-head hp-reveal">
      <p className="hp-label">{label}</p>
      <h2 className="hp-h2">{title}</h2>
      {sub && <p className="hp-sub">{sub}</p>}
    </div>
  );
}

// ── ICONS ─────────────────────────────────────────────────────────────────────

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
    </svg>
  );
}

function Icon({ name }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "upload":  return <svg {...p}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>;
    case "index":   return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 12h8M8 15h5" /></svg>;
    case "chat":    return <svg {...p}><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></svg>;
    case "quote":   return <svg {...p}><path d="M7 4h7l5 5v11H7z" /><path d="M14 4v5h5" /><path d="M10 13h6M10 16h4" /></svg>;
    case "search":  return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
    case "layers":  return <svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></svg>;
    case "shield":  return <svg {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "plug":    return <svg {...p}><path d="M9 3v5M15 3v5" /><path d="M7 8h10v3a5 5 0 0 1-10 0V8z" /><path d="M12 16v5" /></svg>;
    case "refresh": return <svg {...p}><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 20v-4h-4" /></svg>;
    case "doc":     return <svg {...p}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>;
    case "lock":    return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "check":   return <svg {...p} strokeWidth="2.4"><path d="m5 12.5 4.5 4.5L19 7" /></svg>;
    case "hand":    return <svg {...p}><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 3 0" /></svg>;
    case "spark":   return <svg {...p}><path d="M12 3l2 5.5L19.5 10.5 14 12.5 12 18l-2-5.5L4.5 10.5 10 8.5z" /></svg>;
    default:        return null;
  }
}

// ── ROOT ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const scrolled = useNavScroll();
  useReveal();

  return (
    <div className="hp">
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Sources />
        <HowItWorks />
        <Features />
        <Privacy />
        <EarlyAccess />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}