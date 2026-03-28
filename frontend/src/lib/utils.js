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
  if (seconds >= 1) return `${seconds}s geleden`;

  return 'net';
}

export const sortDocs = (docs) => {
  const statussen = {
    error: 3,
    processing: 2,
    indexed: 1
  }

  return (
    docs.sort((a, b) => {
      if ( statussen[a.status] > statussen[b.status]) return -1
      if ( statussen[a.status] < statussen[b.status]) return 1
      if (new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime()) return -1
    })
  )
}

export const formatFileSize = (byteSize) => {
  const kb = 1024;
  if (byteSize >= kb * kb) return `${(byteSize / (kb * kb)).toFixed(2)} MB`;
  if (byteSize >= kb)      return `${(byteSize / kb).toFixed(2)} KB`;
  return `${byteSize} B`;
}