import '../styles/components/statusPill.css';

// components/StatusPill.jsx
export default function StatusPill({ status, prefix = 'dp' }) {
  const config = {
    uploading: {
      color: 'blue',
      title: 'Uploaden',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 9V3M6 3L3 6M6 3l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    queued: {
      color: 'yellow',
      title: 'Wachtrij',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    },
    processing: {
      color: 'amber',
      title: 'Verwerking',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="sp-spin">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="16 8" strokeLinecap="round"/>
      </svg>
    },
    completed: {
      color: 'green',
      title: 'Geïndexeerd',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    failed: {
      color: 'red',
      title: 'Mislukt',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    },
  };

  const { icon, title, color } = config[status] ?? { icon: '?', title: status, color: 'gray' };

  return (
    <span className={`sp-pill sp-pill--${color}`} title={title}>
      {icon}
    </span>
  );
}