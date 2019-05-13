import { toPassPackageAudit } from './matchers';

if (expect !== undefined) {
  expect.extend({ toPassPackageAudit });
} else {
  console.error(
    "jest-package-audit: Make sure jest is installed, couldn't install matcher."
  );
}
