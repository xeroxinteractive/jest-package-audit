import { FilterOptions } from 'source/static';
import { toPassPackageAudit } from '../../source/index';

expect.extend({ toPassPackageAudit });

jest.retryTimes(5);
jest.setTimeout(15000);

test('package has vulnerabilities but should pass anyway', async () => {
  await expect({
    yarn: false,
    cwd: __dirname,
  }).toPassPackageAudit({
    allow: function (options: FilterOptions) {
      if (options.packageName === 'mem') {
        return true;
      } else {
        return false;
      }
    },
  });
});
