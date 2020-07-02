jest.mock('child_process');
jest.mock('pkg-dir');
import pkgDir from 'pkg-dir';
import CliTable3, { TableConstructorOptions } from 'cli-table3';
import { mocked } from 'ts-jest/utils';
import { Main } from 'mock-spawn';
const childProcess = jest.requireMock('child_process') as {
  spawn: Main;
};

const { spawn: mockSpawn } = childProcess;
const mockPkgDir = mocked(pkgDir, true);

import { toPassPackageAudit } from '..';
expect.extend({ toPassPackageAudit });

enum TableType {
  DEFAULT = 'default',
  NO_UNICODE = 'no unicode',
}

const blankChars = {
  top: ' ',
  'top-mid': ' ',
  'top-left': ' ',
  'top-right': ' ',
  bottom: ' ',
  'bottom-mid': ' ',
  'bottom-left': ' ',
  'bottom-right': ' ',
  left: ' ',
  'left-mid': ' ',
  mid: ' ',
  'mid-mid': ' ',
  right: ' ',
  'right-mid': ' ',
  middle: ' ',
};

function createTable(pkg: string, type: TableType): string {
  const tableOptions: TableConstructorOptions = {
    colWidths: [15, 62],
    wordWrap: true,
  };
  if (type === TableType.NO_UNICODE) {
    tableOptions.chars = blankChars;
  }
  const table = new CliTable3(tableOptions);
  table.push(['high', 'Arbitrary File Overwrite']);
  table.push(['Package', pkg]);
  table.push(['Patched in', 'version']);
  table.push(['Dependency of', 'package']);
  table.push(['Path', 'path']);
  table.push(['More info', 'link']);
  return table.toString();
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

  describe.each(Object.values(TableType))('%s table', (tableType) => {
    test('vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createTable('module', tableType))
      );
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(1, createTable('module', tableType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createTable('module', tableType) +
            createTable('package', tableType) +
            createTable('example', tableType)
        )
      );
      callCount++;
      await expect({}).not.toPassPackageAudit();
    });

    test('multiple vulnerability output 1 allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createTable('module', tableType) +
            createTable('package', tableType) +
            createTable('example', tableType)
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

  describe.each(Object.values(TableType))('%s table', (tableType) => {
    test('vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(8, createTable('module', tableType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('vulnerability output allowed exit code 2', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(2, createTable('module', tableType))
      );
      callCount++;
      await expect({}).toPassPackageAudit({ allow: ['module'] });
    });

    test('multiple vulnerability output allowed', async () => {
      mockSpawn.sequence.add(
        mockSpawn.simple(
          8,
          createTable('module', tableType) +
            createTable('package', tableType) +
            createTable('example', tableType)
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
