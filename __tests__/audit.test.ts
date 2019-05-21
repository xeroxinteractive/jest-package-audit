import '../source/index';

jest.retryTimes(5);

test('packages do not have vunerabilities', async () => {
  await expect({}).toPassPackageAudit();
});
