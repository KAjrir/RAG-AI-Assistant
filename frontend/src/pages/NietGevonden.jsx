import { Link } from 'react-router';
import '../new-styles/nietGevonden.css';

export default function NietGevonden() {
  return (
    <div className="ng-root">
      <div className="ng-content">
        <span className="ng-code">404</span>
        <h1 className="ng-title">
          Volgens mij ben je<br />
          <em>verdwaald...</em>
        </h1>
        <p className="ng-sub">
          Deze pagina bestaat niet of is verplaatst.<br />
          Geen zorgen, het overkomt de besten.
        </p>
        <div className="ng-actions">
          <Link to="/dashboard" className="ng-btn-primary">
            Terug naar dashboard
          </Link>
          <Link to="/" className="ng-btn-secondary">
            Startpagina
          </Link>
        </div>
      </div>

      <div className="ng-visual" aria-hidden="true">
        <CompassIllustration />
      </div>
    </div>
  );
}

function CompassIllustration() {
  return (
    <svg
      className="ng-compass"
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Buitenste ring */}
      <circle cx="140" cy="140" r="120" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 4"/>
      {/* Middelste ring */}
      <circle cx="140" cy="140" r="88" stroke="var(--border)" strokeWidth="1"/>
      {/* Binnenste ring */}
      <circle cx="140" cy="140" r="56" stroke="var(--border-dark)" strokeWidth="1.5"/>
      {/* Middelpunt */}
      <circle cx="140" cy="140" r="6" fill="var(--accent)" />
      <circle cx="140" cy="140" r="3" fill="white" />

      {/* Kompasstreepjes */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad   = (deg * Math.PI) / 180;
        const major = i % 2 === 0;
        const r1    = major ? 92 : 94;
        const r2    = major ? 106 : 102;
        return (
          <line
            key={deg}
            x1={140 + r1 * Math.sin(rad)}
            y1={140 - r1 * Math.cos(rad)}
            x2={140 + r2 * Math.sin(rad)}
            y2={140 - r2 * Math.cos(rad)}
            stroke={major ? 'var(--border-dark)' : 'var(--border)'}
            strokeWidth={major ? 1.5 : 1}
            strokeLinecap="round"
          />
        );
      })}

      {/* N O Z W labels */}
      <text x="140" y="42" textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="var(--sans)">N</text>
      <text x="238" y="143" textAnchor="middle" dominantBaseline="central"
        fill="var(--muted)" fontSize="11" fontFamily="var(--sans)">O</text>
      <text x="140" y="242" textAnchor="middle" dominantBaseline="central"
        fill="var(--muted)" fontSize="11" fontFamily="var(--sans)">Z</text>
      <text x="42" y="143" textAnchor="middle" dominantBaseline="central"
        fill="var(--muted)" fontSize="11" fontFamily="var(--sans)">W</text>

      {/* Naald noord — accent blauw */}
      <polygon
        points="140,68 134,140 140,148 146,140"
        fill="var(--accent)"
        opacity="0.9"
      />
      {/* Naald zuid — grijs */}
      <polygon
        points="140,212 134,140 140,148 146,140"
        fill="var(--border-dark)"
      />
    </svg>
  );
}