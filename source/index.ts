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
import {
  InputOptions,
  InputOptionsWithPackageManager,
  isSupportedPackageManager,
  OutputOptions,
} from './static';
import getCommand from './helpers/getCommand';
import processOutput from './helpers/processOutput';
import isExecaError from './helpers/isExecaError';
import { detect } from '@antfu/ni';

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
  let vulnerabilities: string[] = [],
    allowed: string[] = [];
  let output = '';

  const root = await pkgDir(cwd);
  if (!root) {
    throw new Error('Cannot find project root.');
  }
  if (typeof inputOptions.packageManager === 'undefined') {
    const packageManager = await detect({ autoInstall: false, cwd: root });
    if (isSupportedPackageManager(packageManager)) {
      inputOptions.packageManager = packageManager;
    }
  }

  if (typeof inputOptions.packageManager === 'undefined') {
    throw new Error(
      'Unkown package manager, make sure you have some-sort of lockfile, or directly specify the `packageManager` option.'
    );
  }

  const parsedInputOptions = inputOptions as InputOptionsWithPackageManager;

  const command = getCommand(root, parsedInputOptions);

  const handleError = (error: unknown): jest.CustomMatcherResult => {
    pass = false;
    if (isExecaError(error)) {
      return {
        pass: false,
        message: () => error.shortMessage,
      };
    } else {
      if (error && (error instanceof Error || typeof error === 'string')) {
        return {
          pass: false,
          message: () => `Command failed: ${command}\n${error.toString()}`,
        };
      } else {
        return { pass: false, message: () => `Command failed` };
      }
    }
  };

  try {
    const child = await execa.command(command, {
      cwd: root,
      all: true,
    });

    // Both NPM and YARN will have an exit code of 0 if there are no vulnerabilities
    // so this skips parsing the output.
    if (child.exitCode === 0) {
      pass = true;
    } else {
      output = child.all?.toString() ?? '';
      if (output) {
        ({ vulnerabilities, allowed } = processOutput(
          output,
          parsedInputOptions,
          outputOptions
        ));
      }
    }
  } catch (error) {
    if (isExecaError(error)) {
      try {
        output = error.all?.toString() ?? '';
        if (output) {
          ({ vulnerabilities, allowed } = processOutput(
            output,
            parsedInputOptions,
            outputOptions
          ));
        } else if (error.exitCode !== 0) {
          return handleError(error);
        }
      } catch (error) {
        return handleError(error);
      }
    } else {
      return handleError(error);
    }
  }

  if (vulnerabilities.length) {
    pass = false;
  }

  const allowedMessage = allowed.length
    ? `, ${allowed.map((v): string => `'${v}'`).join(' and ')} ${
        allowed.length === 1 ? 'was' : 'were'
      } manually allowed`
    : '';

  if (pass) {
    return {
      message: (): string =>
        `expected package audit to have vulnerabilities${allowedMessage}`,
      pass: true,
    };
  } else {
    return {
      message: (): string =>
        `expected package audit not to have vulnerabilities for ${vulnerabilities
          .map((v): string => `'${v}'`)
          .join(' and ')}${allowedMessage}`,
      pass: false,
    };
  }
}
