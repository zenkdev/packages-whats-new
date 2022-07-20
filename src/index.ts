#!/usr/bin/env node

import PromisePool from '@supercharge/promise-pool';
import chalk from 'chalk';
import clear from 'clear';
import cliProgress from 'cli-progress';
import figlet from 'figlet';
import yargs from 'yargs/yargs';
import fs from 'fs';
import readPackages from './readPackages';
import getLatestVersion from './getLatestVersion';
import { Args, Package, PackageInfo } from './types';
import parseDate from './parseDate';

const logger = console;

clear();
logger.log(chalk.yellow(figlet.textSync('packages-whats-new', { horizontalLayout: 'full' })));

const {
  directory,
  concurrency,
  from: fromStr,
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
  from: {
    type: 'string',
    description: 'Minimum release date, eq: 1y, 2m, 3d or 01/01/2022.',
  },
  to: {
    type: 'string',
    description: 'Maximum release date, eq: 1y, 2m, 3d or 01/01/2022.',
  },
}).argv as Args;

const projectDir = directory || process.cwd();
const from = parseDate(fromStr);
const to = parseDate(toStr);

function checkProjectDirExists(): Promise<boolean> {
  return new Promise(resolve => {
    fs.exists(projectDir, exists => {
      resolve(exists);
    });
  });
}

async function collect(pkgs: Package[]): Promise<PackageInfo[]> {
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
    .process(async ({ name, version }: Package): Promise<PackageInfo> => {
      const { version: latestVersion, time: latestTime } = await getLatestVersion(name, { from, to });
      // update the current value in your application..
      bar.increment(1);
      return {
        name,
        version,
        latestVersion,
        latestTime,
      } as PackageInfo;
    });

  // stop the progress bar
  bar.stop();

  if (errors.length) {
    errors.forEach(([packageName, error]) => logger.error(chalk.red(`${packageName} => ${error.message}`)));
  }

  return results;
}

async function bootstrap() {
  if (!(await checkProjectDirExists())) {
    logger.error(chalk.red(`Folder '${projectDir}' not found.`));
    return;
  }
  logger.log(chalk.magenta(`Reading packages from '${projectDir}'...`));
  const pkgs = await readPackages(projectDir, logger.error);
  logger.log(chalk.magenta('Collecting packages information...'));
  const results = await collect(pkgs);

  logger.table(results.filter(x => x.version !== x.latestVersion));
}

bootstrap()
  .then(() => {
    process.exit(0);
  })
  .catch((reason: Error) => {
    logger.error('Error:', reason);
    process.exit(1);
  });
