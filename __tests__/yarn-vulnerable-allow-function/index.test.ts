import { FunctionOptions } from 'source/static';
import { toPassPackageAudit } from '../../source/index';

expect.extend({ toPassPackageAudit });

jest.retryTimes(5);
jest.setTimeout(15000);

test('package has vulnerabilities but should pass anyway', async () => {
  await expect({
    yarn: true,
    cwd: __dirname,
  }).toPassPackageAudit({
    allow: function (options: FunctionOptions) {
      if (options.pkgName === 'mem') {
        return true;
      } else {
        return false;
      }
    },
  });
});
