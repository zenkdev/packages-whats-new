import readJson from 'read-package-json';

export type ReadJsonResult = {
  name: string;
  version: string;
  [key: string]: string;
};

export default function readJsonAsync(pathName: string): Promise<ReadJsonResult> {
  return new Promise<ReadJsonResult>((resolve, reject) =>
    readJson(pathName, false, (er: Error | undefined, data: ReadJsonResult) => {
      if (er) {
        reject(er);
      } else {
        resolve(data);
      }
    }),
  );
}
