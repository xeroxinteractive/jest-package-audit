import { toPassPackageAudit } from './matchers';

if (expect !== undefined) {
  expect.extend({ toPassPackageAudit });
}
