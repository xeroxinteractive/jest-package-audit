jest.mock('child_process');
jest.mock('pkg-dir');
import pkgDir from 'pkg-dir';
import { Main } from 'mock-spawn';
const childProcess: {
  spawn: Main;
} = jest.requireMock('child_process');
import yarnData from './__fixtures__/yarn/data.json';
import yarnSummary from './__fixtures__/yarn/summary.json';
import npmData from './__fixtures__/npm/data.json';
import pnpmData from './__fixtures__/pnpm/data.json';

const { spawn: mockSpawn } = childProcess;
const mockPkgDir = jest.mocked(pkgDir);

import { toPassPackageAudit } from '..';
import { Severity, supportedPackageManagers } from '../static';
expect.extend({ toPassPackageAudit });

function createJSON(
  pkg: string,
  packageManager: typeof supportedPackageManagers[number],
  severity = Severity.INFO
): string {
  switch (packageManager) {
    case 'yarn': {
      const data = { ...yarnData };
      data.data.advisory.module_name = pkg;
      data.data.advisory.severity = severity;
      return JSON.stringify(data) + JSON.stringify(yarnSummary);
    }
    case 'npm': {
      const data = npmData;
      data.advisories['1084'].module_name = pkg;
      data.advisories['1084'].severity = severity;
      return JSON.stringify(data);
    }
    case 'pnpm': {
      const data = pnpmData;
      data.advisories['1069557'].module_name = pkg;
      data.advisories['1069557'].severity = severity;
      return JSON.stringify(data);
    }
  }
}

let callCount = 0;

beforeEach(() => {
  jest.clearAllMocks();
  mockPkgDir.mockReturnValue(Promise.resolve(process.cwd()));
});

describe('fail states', () => {
  test('error thrown', async () => {
    mockSpawn.sequence.add({ throws: new Error('test error.') });
    callCount++;
    await expect({ packageManager: 'npm' }).not.toPassPackageAudit();
  });

  test('random output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, 'random test output'));
    callCount++;
    await expect({ packageManager: 'npm' }).not.toPassPackageAudit();
  });

  describe.each(supportedPackageManagers)('%s table', (packageManager) => {
    test('vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createJSON('module', packageManager))
      );
      callCount++;
      await expect({ packageManager }).not.toPassPackageAudit();
    });

    test('vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(1, createJSON('module', packageManager))
      );
      callCount++;
      await expect({ packageManager }).toPassPackageAudit({
        allow: ['module'],
      });
    });

    test('multiple vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageManager) +
            createJSON('package', packageManager) +
            createJSON('example', packageManager)
        )
      );
      callCount++;
      await expect({ packageManager }).not.toPassPackageAudit();
    });

    test('multiple vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageManager) +
            createJSON('package', packageManager) +
            createJSON('example', packageManager)
        )
      );
      callCount++;
      await expect({ packageManager }).not.toPassPackageAudit({
        allow: ['package'],
      });
    });

    test('severity ignored', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          1,
          createJSON('module', packageManager, Severity.INFO) +
            createJSON('package', packageManager, Severity.MODERATE) +
            createJSON('example', packageManager, Severity.LOW)
        )
      );
      callCount++;
      await expect({
        level: Severity.LOW,
        packageManager,
      }).not.toPassPackageAudit({});
    });
  });
});

describe('pass states', () => {
  test('no output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    callCount++;
    await expect({ packageManager: 'npm' }).toPassPackageAudit();
  });

  describe.each(supportedPackageManagers)('%s table', (packageManager) => {
    test('vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createJSON('module', packageManager))
      );
      callCount++;
      await expect({ packageManager }).toPassPackageAudit({
        allow: ['module'],
      });
    });

    test('vulnerability output allowed exit code 2', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(2, createJSON('module', packageManager))
      );
      callCount++;
      await expect({ packageManager }).toPassPackageAudit({
        allow: ['module'],
      });
    });

    test('multiple vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageManager) +
            createJSON('package', packageManager) +
            createJSON('example', packageManager)
        )
      );
      callCount++;
      await expect({ packageManager }).toPassPackageAudit({
        allow: ['module', 'package', 'example'],
      });
    });

    test('severity ignored', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          0,
          createJSON('module', packageManager, Severity.INFO) +
            createJSON('package', packageManager, Severity.MODERATE) +
            createJSON('example', packageManager, Severity.LOW)
        )
      );
      callCount++;
      await expect({ level: Severity.HIGH, packageManager }).toPassPackageAudit(
        {}
      );
    });
  });
});

describe('options', () => {
  test('command', async () => {
    // This is a Windows compatability thing, so allowing it.
    /* eslint-disable jest/no-conditional-expect */
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ command: 'npm audit' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    const call = mockSpawn.calls[callCount - 1];
    if (call.command.endsWith('.exe')) {
      expect(call.args.slice(-1)[0]).toMatch(/[^\w]*npm[^\w]+audit[^\w]*/);
    } else {
      expect(call.command).toBe('npm');
      expect(call.args).toEqual(['audit']);
    }
    /* eslint-enable jest/no-conditional-expect */
  });
});
