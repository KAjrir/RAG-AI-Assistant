import { useEffect, useState } from "react";
import "../styles/homePage.css";
import { Link } from "react-router";

import { useAuth } from "../providers/AuthProvider.jsx"

// ── DATA ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Documentatie aanleveren", body: "Upload handboeken en procedures via onze beveiligde portal, of koppel direct met SharePoint of Google Drive." },
  { n: "02", title: "Wij verwerken & chunken", body: "Onze pipeline verdeelt uw content in relevante stukken en maakt ze doorzoekbaar via semantische vectorzoekopdrachten." },
  { n: "03", title: "Medewerkers stellen vragen", body: "Via een eenvoudige chatinterface krijgen medewerkers direct antwoorden, compleet met bronverwijzing." },
  { n: "04", title: "U behoudt controle", body: "Documenten bijwerken of toegang intrekken? Alles via het beheerderspaneel, zonder technische kennis." },
];

const FEATURES = [
  { icon: "⚡", title: "Semantisch zoeken",       body: "Medewerkers hoeven niet de exacte woorden te kennen. VLNK begrijpt de intentie achter de vraag." },
  { icon: "📎", title: "Bronverwijzingen",         body: "Elk antwoord bevat een directe link naar het brondocument, zodat medewerkers altijd kunnen verifiëren." },
  { icon: "🔒", title: "Rolgebaseerde toegang",    body: "Niet iedereen ziet alles. Stel per afdeling in welke documenten toegankelijk zijn." },
  { icon: "🔄", title: "Altijd actueel",           body: "Update een document en VLNK verwerkt de wijziging automatisch. Geen verouderde antwoorden." },
  { icon: "🌐", title: "Connector API",            body: "Koppel met uw bestaande systemen via onze read-only API. Data blijft waar hij hoort: bij u." },
  { icon: "📊", title: "Gebruiksanalyse",          body: "Zie welke vragen het meest gesteld worden en ontdek waar uw documentatie tekortschiet." },
];

const PRIVACY_ITEMS = [
  "Verwerkersovereenkomst standaard inbegrepen",
  "Servers in Nederland (EU)",
  "VPC-deployment beschikbaar voor enterprise",
  "Geen training op uw data",
];

const FLOW = [
  { icon: "📄", label: "Uw documentatie",          pill: "bij u",        green: false, connector: "read-only verbinding" },
  { icon: "⚙️", label: "Chunking & embedding",     pill: "versleuteld",  green: true,  connector: "vectoropslag" },
  { icon: "🔍", label: "Vectordatabase",            pill: "EU servers",   green: true,  connector: "retrieval op aanvraag" },
  { icon: "💬", label: "Antwoord aan medewerker",   pill: "met bronlink", green: true,  connector: null },
];

const TESTIMONIALS = [
  { quote: "Eindelijk een tool die onze procesbeschrijvingen begrijpt. Medewerkers vinden nu in seconden wat ze vroeger een kwartier zochten.", name: "Sarah van den Berg", role: "HR Manager · Logistiek bedrijf", initials: "SB" },
  { quote: "De implementatie was verrassend snel. Binnen een dag hadden we onze volledige kennisbank online en konden collega's al vragen stellen.", name: "Thomas Kuiper", role: "IT Lead · Zorginstelling", initials: "TK" },
  { quote: "Wat ons overtuigde was de privacy-aanpak. Onze documenten blijven bij ons, VLNK doet alleen het zoekwerk. Dat is exact wat wij nodig hadden.", name: "Lena Brouwers", role: "Compliance Officer · Financieel", initials: "LB" },
  { quote: "De bronverwijzingen zijn een gamechanger. Medewerkers vertrouwen het antwoord omdat ze direct kunnen zien waar het vandaan komt.", name: "Daan Pietersen", role: "Operations Director · Retailketen", initials: "DP" },
  { quote: "We hadden eerder een duur maatwerk systeem. VLNK doet hetzelfde voor een fractie van de kosten, en het werkt beter.", name: "Roos Janssen", role: "CFO · Scale-up SaaS", initials: "RJ" },
  { quote: "Het team was van dag één beschikbaar. Niet alleen bij onboarding, maar ook bij vragen daarna. Dat serviceniveau zie je zelden.", name: "Maarten de Vries", role: "CTO · Industrieel bedrijf", initials: "MV" },
];

const PLANS = [
  {
    tier: "Starter", price: "€199", per: "/mnd", featured: false,
    desc: "Voor kleinere teams die willen starten met kennisdeling.",
    features: ["Tot 500 documenten", "25 gebruikers", "Standaard connector API", "E-mail support"],
    cta: "Demo aanvragen", ctaVariant: "secondary",
  },
  {
    tier: "Business", price: "€599", per: "/mnd", featured: true,
    desc: "Voor groeiende organisaties met meerdere afdelingen.",
    features: ["Onbeperkte documenten", "Onbeperkte gebruikers", "Rolgebaseerde toegang", "Gebruiksanalyse dashboard", "Priority support"],
    cta: "Demo aanvragen", ctaVariant: "primary",
  },
  {
    tier: "Enterprise", price: "Op maat", per: "", featured: false,
    desc: "Voor grote organisaties met eigen infrastructuur.",
    features: ["VPC / on-premise deployment", "SLA garanties", "Dedicated implementatie", "SSO & SAML", "Dedicated accountmanager"],
    cta: "Contact opnemen", ctaVariant: "secondary",
  },
];

const STRIP_ITEMS = ["AVG-compliant", "RAG-technologie", "Eigen data, eigen controle", "Klaar in 48 uur", "Nederlandse support", "No-code setup"];

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Nav({ scrolled }) {
  const { user, loading } = useAuth()
  const isLoggedIn = !loading && !!user

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <a className="nav-logo" href="#">VLNK<span>.</span></a>
      <ul className="nav-links">
        {[["#hoe-het-werkt", "Hoe het werkt"], ["#privacy", "Privacy"], ["#testimonials", "Klanten"], ["#prijzen", "Prijzen"]].map(([href, label]) => (
          <li key={href}><a href={href}>{label}</a></li>
        ))}
      </ul>
      <div className="nav-actions">
        {isLoggedIn ? (
          <>
            <div className="nav-user-pill">
              <div className="nav-avatar">{user.name?.[0]}</div>
              <span>{user.name?.split(' ')[0]}</span>
            </div>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
              Open app →
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>Inloggen</Link>
            <a href="https://tidycal.com/vanleadnaarklant/kennis-making" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>Demo aanvragen</a>
          </>
        )}
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-grid" />

      <div className="hero-badge fade-up">
        <span className="hero-badge-dot" />
        Nu in early access
      </div>

      <h1 className="hero-h1 fade-up delay-1">
        Bedrijfskennis, <em>direct beschikbaar</em>
      </h1>

      <p className="hero-sub fade-up delay-2">
        VLNK leest uw interne documentatie en geeft medewerkers direct het juiste antwoord — zonder zoeken, zonder twijfelen.
      </p>

      <div className="hero-actions fade-up delay-3">
        <a href="#hoe-het-werkt" className="btn btn-secondary btn-lg">Bekijk hoe we helpen</a>
        <a href="#" className="btn btn-dark btn-lg">Demo aanvragen →</a>
      </div>

      <div className="hero-social-proof fade-up delay-3">
        <div className="avatars">
          {["SB", "TK", "LB", "DP"].map((i) => <div key={i} className="avatar">{i}</div>)}
        </div>
        <span className="stars">★★★★★</span>
        <span>Vertrouwd door 50+ organisaties</span>
      </div>
    </section>
  );
}

function Strip() {
  const items = [...STRIP_ITEMS, ...STRIP_ITEMS, ...STRIP_ITEMS];
  return (
    <div className="strip">
      <div className="strip-inner">
        {items.map((item, i) => (
          <span key={i} className="strip-item">
            {item}<span className="strip-dot"> ·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="hoe-het-werkt">
      <p className="section-label reveal">Hoe het werkt</p>
      <h2 className="section-h2 reveal">Van document naar <em>antwoord</em></h2>
      <p className="section-sub reveal">Geen maanden implementatie. Binnen twee dagen heeft uw team toegang tot een assistent die uw bedrijf door en door kent.</p>
      <div className="steps-grid reveal">
        {STEPS.map((s) => <StepCard key={s.n} {...s} />)}
      </div>
    </section>
  );
}

function StepCard({ n, title, body }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="step-card"
      style={{ background: hovered ? "var(--surface2)" : "var(--surface)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="step-num">{n}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="section">
      <p className="section-label reveal">Mogelijkheden</p>
      <h2 className="section-h2 reveal">Gebouwd voor <em>serieuze organisaties</em></h2>
      <p className="section-sub reveal">Niet een generieke chatbot, maar een assistent die uw organisatie echt begrijpt.</p>
      <div className="features-grid reveal">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section className="section" id="privacy">
      <p className="section-label reveal">Privacy & beveiliging</p>
      <div className="privacy-grid">
        <div className="reveal">
          <h2 className="section-h2">Uw data blijft <em>van u</em></h2>
          <p className="section-sub">We slaan geen originele documenten op na verwerking. Vectorembeddings zijn niet herleidbaar naar uw brondata. AVG-compliant by design.</p>
          <ul className="privacy-check-list">
            {PRIVACY_ITEMS.map((item) => (
              <li key={item}>
                <span className="check-icon">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="privacy-visual reveal" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FLOW.map((item, i) => (
            <div key={i}>
              <div className="flow-item">
                <span>{item.icon}</span>
                <span className="flow-label">{item.label}</span>
                <span className={`pill ${item.green ? "pill-green" : "pill-gray"}`}>{item.pill}</span>
              </div>
              {item.connector && <div className="flow-connector">↓ {item.connector}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="testimonials-section" id="testimonials">
      <div className="section">
        <p className="section-label reveal">Wat klanten zeggen</p>
        <h2 className="section-h2 reveal">Vertrouwd door <em>teams die kennis delen</em></h2>
        <p className="section-sub reveal">Van zorginstelling tot retailketen — VLNK werkt waar documentatie een rol speelt.</p>
        <div className="testimonials-grid reveal">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial-card">
              <p className="testimonial-quote">{t.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initials}</div>
                <div>
                  <p className="author-name">{t.name}</p>
                  <p className="author-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="section" id="prijzen">
      <p className="section-label reveal">Prijzen</p>
      <h2 className="section-h2 reveal">Eenvoudig <em>en transparant</em></h2>
      <p className="section-sub reveal">Geen verborgen kosten. Geen lange contracten. Opzegbaar per maand.</p>
      <div className="pricing-grid reveal">
        {PLANS.map((plan) => (
          <div key={plan.tier} className={`pricing-card${plan.featured ? " featured" : ""}`}>
            {plan.featured && (
              <div className="featured-badge-wrap">
                <span className="featured-badge">Meest gekozen</span>
              </div>
            )}
            <p className="pricing-tier">{plan.tier}</p>
            <p className="pricing-price">{plan.price}<span>{plan.per}</span></p>
            <p className="pricing-desc">{plan.desc}</p>
            <ul className="pricing-features">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <a href="#" className={`btn btn-${plan.ctaVariant}`} style={{ justifyContent: "center" }}>{plan.cta}</a>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <div className="cta-section">
      <p className="section-label reveal">Klaar om te starten?</p>
      <h2 className="section-h2 reveal" style={{ maxWidth: "20ch", margin: "0 auto 1rem" }}>
        Zet uw kennisbank <em>aan het werk</em>
      </h2>
      <p className="reveal">Vraag een demo aan en zie binnen 30 minuten hoe VLNK werkt met uw eigen documentatie.</p>
      <div className="reveal">
        <a href="#" className="btn btn-cta-white btn-lg">Demo inplannen →</a>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <a className="nav-logo" href="#">VLNK<span>.</span></a>
      <p>© 2026 VLNK. Alle rechten voorbehouden.</p>
      <ul className="footer-links">
        {["Privacy", "Voorwaarden", "Contact"].map((l) => (
          <li key={l}><a href="#">{l}</a></li>
        ))}
      </ul>
    </footer>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const scrolled = useNavScroll();
  useReveal();

  return (
    <>
      <Nav scrolled={scrolled} />
      <Hero />
      <Strip />
      <HowItWorks />
      <Features />
      <Privacy />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}