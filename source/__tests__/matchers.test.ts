jest.mock('child_process');
jest.mock('pkg-dir');
import { MockChildProcess } from '../__mocks__/child_process';
import { MockPkgDir } from '../__mocks__/pkg-dir';

const { mockSpawn } = jest.requireMock('child_process') as MockChildProcess;
const { mockSync } = jest.requireMock('pkg-dir') as MockPkgDir;
const errorSpy = jest.spyOn(console, 'error');

import { toPassPackageAudit } from '../matchers';
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

// async function matcher(
//   inputOptions: InputOptions = {},
//   outputOptions?: OutputOptions
// ): Promise<void> {
//   await expect(inputOptions).toPassPackageAudit(outputOptions);
// }

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fail states', () => {
  test('no output exit code 1', async () => {
    errorSpy.mockImplementationOnce(() => {});
    mockSpawn.sequence.add(mockSpawn.simple(1));
    await expect({}).not.toPassPackageAudit();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to run yarn audit. Error: Command failed with exit code 1.'
    );
  });

  test('error thrown', async () => {
    errorSpy.mockImplementationOnce(() => {});
    mockSpawn.sequence.add({ throws: new Error('test error.') });
    await expect({}).not.toPassPackageAudit();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to run yarn audit. Error: test error.'
    );
  });

  test('vulnerability output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, createTable('module')));
    await expect({}).not.toPassPackageAudit();
  });

  test('multiple vulnerability output', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        0,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).not.toPassPackageAudit();
  });

  test('multiple vulnerability output 1 allowed', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        0,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).not.toPassPackageAudit({
      allow: ['package']
    });
  });
});
describe('pass states', () => {
  test('no output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({}).toPassPackageAudit();
  });

  test('random output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, 'random test output'));
    await expect({}).toPassPackageAudit();
  });

  test('vulnerability output allowed', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, createTable('module')));
    await expect({}).toPassPackageAudit({ allow: ['module'] });
  });

  test('multiple vulnerability output allowed', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        0,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).toPassPackageAudit({
      allow: ['module', 'package', 'example']
    });
  });
});

describe('options', () => {
  test('command', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ command: 'npm audit' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(10);
    expect(mockSpawn.calls[9].command).toBe('npm');
    expect(mockSpawn.calls[9].args).toEqual(['audit']);
  });

  test('cwd resolved', async () => {
    mockSync.mockImplementationOnce((cwd) =>
      cwd === '/path/to/cwd' ? '/resolved/cwd' : undefined
    );
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(11);
    expect(mockSpawn.calls[10].opts).toMatchObject({ cwd: '/resolved/cwd' });
  });

  test('cwd not resolved', async () => {
    mockSync.mockImplementationOnce(() => undefined);
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(12);
    expect(mockSpawn.calls[11].opts).toMatchObject({ cwd: undefined });
  });
});
