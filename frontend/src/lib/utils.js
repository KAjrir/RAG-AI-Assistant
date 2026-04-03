export const random = () => {
    return Math.floor(Math.random() * 1e5);
}

export const formatTimeAgo = (date) => {
  const now = Date.now();
  const input = new Date(date).getTime();
  const diff = now - input;

  const day = 1000 * 60 * 60 * 24;

  // ≥ 24 uur → datum tonen
  if (diff >= day) {
    const d = new Date(input);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }

  // < 24 uur → "time ago"
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours >= 1) return `${hours}u geleden`;
  if (minutes >= 1) return `${minutes}m geleden`;
  if (seconds >= 0) return `${seconds}s geleden`;

  return 'net';
}

export const sortDocs = (docs) => {
  const statussen = {
    failed: 3,
    processing: 2,
    completed: 1
  }

  return (
    docs.sort((a, b) => {
      const statusA = statussen[a.status]
      const statusB = statussen[b.status]

      if (statusA > statusB) return -1;
      if (statusA < statusB) return 1;

      const dateA = new Date(a.uploaded_at).getTime()
      const dateB = new Date(b.uploaded_at).getTime()

      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;

      return 0

    })
  )
}

export const formatFileSize = (byteSize) => {
  const kb = 1024;
  if (byteSize >= kb * kb) return `${(byteSize / (kb * kb)).toFixed(2)} MB`;
  if (byteSize >= kb)      return `${(byteSize / kb).toFixed(2)} KB`;
  return `${byteSize} B`;
}