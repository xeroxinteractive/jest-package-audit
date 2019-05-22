import '../source/index';

jest.retryTimes(5);
jest.setTimeout(15000);

test('packages do not have vunerabilities', async () => {
  await expect({}).toPassPackageAudit();
});
