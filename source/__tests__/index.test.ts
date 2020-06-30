jest.mock('child_process');
jest.mock('pkg-dir');
import pkgDir from 'pkg-dir';
import { mocked } from 'ts-jest/utils';
import { Main } from 'mock-spawn';
const childProcess = jest.requireMock('child_process') as {
  spawn: Main;
};

const { spawn: mockSpawn } = childProcess;
const { sync: mockSync } = mocked(pkgDir, true);

import { toPassPackageAudit } from '..';
expect.extend({ toPassPackageAudit });

function createTable(pkg: string): string {
  return `
  ┌───────────────┬──────────────────────────────────────────────────────────────┐
  │ high          │ Arbitrary File Overwrite                                     │
  ├───────────────┼──────────────────────────────────────────────────────────────┤
  │ Package       │ ${pkg}${' '.repeat(62 - 1 - pkg.length)}│
  ├───────────────┼──────────────────────────────────────────────────────────────┤
  │ Patched in    │ version                                                      │
  ├───────────────┼──────────────────────────────────────────────────────────────┤
  │ Dependency of │ package                                                      │
  ├───────────────┼──────────────────────────────────────────────────────────────┤
  │ Path          │ path                                                         │
  ├───────────────┼──────────────────────────────────────────────────────────────┤
  │ More info     │ link                                                         │
  └───────────────┴──────────────────────────────────────────────────────────────┘
  `;
}

function createPlainTable(pkg: string): string {
  return `
    High            Arbitrary File Overwrite

    Package         ${pkg}${' '.repeat(62 - 1 - pkg.length)}

    Patched in      version

    Dependency of   package

    Path            path

    More info       link
  `;
}

let callCount = 0;

beforeEach(() => {
  jest.clearAllMocks();
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

  describe.each([
    ['bordered table', createTable],
    ['plain table', createPlainTable],
  ])('test %s', (_name, tableFn) => {
    test('vulnerability output', async () => {
      mockSpawn.sequence.add(mockSpawn.simple(8, tableFn('module')));
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(mockSpawn.simple(1, tableFn('module')));
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          tableFn('module') + tableFn('package') + tableFn('example')
        )
      );
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('multiple vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          tableFn('module') + tableFn('package') + tableFn('example')
        )
      );
      callCount++;
      await expect({}).not.toPassPackageAudit({
        allow: ['package'],
      });
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

  describe.each([
    ['bordered table', createTable],
    ['plain table', createPlainTable],
  ])('test %s', (_name, tableFn) => {
    test('vulnerability output allowed', async () => {
      mockSpawn.sequence.add(mockSpawn.simple(8, tableFn('module')));
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('vulnerability output allowed exit code 2', async () => {
      mockSpawn.sequence.add(mockSpawn.simple(2, tableFn('module')));
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          tableFn('module') + tableFn('package') + tableFn('example')
        )
      );
      callCount++;
      await expect({}).toPassPackageAudit({
        allow: ['module', 'package', 'example'],
      });
    });
  });
});

describe('options', () => {
  test('command', async () => {
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
  });

  test('cwd resolved', async () => {
    mockSync.mockImplementationOnce((cwd) =>
      cwd === '/path/to/cwd' ? '/resolved/cwd' : undefined
    );
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].opts).toMatchObject({
      cwd: '/resolved/cwd',
    });
  });

  test('cwd not resolved', async () => {
    mockSync.mockImplementationOnce(() => undefined);
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].opts).toMatchObject({
      cwd: undefined,
    });
  });
});
