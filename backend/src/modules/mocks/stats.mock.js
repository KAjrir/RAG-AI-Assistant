export const mockStats = {
  docs: 1,
  connections: 0,
  members: 1,
};

export const mockDocs = [
  {
    id: 1,
    name: 'Producthandleiding v3.pdf',
    size: '2,4 MB',
    chunks: 3,
    tokens: 18200,
    pageCount: 34,
    status: 'indexed',
    uploadedAt: new Date('2026-03-25T19:30:00'),

  },
  {
    id: 2,
    name: 'FAQ klanten 2024.docx',
    size: '820 KB',
    chunks: null,
    tokens: null,
    pageCount: null,
    status: 'processing',
    uploadedAt: new Date('2026-03-25T21:10:00'),
  },
  {
    id: 3,
    name: 'HR beleid 2024.pdf',
    size: '1,1 MB',
    chunks: 3,
    tokens: 9800,
    pageCount: 18,
    status: 'indexed',
    uploadedAt: new Date('2026-03-23T20:15:00'),
  },
  {
    id: 4,
    name: 'Onboarding handleiding.pdf',
    size: '3,2 MB',
    chunks: null,
    tokens: null,
    pageCount: null,
    status: 'error',
    uploadedAt: new Date('2026-03-25T16:45:00'),

  },
  {
    id: 5,
    name: 'Verkoopscript Q1 2025.docx',
    size: '540 KB',
    chunks: 2,
    tokens: 7100,
    pageCount: 12,
    status: 'indexed',
    uploadedAt: new Date('2026-03-20T14:00:00'),
  },
];

export const mockChunks = [
 
  // ── Doc 1: Producthandleiding v3.pdf ──────────────────────────────
  {
    id: 1,
    documentId: 1,
    documentType: 'document',
    content: 'Het product kan worden geïnstalleerd via de installatiewizard. Volg de stappen op het scherm en herstart het systeem na voltooiing.',
    tokens: 38,
    videos: [],
    links: [],
    images: [],
    metadata: { title: 'Producthandleiding v3', tags: 'installatie, setup', page: 1 },
  },
  {
    id: 2,
    documentId: 1,
    documentType: 'document',
    content: 'Na de installatie kun je het product activeren met je licentiecode. Ga naar Instellingen → Activering en voer de code in.',
    tokens: 41,
    videos: [],
    links: [{ url: 'https://activeer.voorbeeld.nl', text: 'Activeringsportaal' }],
    images: [],
    metadata: { title: 'Producthandleiding v3', tags: 'activering, licentie', page: 3 },
  },
  {
    id: 3,
    documentId: 1,
    documentType: 'document',
    content: 'Bekijk de introductievideo voor een visuele uitleg van de belangrijkste functies.',
    tokens: 22,
    videos: ['https://www.youtube.com/watch?v=example1'],
    links: [],
    images: [{ url: 'https://cdn.voorbeeld.nl/thumb1.png', alt: 'Preview video' }],
    metadata: { title: 'Producthandleiding v3', tags: 'video, introductie', page: 5 },
  },
 
  // ── Doc 3: HR beleid 2024.pdf ─────────────────────────────────────
  {
    id: 4,
    documentId: 3,
    documentType: 'document',
    content: 'Medewerkers hebben recht op 25 vakantiedagen per jaar. Vakantiedagen worden opgebouwd op basis van het aantal gewerkte uren.',
    tokens: 44,
    videos: [],
    links: [],
    images: [],
    metadata: { title: 'HR beleid 2024', tags: 'vakantie, verlof', page: 2 },
  },
  {
    id: 5,
    documentId: 3,
    documentType: 'document',
    content: 'Verlofaanvragen dienen minimaal twee weken van tevoren ingediend te worden via het HR-portaal. Spoedeisende aanvragen worden per geval beoordeeld.',
    tokens: 48,
    videos: [],
    links: [{ url: 'https://hr.voorbeeld.nl/verlof', text: 'HR-portaal verlof aanvragen' }],
    images: [],
    metadata: { title: 'HR beleid 2024', tags: 'verlof, aanvraag', page: 4 },
  },
  {
    id: 6,
    documentId: 3,
    documentType: 'document',
    content: 'Bij ziekte dient de medewerker zich voor 09:00 uur ziek te melden bij de direct leidinggevende. Na twee weken ziekte volgt een gesprek met de bedrijfsarts.',
    tokens: 52,
    videos: [],
    links: [],
    images: [],
    metadata: { title: 'HR beleid 2024', tags: 'ziekte, verzuim', page: 7 },
  },
 
  // ── Doc 5: Verkoopscript Q1 2025.docx ────────────────────────────
  {
    id: 7,
    documentId: 5,
    documentType: 'document',
    content: 'Openingszin: "Goedemiddag, u spreekt met [naam] van [bedrijf]. Ik bel u naar aanleiding van uw aanvraag via onze website."',
    tokens: 36,
    videos: [],
    links: [],
    images: [],
    metadata: { title: 'Verkoopscript Q1 2025', tags: 'opening, telefonisch', page: 1 },
  },
  {
    id: 8,
    documentId: 5,
    documentType: 'document',
    content: 'Bezwaar: "Ik heb er even geen tijd voor." Reactie: "Dat begrijp ik volledig. Wanneer schikt het wel? Ik plan graag een kort gesprek van 10 minuten."',
    tokens: 45,
    videos: [],
    links: [],
    images: [{ url: 'https://cdn.voorbeeld.nl/bezwaar-flowchart.png', alt: 'Bezwaar flowchart' }],
    metadata: { title: 'Verkoopscript Q1 2025', tags: 'bezwaar, afhandeling', page: 6 },
  },
];

export const mockConnections = [

  {
    googleDrive: "https://googleapis.com/v2/oauth/spreads",
    notion: "https://notionapis.com/v150/oauth/addNotionInDeMotion"
  }
]