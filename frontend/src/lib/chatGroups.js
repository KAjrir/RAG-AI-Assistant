// lib/chatGroups.js
// Groepeert gesprekken op laatste activiteit: Vandaag, Gisteren, Afgelopen 7 dagen, …
// Heeft geen enkel gesprek een datum, dan één groep zonder kopje.

export function chatDate(chat) {
  const raw = chat.updated_at ?? chat.created_at;
  const d   = raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d : null;
}

export function groupChats(chats) {
  if (!chats.length) return [];
  if (!chats.some(chatDate)) return [{ label: null, chats }];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;

  const buckets = [
    { label: 'Vandaag',            from: startOfToday.getTime() },
    { label: 'Gisteren',           from: startOfToday.getTime() - DAY },
    { label: 'Afgelopen 7 dagen',  from: startOfToday.getTime() - 7 * DAY },
    { label: 'Afgelopen 30 dagen', from: startOfToday.getTime() - 30 * DAY },
    { label: 'Ouder',              from: -Infinity },
  ].map(b => ({ ...b, chats: [] }));

  for (const chat of chats) {
    const t = chatDate(chat)?.getTime() ?? Date.now(); // zonder datum = net aangemaakt
    buckets.find(b => t >= b.from).chats.push(chat);
  }

  return buckets.filter(b => b.chats.length > 0);
}

// Nieuwste eerst
export function sortChatsByRecent(chats) {
  return [...chats].sort((a, b) => (chatDate(b)?.getTime() ?? Date.now()) - (chatDate(a)?.getTime() ?? Date.now()));
}