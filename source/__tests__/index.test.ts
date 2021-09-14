jest.mock('child_process');
jest.mock('pkg-dir');
import pkgDir from 'pkg-dir';
import { mocked } from 'ts-jest/utils';
import { Main } from 'mock-spawn';
const childProcess = jest.requireMock('child_process') as {
  spawn: Main;
};
import yarnData from './__fixtures__/yarn/data.json';
import yarnSummary from './__fixtures__/yarn/summary.json';
import npmData from './__fixtures__/npm/data.json';

const { spawn: mockSpawn } = childProcess;
const mockPkgDir = mocked(pkgDir, true);

import { toPassPackageAudit } from '..';
import { PackageJSONFields, Severity } from '../static';
expect.extend({ toPassPackageAudit });

enum PackageType {
  YARN = 'yarn',
  NPM = 'npm',
}

function createJSON(
  pkg: string,
  type: PackageType,
  severity = Severity.INFO
): string {
  const yarnPkgJSON: PackageJSONFields = yarnData;
  const yarnPkgSummaryJSON: PackageJSONFields = yarnSummary;
  const npmPkgJSON: PackageJSONFields = npmData;

  if (type === 'yarn') {
    yarnPkgJSON.data.advisory.module_name = pkg;
    yarnPkgJSON.data.advisory.severity = severity;
  } else {
    npmPkgJSON.advisories['1084'].module_name = pkg;
    npmPkgJSON.advisories['1084'].severity = severity;
  }

  const data =
    type === 'yarn'
      ? JSON.stringify(yarnPkgJSON) + JSON.stringify(yarnPkgSummaryJSON)
      : JSON.stringify(npmPkgJSON);
  return data;
}

let callCount = 0;

beforeEach(() => {
  jest.clearAllMocks();
  mockPkgDir.mockReturnValue(Promise.resolve(process.cwd()));
});

describe('fail states', () => {
  test('no output exit code 1', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(1));
    callCount++;
    await expect({}).not.toPassPackageAudit();
  });

  test('error thrown', async () => {
    mockSpawn.sequence.add({ throws: new Error('test error.') });
    callCount++;
    await expect({}).not.toPassPackageAudit();
  });

  describe.each(Object.values(PackageType))('%s table', (packageType) => {
    test('vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createJSON('module', packageType))
      );
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(1, createJSON('module', packageType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageType) +
            createJSON('package', packageType) +
            createJSON('example', packageType)
        )
      );
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('multiple vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageType) +
            createJSON('package', packageType) +
            createJSON('example', packageType)
        )
      );
      callCount++;
      await expect({}).not.toPassPackageAudit({
        allow: ['package'],
      });
    });

    test('severity ignored', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          1,
          createJSON('module', packageType, Severity.INFO) +
            createJSON('package', packageType, Severity.MODERATE) +
            createJSON('example', packageType, Severity.LOW)
        )
      );
      callCount++;
      await expect({ level: Severity.LOW }).not.toPassPackageAudit({});
    });
  });
});

describe('pass states', () => {
  test('no output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    callCount++;
    await expect({}).toPassPackageAudit();
  });

  test('random output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, 'random test output'));
    callCount++;
    await expect({}).toPassPackageAudit();
  });

  describe.each(Object.values(PackageType))('%s table', (packageType) => {
    test('vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createJSON('module', packageType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('vulnerability output allowed exit code 2', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(2, createJSON('module', packageType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createJSON('module', packageType) +
            createJSON('package', packageType) +
            createJSON('example', packageType)
        )
      );
      callCount++;
      await expect({}).toPassPackageAudit({
        allow: ['module', 'package', 'example'],
      });
    });

    test('severity ignored', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          0,
          createJSON('module', packageType, Severity.INFO) +
            createJSON('package', packageType, Severity.MODERATE) +
            createJSON('example', packageType, Severity.LOW)
        )
      );
      callCount++;
      await expect({ level: Severity.HIGH }).toPassPackageAudit({});
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

  test('cwd resolved', async () => {
    mockPkgDir.mockReturnValueOnce(Promise.resolve('/resolved/cwd'));
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: './' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].opts).toMatchObject({
      cwd: '/resolved/cwd',
    });
  });

  test('cwd not resolved', async () => {
    mockPkgDir.mockReturnValue(Promise.resolve(undefined));
    await expect(async () => {
      await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    }).rejects.toThrowError();
  });
});
