jest.mock('child_process');
jest.mock('pkg-dir');
import { MockChildProcess } from '../__mocks__/child_process';
import { MockPkgDir } from '../__mocks__/pkg-dir';

const { mockSpawn } = jest.requireMock('child_process') as MockChildProcess;
const { mockSync } = jest.requireMock('pkg-dir') as MockPkgDir;

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

let callCount = 0;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fail states', () => {
  test('no output exit code 1', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(1));
    await expect({}).not.toPassPackageAudit();
    callCount++;
  });

  test('error thrown', async () => {
    mockSpawn.sequence.add({ throws: new Error('test error.') });
    await expect({}).not.toPassPackageAudit();
    callCount++;
  });

  test('vulnerability output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(8, createTable('module')));
    await expect({}).not.toPassPackageAudit();
    callCount++;
  });

  test('multiple vulnerability output', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        8,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).not.toPassPackageAudit();
    callCount++;
  });

  test('multiple vulnerability output 1 allowed', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        8,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).not.toPassPackageAudit({
      allow: ['package']
    });
    callCount++;
  });
});
describe('pass states', () => {
  test('no output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({}).toPassPackageAudit();
    callCount++;
  });

  test('random output', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0, 'random test output'));
    await expect({}).toPassPackageAudit();
    callCount++;
  });

  test('vulnerability output allowed', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(8, createTable('module')));
    await expect({}).toPassPackageAudit({ allow: ['module'] });
    callCount++;
  });

  test('multiple vulnerability output allowed', async () => {
    mockSpawn.sequence.add(
      mockSpawn.simple(
        8,
        createTable('module') + createTable('package') + createTable('example')
      )
    );
    await expect({}).toPassPackageAudit({
      allow: ['module', 'package', 'example']
    });
    callCount++;
  });
});

describe('options', () => {
  test('command', async () => {
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ command: 'npm audit' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].command).toBe('npm');
    expect(mockSpawn.calls[callCount - 1].args).toEqual(['audit']);
  });

  test('cwd resolved', async () => {
    mockSync.mockImplementationOnce((cwd) =>
      cwd === '/path/to/cwd' ? '/resolved/cwd' : undefined
    );
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].opts).toMatchObject({
      cwd: '/resolved/cwd'
    });
  });

  test('cwd not resolved', async () => {
    mockSync.mockImplementationOnce(() => undefined);
    mockSpawn.sequence.add(mockSpawn.simple(0));
    await expect({ cwd: '/path/to/cwd' }).toPassPackageAudit();
    expect(mockSpawn.calls.length).toBe(++callCount);
    expect(mockSpawn.calls[callCount - 1].opts).toMatchObject({
      cwd: undefined
    });
  });
});
