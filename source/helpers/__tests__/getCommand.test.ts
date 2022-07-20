import getCommand from '../getCommand';
import { Severity } from '../../../source/static';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('npm', () => {
  test('base command', () => {
    expect(getCommand('', { packageManager: 'npm' })).toBe('npm audit --json');
  });

  test('--audit-level flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        level: Severity.INFO,
      })
    ).toBe('npm audit --json');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        level: Severity.LOW,
      })
    ).toBe('npm audit --json --audit-level=low');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        level: Severity.MODERATE,
      })
    ).toBe('npm audit --json --audit-level=moderate');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        level: Severity.HIGH,
      })
    ).toBe('npm audit --json --audit-level=high');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        level: Severity.CRITICAL,
      })
    ).toBe('npm audit --json --audit-level=critical');
  });

  test('--only flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        dependencyType: 'devDependencies',
      })
    ).toBe('npm audit --json --only=dev');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'npm',
        dependencyType: 'dependencies',
      })
    ).toBe('npm audit --json --only=prod');
  });
});

describe('yarn', () => {
  test('base command', () => {
    expect(getCommand('', { packageManager: 'yarn' })).toBe(
      'yarn audit --json'
    );
  });

  test('--level flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        level: Severity.INFO,
      })
    ).toBe('yarn audit --json --level info');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        level: Severity.LOW,
      })
    ).toBe('yarn audit --json --level low');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        level: Severity.MODERATE,
      })
    ).toBe('yarn audit --json --level moderate');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        level: Severity.HIGH,
      })
    ).toBe('yarn audit --json --level high');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        level: Severity.CRITICAL,
      })
    ).toBe('yarn audit --json --level critical');
  });

  test('--groups flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        dependencyType: 'devDependencies',
      })
    ).toBe('yarn audit --json --groups devDependencies');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'yarn',
        dependencyType: 'dependencies',
      })
    ).toBe('yarn audit --json --groups dependencies');
  });
});

describe('pnpm', () => {
  test('base command', () => {
    expect(getCommand('', { packageManager: 'pnpm' })).toBe(
      'pnpm audit --json'
    );
  });

  test('--audit-level flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        level: Severity.INFO,
      })
    ).toBe('pnpm audit --json');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        level: Severity.LOW,
      })
    ).toBe('pnpm audit --json --audit-level low');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        level: Severity.MODERATE,
      })
    ).toBe('pnpm audit --json --audit-level moderate');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        level: Severity.HIGH,
      })
    ).toBe('pnpm audit --json --audit-level high');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        level: Severity.CRITICAL,
      })
    ).toBe('pnpm audit --json --audit-level critical');
  });

  test('--prod and --dev flag', () => {
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        dependencyType: 'devDependencies',
      })
    ).toBe('pnpm audit --json --dev');
    expect(
      getCommand('/path/to/root', {
        packageManager: 'pnpm',
        dependencyType: 'dependencies',
      })
    ).toBe('pnpm audit --json --prod');
  });
});

test('command takes precedence', () => {
  expect(
    getCommand('/path/to/root', {
      command: 'audit',
      packageManager: 'yarn',
      level: Severity.INFO,
      dependencyType: 'dependencies',
    })
  ).toBe('audit');
});
