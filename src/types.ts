export interface Args {
  directory?: string;
  concurrency: number;
  from?: string;
  to?: string;
}

export interface Dependencies {
  [name: string]: {
    version: string;
    dependencies?: Dependencies;
  };
}

export interface Package {
  name: string;
  version: string;
}

export interface VersionTime {
  version: string;
  time: Date;
}

export interface PackageInfo {
  name: string;
  version: string;
  latestVersion: string;
  latestTime: Date;
}
