import { PackageInfo } from './types';

const logger = console;

const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function padLeft(value: string, length: number, pad = ' ') {
  const str = value || '';
  const strLenght = str.length;
  if (strLenght >= length) return str;
  return Array(length - strLenght + 1).join(pad) + str;
}

function padRight(value: string, length: number, pad = ' ') {
  try {
    const str = value || '';
    const strLenght = str.length;
    if (strLenght >= length) return str;
    return str + Array(length - strLenght + 1).join(pad);
  } catch (e) {
    logger.info(value, length, pad);
    throw e;
  }
}

function formatTime(value: Date) {
  if (!value) return '';
  const pad20 = (n: number) => padLeft(String(n), 2, '0');
  return `${pad20(value.getDate())}-${monthName[value.getMonth()]}-${pad20(value.getFullYear() - 2000)} ${pad20(
    value.getHours(),
  )}:${pad20(value.getMinutes())}`;
}

export default function prettyPrint(pkgs: PackageInfo[]) {
  logger.log(`total ${pkgs.length}`);

  let versionWidth = 0;
  let latestVersionWidth = 0;
  let latestTimeWidth = 0;

  for (let n = 0; n < pkgs.length; n += 1) {
    const { version, latestVersion, latestTime } = pkgs[n];
    versionWidth = Math.max(versionWidth, version?.length || 0);
    latestVersionWidth = Math.max(latestVersionWidth, latestVersion?.length || 0);
    latestTimeWidth = Math.max(latestTimeWidth, formatTime(latestTime).length);
  }

  for (let n = 0; n < pkgs.length; n += 1) {
    const pkg = pkgs[n];
    logger.log(
      `${padRight(pkg.version, versionWidth)} ${padRight(pkg.latestVersion, latestVersionWidth)} ${padRight(
        formatTime(pkg.latestTime),
        latestTimeWidth,
      )} ${pkg.name}`,
    );
  }
}
