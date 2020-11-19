import PromisePool from '@supercharge/promise-pool';
import appRoot from 'app-root-path';
import path from 'path';
import dateDiffInDays from './dateDiffInDays';
import getInterval from './getInterval';
import latestVersionAsync from './latestVersionAsync';
import readJsonAsync, { ReadJsonResult } from './readJsonAsync';
import walkSync from './walkSync';

type ModuleInfo = ReadJsonResult & {
  pathName: string;
  latestVersion: string;
  latestDate: Date;
};

const today = new Date();
const interval = getInterval(process.argv[2] ?? '1m');

async function processPackages() {
  const allPackages = new Set<string>();
  const fileList = walkSync(path.join(appRoot.path, 'node_modules'));
  fileList.forEach(file => allPackages.add(file));

  const { results } = await PromisePool.withConcurrency(10)
    .for(Array.from(allPackages))
    .handleError(async (error: Error, pathName: string) => {
      console.error(`${pathName} =>`, error.message);
    })
    .process(
      async (pathName: string): Promise<ModuleInfo> => {
        const { name, version } = await readJsonAsync(pathName);
        const [latestVersion, latestDate] = await latestVersionAsync(name);
        return {
          pathName,
          name,
          version,
          latestVersion,
          latestDate,
        } as ModuleInfo;
      },
    );

  console.table(results.filter(x => dateDiffInDays(x.latestDate, today) < interval));
}

processPackages()
  .then(() => {
    process.exit(0);
  })
  .catch((reason: Error) => {
    console.error('Error:', reason);
    process.exit(1);
  });
