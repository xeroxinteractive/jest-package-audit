import getCommand from '../getCommand';
import * as isYarn from '../isYarn';

const isYarnSpy = jest.spyOn(isYarn, 'default');

beforeEach(() => {
  jest.clearAllMocks();
  isYarnSpy.mockReturnValue(Promise.resolve(false));
});

test('default npm', async () => {
  await expect(getCommand('', {})).resolves.toBe('npm audit');
});

test('npm', async () => {
  await expect(getCommand('', { yarn: false })).resolves.toBe('npm audit');
});

test('npm --audit-level', async () => {
  await expect(getCommand('/path/to/root', { level: 'info' })).resolves.toBe(
    'npm audit'
  );
  await expect(getCommand('/path/to/root', { level: 'low' })).resolves.toBe(
    'npm audit --audit-level=low'
  );
  await expect(
    getCommand('/path/to/root', { level: 'moderate' })
  ).resolves.toBe('npm audit --audit-level=moderate');
  await expect(getCommand('/path/to/root', { level: 'high' })).resolves.toBe(
    'npm audit --audit-level=high'
  );
  await expect(
    getCommand('/path/to/root', { level: 'critical' })
  ).resolves.toBe('npm audit --audit-level=critical');
});

test('npm --only', async () => {
  await expect(
    getCommand('/path/to/root', { dependencyType: 'devDependencies' })
  ).resolves.toBe('npm audit --only=dev');
  await expect(
    getCommand('/path/to/root', { dependencyType: 'dependencies' })
  ).resolves.toBe('npm audit --only=prod');
});

test('default yarn', async () => {
  isYarnSpy.mockReturnValueOnce(Promise.resolve(true));
  await expect(getCommand('', {})).resolves.toBe('yarn audit');
});

test('yarn', async () => {
  await expect(getCommand('', { yarn: true })).resolves.toBe('yarn audit');
});

test('yarn --level', async () => {
  await expect(
    getCommand('/path/to/root', { yarn: true, level: 'info' })
  ).resolves.toBe('yarn audit --level info');
  await expect(
    getCommand('/path/to/root', { yarn: true, level: 'low' })
  ).resolves.toBe('yarn audit --level low');
  await expect(
    getCommand('/path/to/root', { yarn: true, level: 'moderate' })
  ).resolves.toBe('yarn audit --level moderate');
  await expect(
    getCommand('/path/to/root', { yarn: true, level: 'high' })
  ).resolves.toBe('yarn audit --level high');
  await expect(
    getCommand('/path/to/root', { yarn: true, level: 'critical' })
  ).resolves.toBe('yarn audit --level critical');
});

test('npm --groups', async () => {
  await expect(
    getCommand('/path/to/root', {
      yarn: true,
      dependencyType: 'devDependencies',
    })
  ).resolves.toBe('yarn audit --groups devDependencies');
  await expect(
    getCommand('/path/to/root', { yarn: true, dependencyType: 'dependencies' })
  ).resolves.toBe('yarn audit --groups dependencies');
});

test('command takes precedence', async () => {
  await expect(
    getCommand('/path/to/root', {
      command: 'pnpm audit --dev',
      yarn: true,
      level: 'info',
      dependencyType: 'dependencies',
    })
  ).resolves.toBe('pnpm audit --dev');
});
