/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toPassPackageAudit(outputOptions?: OutputOptions): R;
    }
  }
}

jest.setTimeout(10000);
import { spawn } from 'child_process';
import pkgDir from 'pkg-dir';

export interface InputOptions {
  cwd?: string;
  command?: string;
}

export interface OutputOptions {
  allow?: string[];
}

export const defaultInputOptions = {
  cwd: '../../../',
  command: 'yarn audit'
};

const packageRegex = /^\s*│\s*Package\s*│\s*(\S+)\s*│\s*$/gm;

/**
 * Checks if the yarn/npm audit commands pass.
 *
 * @param this - This context for matcher (ignore).
 * @param inputOptions - Options for running the audit.
 * @param outputOptions - Options for checking the audit.
 * @returns Whether the package audit passed or failed.
 */
export async function toPassPackageAudit(
  this: jest.MatcherUtils,
  inputOptions?: InputOptions,
  outputOptions?: OutputOptions
): Promise<jest.CustomMatcherResult> {
  let pass = true;
  inputOptions = {
    ...defaultInputOptions,
    ...inputOptions
  };
  const parts = inputOptions.command.split(' ');
  const vulnerabilities: string[] = [];
  let output = Buffer.from('');
  try {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: pkgDir.sync(inputOptions.cwd)
    });
    child.stdout.on(
      'data',
      (chunk: Buffer | string): void => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        output = output ? Buffer.concat([output, buf]) : buf;
      }
    );
    const events = [
      new Promise(
        (resolve, reject): void => {
          child.on(
            'close',
            (code): void => {
              if (code !== 0 && code !== 8) {
                reject(new Error(`Command failed with exit code ${code}.`));
              } else {
                resolve();
              }
            }
          );
        }
      ),
      new Promise(
        (resolve, reject): void => {
          child.on(
            'exit',
            (code): void => {
              if (code !== 0 && code !== 8) {
                reject(new Error(`Command failed with exit code ${code}.`));
              } else {
                resolve();
              }
            }
          );
        }
      ),
      new Promise(
        (resolve, reject): void => {
          child.on(
            'error',
            (error): void => {
              reject(error);
            }
          );
        }
      )
    ];

    await Promise.all([
      Promise.race(events),
      new Promise(
        (resolve): void => {
          child.stdout.on('end', resolve);
        }
      )
    ]);
    child.kill();
    const outputString = output.toString().replace(/\u001b\[.*?m/g, '');
    let match;

    while ((match = packageRegex.exec(outputString)) !== null) {
      const pkg = match[1];
      if (outputOptions && outputOptions.allow) {
        if (!outputOptions.allow.includes(pkg)) {
          if (!vulnerabilities.includes(pkg)) {
            vulnerabilities.push(pkg);
          }
          pass = false;
        }
      } else {
        if (!vulnerabilities.includes(pkg)) {
          vulnerabilities.push(pkg);
        }
        pass = false;
      }
    }
  } catch (e) {
    pass = false;
    output = Buffer.concat([
      Buffer.from(`Failed to run ${inputOptions.command}. ${e}. Console: `),
      output
    ]);
  }
  if (!vulnerabilities.length) {
    if (pass) {
      return {
        message: (): string =>
          `expected ${
            inputOptions.command
          } to fail but it passed with output:\n\n${output}`,
        pass: true
      };
    } else {
      return {
        message: (): string =>
          `expected ${
            inputOptions.command
          } to pass but it failed with output:\n\n${output}`,
        pass: false
      };
    }
  }

  if (pass) {
    return {
      message: (): string =>
        `expected package audit to have vulnerabilities\n\n${
          inputOptions.command
        } output:\n\n${output}`,
      pass: true
    };
  } else {
    return {
      message: (): string =>
        `expected package audit not to have vulnerabilities for ${vulnerabilities
          .map((v): string => `'${v}'`)
          .join(' and ')}\n\n${inputOptions.command} output:\n\n${output}`,
      pass: false
    };
  }
}
