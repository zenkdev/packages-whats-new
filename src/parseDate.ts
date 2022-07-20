export default function parseDate(str?: string): Date | undefined {
  if (!str) return undefined;
  try {
    return new Date(str);
  } catch (e) {
    // ignored
  }
  const num = Number(str.slice(0, str.length - 1));
  if (Number.isNaN(num)) return undefined;

  const today = new Date();
  const period = str.slice(-1);
  switch (period) {
    case 'y':
      return new Date(today.getFullYear() - num, today.getMonth(), today.getDate());
    case 'm':
      return new Date(today.getFullYear(), today.getMonth() - num, today.getDate());
    case 'd':
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() - num);
    default:
      return undefined;
  }
}
