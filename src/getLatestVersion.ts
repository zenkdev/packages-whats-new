import packageJson from 'package-json';

interface LatestVersion {
  version: string;
  date: Date;
}

export default async function getLatestVersion(
  packageName: string,
  { to }: { to?: Date } = {},
): Promise<LatestVersion> {
  const metadata = await packageJson(packageName, { allVersions: true, fullMetadata: true });
  if (!metadata || !metadata.time) throw new Error(`Can't read metadata`);
  let timeEntries = Object.entries(metadata.time)
    .filter(timeEntry => !['created', 'modified'].includes(timeEntry[0]))
    .sort((a, b) => {
      const da = Date.parse(a[1]);
      const db = Date.parse(b[1]);
      return db - da;
    });
  if (to) {
    timeEntries = timeEntries.filter(timeEntry => {
      const date = new Date(timeEntry[1]);
      return date < to;
    });
  }

  return { version: timeEntries[0][0], date: new Date(timeEntries[0][1]) };
}
