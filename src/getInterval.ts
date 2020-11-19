export default function getInterval(str: string): number {
  const period = str.slice(-1) ?? 'm';
  let num = Number(str.slice(0, str.length - 1));
  if (Number.isNaN(num)) {
    num = 1;
  }
  switch (period) {
    case 'y':
      return num * 365;
    case 'm':
      return num * 30;
    case 'w':
      return num * 7;
    default:
      return num;
  }
}
