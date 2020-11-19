import packageJson from 'package-json';

type LatestVersionResult = [string, Date];

export default async function latestVersionAsync(packageName: string): Promise<LatestVersionResult> {
  const { time } = await packageJson(packageName, { allVersions: true });
  const timeEntries = Object.entries(time as Record<string, string>);

  return [timeEntries[0][0], new Date(timeEntries[0][1])];
}
