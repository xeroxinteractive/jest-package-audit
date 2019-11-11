/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R, T> {
      toPassPackageAudit(outputOptions?: OutputOptions): R;
    }
  }
}

import spawn from 'cross-spawn';
import pkgDir from 'pkg-dir';

export interface InputOptions {
  cwd?: string;
  command?: string;
}

export interface OutputOptions {
  allow?: string[];
}

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
  const { command = 'yarn audit', cwd = '../../../' } = inputOptions || {};

  const parts = command.split(' ');
  const vulnerabilities: string[] = [],
    allowed: string[] = [];
  let output = Buffer.from(''),
    exitCode;
  try {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: pkgDir.sync(cwd),
    });
    // Concatenate all the console output.
    child.stdout?.on('data', (chunk: Buffer | string): void => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      output = output ? Buffer.concat([output, buf]) : buf;
    });

    // Wait for the command to exit, and store the exit code.
    exitCode = await new Promise((resolve): void => {
      child.on('close', (code): void => {
        resolve(code);
      });
    });
    // Strip ANSI colour encoding.
    const outputString = output.toString().replace(/\u001b\[.*?m/g, '');
    let match;

    // Loop over all the table package matches, adding vulnerabilities where appropriate.
    while ((match = packageRegex.exec(outputString)) !== null) {
      const pkg = match[1];
      if (outputOptions && outputOptions.allow) {
        if (!outputOptions.allow.includes(pkg)) {
          if (!vulnerabilities.includes(pkg)) {
            vulnerabilities.push(pkg);
          }
          pass = false;
        } else {
          if (!allowed.includes(pkg)) {
            allowed.push(pkg);
          }
        }
      } else {
        if (!vulnerabilities.includes(pkg)) {
          vulnerabilities.push(pkg);
        }
        pass = false;
      }
    }
    // exit code 0 and 8 indicates not a failure,
    // exit code 1 is a failure but if there are no vulnerabilities
    // and at least 1 allowed package then it should pass.
    if (
      !(
        exitCode === 0 ||
        exitCode === 8 ||
        exitCode === 2 ||
        (exitCode === 1 && allowed.length > 0 && vulnerabilities.length === 0)
      )
    ) {
      pass = false;
    }
  } catch (e) {
    pass = false;
    // Add the console output to the output message if it exists.
    output = /^\W*$/.test(output.toString())
      ? Buffer.concat([Buffer.from(' Console: '), output])
      : output;
    // Add a failure message to the output message.
    output = Buffer.concat([
      Buffer.from(`Failed to run ${command}. ${e}`),
      output,
    ]);
  }
  if (!vulnerabilities.length && !allowed.length) {
    if (pass) {
      return {
        message: (): string =>
          `expected ${command} to fail but it passed with output:\n\n${output}`,
        pass: true,
      };
    } else {
      return {
        message: (): string =>
          `expected ${command} to pass but it failed with output:\n\n${output}`,
        pass: false,
      };
    }
  }

  if (pass) {
    return {
      message: (): string =>
        `expected package audit to have vulnerabilities\n\n${command} output:\n\n${output}`,
      pass: true,
    };
  } else {
    return {
      message: (): string =>
        `expected package audit not to have vulnerabilities for ${vulnerabilities
          .map((v): string => `'${v}'`)
          .join(' and ')}\n\n${command} output:\n\n${output}`,
      pass: false,
    };
  }
}
