import { toPassPackageAudit } from '../../source/index';

expect.extend({ toPassPackageAudit });

jest.retryTimes(5);
jest.setTimeout(15000);

test('package has vulnerabilities', async () => {
  await expect({
    cwd: __dirname,
  }).not.toPassPackageAudit();
});
