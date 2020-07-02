import { toPassPackageAudit } from '../source/index';

expect.extend({ toPassPackageAudit });

jest.retryTimes(5);
jest.setTimeout(15000);

test('packages do not have vunerabilities', async () => {
  await expect({
    command: 'yarn audit --level moderate --groups dependencies',
  }).toPassPackageAudit();
});
