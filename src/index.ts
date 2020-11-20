import PromisePool from '@supercharge/promise-pool';
import appRoot from 'app-root-path';
import cliProgress from 'cli-progress';
import path from 'path';
import chalk from 'chalk';
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

async function walk(): Promise<string[]> {
  console.log(chalk.magenta('Walking through node_modules folder:'));

  // create a new progress bar instance and use shades_classic theme
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // start the progress bar with a total value of 200 and start value of 0
  bar.start(100, 0);
  const fileList = walkSync(path.join(appRoot.path, 'node_modules'));
  const allPackages = new Set<string>();
  fileList.forEach(file => allPackages.add(file));
  // update the current value in your application..
  bar.update(100);

  // stop the progress bar
  bar.stop();

  return Array.from(allPackages);
}

async function collect(data: string[]): Promise<ModuleInfo[]> {
  console.log(chalk.magenta('Collecting package information:'));

  // create a new progress bar instance and use shades_classic theme
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // start the progress bar with a total value of 200 and start value of 0
  bar.start(data.length, 0);

  const errors: Array<[string, Error]> = [];
  const { results } = await PromisePool.withConcurrency(10)
    .for(data)
    .handleError(async (error: Error, pathName: string) => {
      bar.increment(1);
      errors.push([pathName, error]);
    })
    .process(
      async (pathName: string): Promise<ModuleInfo> => {
        const { name, version } = await readJsonAsync(pathName);
        const [latestVersion, latestDate] = await latestVersionAsync(name);
        // update the current value in your application..
        bar.increment(1);
        return {
          pathName,
          name,
          version,
          latestVersion,
          latestDate,
        } as ModuleInfo;
      },
    );

  // stop the progress bar
  bar.stop();

  if (errors.length) {
    errors.forEach(([pathName, error]) => console.error(chalk.red(`${pathName} => ${error.message}`)));
  }

  return results;
}

async function bootstrap() {
  const data = await walk();
  const results = await collect(data.slice(0, 100));

  console.table(results.filter(x => dateDiffInDays(x.latestDate, today) < interval));
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((reason: Error) => {
    console.error('Error:', reason);
    process.exit(1);
  });
