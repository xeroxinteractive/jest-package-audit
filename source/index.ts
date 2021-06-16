/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toPassPackageAudit(outputOptions?: OutputOptions): Promise<R>;
    }
  }
}

import { spawn } from 'cross-spawn';
import pkgDir from 'pkg-dir';
import { InputOptions, OutputOptions } from './static';
import getCommand from './helpers/getCommand';
import isYarn from './helpers/isYarn';
import severityGreater from './helpers/severityGreater';

export { InputOptions, OutputOptions };

const heading = 'Package';
const colWidths = [15, 62];
const maxIndent = 16;
const tableWidth = 80;
const col1Pad = colWidths[0] - heading.length;
const severityLine = `^ {0,${maxIndent}}(?:\\│| ) {1,${colWidths[0]}}(\\S{1,${colWidths[0]}}) {1,${colWidths[0]}}(?:\\│| )[ \\w]{0,${colWidths[1]}}\\│?$`;
const dividerLine = `\\s(?:.{${tableWidth},${tableWidth + maxIndent}}\\s)?`;
const packageLine = `^ {0,${maxIndent}}(?:\\│| ) {1,${col1Pad}}Package {1,${col1Pad}}(?:\\│| ) {1,${colWidths[1]}}(\\S{1,${colWidths[1]}})`;
const packageRegex = new RegExp(severityLine + dividerLine + packageLine, 'gm');

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
  inputOptions: InputOptions = {},
  outputOptions: OutputOptions = {}
): Promise<jest.CustomMatcherResult> {
  let pass = true;
  const { cwd } = inputOptions;
  const vulnerabilities: string[] = [],
    allowed: string[] = [];
  let output = Buffer.from(''),
    exitCode: number;

  const root = await pkgDir(cwd);
  if (!root) {
    throw new Error('Cannot find project root.');
  }
  if (typeof inputOptions.yarn === 'undefined') {
    inputOptions.yarn = await isYarn(root);
  }
  const command = getCommand(root, inputOptions);
  try {
    const parts = command.split(' ');
    const child = spawn(parts[0], parts.slice(1), {
      cwd: root,
    });
    // Concatenate all the console output.
    child.stdout?.on('data', (chunk: Buffer | string): void => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      output = output ? Buffer.concat([output, buf]) : buf;
    });

    // Wait for the command to exit, and store the exit code.
    exitCode = await new Promise((resolve): void => {
      child.on('close', (code): void => {
        resolve(code ?? 0);
      });
    });

    // Both NPM and YARN will have an exit code of 0 if there are no vulnerabilities
    // so this skips parsing the output.
    if (exitCode === 0) {
      pass = true;
    } else {
      // Strip ANSI colour encoding.
      const outputString = output.toString().replace(/\u001b\[.*?m/g, '');
      let match;

      // Loop over all the table package matches, adding vulnerabilities where appropriate.
      while ((match = packageRegex.exec(outputString)) !== null) {
        const severity = match[1].toLowerCase().trim();
        const pkg = match[2];
        const allowedSeverity = severityGreater(inputOptions, severity);
        if (allowedSeverity) {
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
