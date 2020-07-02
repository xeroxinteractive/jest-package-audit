import isYarn from '../isYarn';
import { resolve } from 'path';

test('has yarn.lock', async () => {
  await expect(
    isYarn(resolve(__dirname, '__fixtures__', 'yarn'))
  ).resolves.toBe(true);
});

test('no yarn.lock', async () => {
  await expect(isYarn(resolve(__dirname, '__fixtures__', 'npm'))).resolves.toBe(
    false
  );
});
