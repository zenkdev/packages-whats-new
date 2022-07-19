import { exec } from 'child_process';
import { Package } from './types';

interface Dependencies {
  [name: string]: {
    version: string;
    dependencies?: Dependencies;
  };
}

const getKey = ({ name, version }: Package) => `${name}_${version}`;

function getPackages(dependencies: Dependencies): Package[] {
  const pkgs = new Map<string, Package>();
  const names = Object.keys(dependencies);
  for (let n = 0; n < names.length; n += 1) {
    const name = names[n];
    const { version, dependencies: childDependencies } = dependencies[name];
    const pkg: Package = { name, version };
    const key = getKey(pkg);
    if (!pkgs.has(key)) pkgs.set(key, pkg);
    if (childDependencies) {
      const childPkgs = getPackages(childDependencies);
      for (let m = 0; m < childPkgs.length; m += 1) {
        const childPkg = childPkgs[m];
        const childKey = getKey(childPkg);
        if (!pkgs.has(childKey)) pkgs.set(childKey, childPkg);
      }
    }
  }

  return Array.from(pkgs.values());
}

export default function readPackages(projectDir: string): Promise<Package[]> {
  return new Promise((resolve, reject) => {
    exec('npm list --json', { cwd: projectDir, encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const { dependencies } = JSON.parse(stdout) as { dependencies: Dependencies };
        const packages = getPackages(dependencies);
        resolve(packages);
      }
    });
  });
}
