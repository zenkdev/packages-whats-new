#!/usr/bin/env node

import PromisePool from '@supercharge/promise-pool';
import chalk from 'chalk';
import clear from 'clear';
import cliProgress from 'cli-progress';
import figlet from 'figlet';
import path from 'path';
import yargs from 'yargs/yargs';
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

const logger = console;

clear();
logger.log(chalk.yellow(figlet.textSync('packages-whats-new', { horizontalLayout: 'full' })));

const {
  directory,
  concurrency,
  interval: intervalStr,
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
}).argv as any;

const today = new Date();
const interval = getInterval(intervalStr);
const projectDir = path.join(directory || process.cwd(), 'node_modules');

async function walk(): Promise<string[]> {
  logger.log(chalk.magenta(`Walking through ${projectDir} folder`));

  // create a new progress bar instance and use shades_classic theme
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // start the progress bar with a total value of 100 and start value of 0
  bar.start(100, 0);
  const fileList = walkSync(projectDir);
  const allPackages = new Set<string>();
  fileList.forEach(file => allPackages.add(file));
  // update the current value in your application..
  bar.update(100);

  // stop the progress bar
  bar.stop();

  return Array.from(allPackages);
}

async function collect(data: string[]): Promise<ModuleInfo[]> {
  logger.log(chalk.magenta('Collecting packages information'));

  // create a new progress bar instance and use shades_classic theme
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // start the progress bar with a total value of 200 and start value of 0
  bar.start(data.length, 0);

  const errors: Array<[string, Error]> = [];
  const { results } = await PromisePool.withConcurrency(concurrency)
    .for(data)
    .handleError(async (error: Error, pathName: string) => {
      bar.increment(1);
      errors.push([pathName, error]);
    })
    .process(async (pathName: string): Promise<ModuleInfo> => {
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
    });

  // stop the progress bar
  bar.stop();

  if (errors.length) {
    errors.forEach(([pathName, error]) => logger.error(chalk.red(`${pathName} => ${error.message}`)));
  }

  return results;
}

async function bootstrap() {
  const data = await walk();
  const results = await collect(data);

  logger.table(results.filter(x => dateDiffInDays(x.latestDate, today) < interval));
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((reason: Error) => {
    logger.error('Error:', reason);
    process.exit(1);
  });
