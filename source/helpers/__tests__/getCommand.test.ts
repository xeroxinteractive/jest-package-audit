import getCommand from '../getCommand';
import * as isYarn from '../isYarn';
import { Severity } from '../../../source/static';

const isYarnSpy = jest.spyOn(isYarn, 'default');

beforeEach(() => {
  jest.clearAllMocks();
  isYarnSpy.mockReturnValue(Promise.resolve(false));
});

test('npm', () => {
  expect(getCommand('', { yarn: false })).toBe('npm audit');
});

test('npm --audit-level', () => {
  expect(
    getCommand('/path/to/root', { yarn: false, level: Severity.INFO })
  ).toBe('npm audit');
  expect(
    getCommand('/path/to/root', { yarn: false, level: Severity.LOW })
  ).toBe('npm audit --audit-level=low');
  expect(
    getCommand('/path/to/root', { yarn: false, level: Severity.MODERATE })
  ).toBe('npm audit --audit-level=moderate');
  expect(
    getCommand('/path/to/root', { yarn: false, level: Severity.HIGH })
  ).toBe('npm audit --audit-level=high');
  expect(
    getCommand('/path/to/root', { yarn: false, level: Severity.CRITICAL })
  ).toBe('npm audit --audit-level=critical');
});

test('npm --only', () => {
  expect(
    getCommand('/path/to/root', {
      yarn: false,
      dependencyType: 'devDependencies',
    })
  ).toBe('npm audit --only=dev');
  expect(getCommand('/path/to/root', { dependencyType: 'dependencies' })).toBe(
    'npm audit --only=prod'
  );
});

test('yarn', () => {
  expect(getCommand('', { yarn: true })).toBe('yarn audit');
});

test('yarn --level', () => {
  expect(
    getCommand('/path/to/root', { yarn: true, level: Severity.INFO })
  ).toBe('yarn audit --level info');
  expect(getCommand('/path/to/root', { yarn: true, level: Severity.LOW })).toBe(
    'yarn audit --level low'
  );
  expect(
    getCommand('/path/to/root', { yarn: true, level: Severity.MODERATE })
  ).toBe('yarn audit --level moderate');
  expect(
    getCommand('/path/to/root', { yarn: true, level: Severity.HIGH })
  ).toBe('yarn audit --level high');
  expect(
    getCommand('/path/to/root', { yarn: true, level: Severity.CRITICAL })
  ).toBe('yarn audit --level critical');
});

test('npm --groups', () => {
  expect(
    getCommand('/path/to/root', {
      yarn: true,
      dependencyType: 'devDependencies',
    })
  ).toBe('yarn audit --groups devDependencies');
  expect(
    getCommand('/path/to/root', { yarn: true, dependencyType: 'dependencies' })
  ).toBe('yarn audit --groups dependencies');
});

test('command takes precedence', () => {
  expect(
    getCommand('/path/to/root', {
      command: 'pnpm audit --dev',
      yarn: true,
      level: Severity.INFO,
      dependencyType: 'dependencies',
    })
  ).toBe('pnpm audit --dev');
});
