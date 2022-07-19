#!/usr/bin/env node

import PromisePool from '@supercharge/promise-pool';
import chalk from 'chalk';
import clear from 'clear';
import cliProgress from 'cli-progress';
import figlet from 'figlet';
import yargs from 'yargs/yargs';
import dateDiffInDays from './dateDiffInDays';
import getInterval from './getInterval';
import readPackages from './readPackages';
import getLatestVersion from './getLatestVersion';
import { Package } from './types';

interface Args {
  directory?: string;
  concurrency: number;
  interval: string;
  to?: string;
}

interface ModuleInfo {
  name: string;
  version: string;
  latestVersion: string;
  latestDate: Date;
}

const logger = console;

clear();
logger.log(chalk.yellow(figlet.textSync('packages-whats-new', { horizontalLayout: 'full' })));

const {
  directory,
  concurrency,
  interval: intervalStr,
  to: toStr,
} = yargs(process.argv.slice(2)).options({
  concurrency: {
    type: 'number',
    alias: 'c',
    default: 10,
    description: 'The number of concurrent requests',
  },
  directory: {
    type: 'string',
    alias: 'd',
    description: 'The project directory',
  },
  interval: {
    type: 'string',
    alias: 'i',
    default: '1w',
    description: 'The interval',
  },
  to: {
    type: 'string',
    description: 'Version date to',
  },
}).argv as Args;

const today = new Date();
const interval = getInterval(intervalStr);
const projectDir = directory || process.cwd();
let to: Date | undefined;
try {
  to = toStr ? new Date(toStr) : undefined;
} catch (e) {
  to = undefined;
}

async function collect(pkgs: Package[]): Promise<ModuleInfo[]> {
  logger.log(chalk.magenta('Collecting packages information'));

  // create a new progress bar instance and use shades_classic theme
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // start the progress bar with a total value of 200 and start value of 0
  bar.start(pkgs.length, 0);

  const errors: Array<[string, Error]> = [];
  const { results } = await PromisePool.withConcurrency(concurrency)
    .for(pkgs)
    .handleError(async (error: Error, { name }: Package) => {
      bar.increment(1);
      errors.push([name, error]);
    })
    .process(async ({ name, version }: Package): Promise<ModuleInfo> => {
      const { version: latestVersion, date: latestDate } = await getLatestVersion(name, { to });
      // update the current value in your application..
      bar.increment(1);
      return {
        name,
        version,
        latestVersion,
        latestDate,
      } as ModuleInfo;
    });

  // stop the progress bar
  bar.stop();

  if (errors.length) {
    errors.forEach(([pathName, error]) => logger.error(chalk.red(`${pathName} => ${error.message}`)));
  }

  return results;
}

async function bootstrap() {
  logger.log(chalk.magenta(`Reading packages from ${projectDir}`));
  const pkgs = await readPackages(projectDir);
  const results = await collect(pkgs);

  logger.table(results.filter(x => x.version !== x.latestVersion && dateDiffInDays(x.latestDate, today) < interval));
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((reason: Error) => {
    logger.error('Error:', reason);
    process.exit(1);
  });
