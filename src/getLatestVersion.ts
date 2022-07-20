import packageJson from 'package-json';
import { VersionTime } from './types';

export default async function getLatestVersion(
  packageName: string,
  { from, to }: { from?: Date; to?: Date } = {},
): Promise<VersionTime> {
  const metadata = await packageJson(packageName, { allVersions: true, fullMetadata: true });
  if (!metadata || !metadata.time) throw new Error(`Can't read metadata.`);
  const [timeEntry] = Object.entries(metadata.time)
    .filter(([key]) => !['created', 'modified'].includes(key))
    .map(([key, value]) => [key, new Date(value)] as [string, Date])
    .filter(([, time]) => (!from || time >= from) && (!to || time < to))
    .sort(([, atime], [, btime]) => btime.getTime() - atime.getTime());
  if (!timeEntry) throw new Error(`Metadata doesn't contain any versions`);

  return { version: timeEntry[0], time: timeEntry[1] };
}
