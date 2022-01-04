/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toPassPackageAudit(outputOptions?: OutputOptions): Promise<R>;
    }
  }
}

import execa from 'execa';
import pkgDir from 'pkg-dir';
import { InputOptions, OutputOptions, PackageJSONFields } from './static';
import getCommand from './helpers/getCommand';
import isYarn from './helpers/isYarn';
import severityGreater from './helpers/severityGreater';

export { InputOptions, OutputOptions };

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
    console.log({ command, root });
    const child = execa(parts[0], parts.slice(1), {
      cwd: root,
    });
    // Concatenate all the console output.
    child.stdout?.on('data', (chunk: Buffer | string): void => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      output = output ? Buffer.concat([output, buf]) : buf;
    });
    child.stderr?.on('data', (chunk: Buffer | string): void => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      output = output ? Buffer.concat([output, buf]) : buf;
    });

    // Wait for the command to exit, and store the exit code.
    exitCode = await new Promise((resolve): void => {
      child.on('close', (code): void => {
        resolve(code);
      });
    });

    console.log({ exitCode });

    // Both NPM and YARN will have an exit code of 0 if there are no vulnerabilities
    // so this skips parsing the output.
    if (exitCode === 0) {
      pass = true;
    } else {
      const outputString = output.toString().replace(/}\s*{/g, '},{');
      const correctedOutputString = `[${outputString}]`;
      const rows: PackageJSONFields[] = JSON.parse(correctedOutputString);

      const matches = [];
      for (const row of rows) {
        if (
          row &&
          'type' in row &&
          row.type === 'auditAdvisory' &&
          'advisory' in row.data
        ) {
          // Process yarn audit --json.
          matches.push({
            packageName: row.data.advisory.module_name,
            packageSeverity: row.data.advisory.severity,
            packageData: row,
          });
        } else if (row && 'advisories' in row) {
          // Process npm audit --json.
          let name = '';
          let severity = '';
          for (const key in row.advisories) {
            const item = row.advisories[key];
            if (item?.module_name && item?.severity) {
              name = item.module_name;
              severity = item.severity;
            }
          }
          if (name && severity) {
            matches.push({
              packageName: name,
              packageSeverity: severity,
              packageData: row,
            });
          }
        }
      }

      // Loop over all the table package matches, adding vulnerabilities where appropriate.
      for (const match of matches) {
        const severity = match.packageSeverity;
        const pkg = match.packageName;
        const allowedSeverity = severityGreater(inputOptions, severity);
        if (allowedSeverity) {
          if (outputOptions && outputOptions.allow) {
            if (typeof outputOptions.allow === 'function') {
              if (outputOptions.allow(match)) {
                if (!allowed.includes(pkg)) {
                  allowed.push(pkg);
                }
              }
            } else {
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
            }
          } else {
            if (!vulnerabilities.includes(pkg)) {
              vulnerabilities.push(pkg);
            }
            pass = false;
          }
        }
      }

      if (vulnerabilities.length > allowed.length) {
        pass = false;
      }
    }
  } catch (e) {
    console.error(e);
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
