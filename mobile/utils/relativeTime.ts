function diffParts(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return { seconds, minutes, hours, days };
}

/** "5 минутын өмнө" style, for detail/comment views. */
export function relativeTime(value: string) {
  const { seconds, minutes, hours, days } = diffParts(value);
  if (seconds < 60) return 'дөнгөж сая';
  if (minutes < 60) return `${minutes} минутын өмнө`;
  if (hours < 24) return `${hours} цагийн өмнө`;
  return `${days} өдрийн өмнө`;
}

/** "5м" style, for dense feed/list rows. */
export function relativeTimeCompact(value: string) {
  const { seconds, minutes, hours, days } = diffParts(value);
  if (seconds < 60) return 'дөнгөж';
  if (minutes < 60) return `${minutes}м`;
  if (hours < 24) return `${hours}ц`;
  return `${days}ө`;
}
