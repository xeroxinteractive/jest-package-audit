import exists from '../exists';
import { resolve } from 'path';

test('file exists', async () => {
  await expect(exists(resolve('./yarn.lock'))).resolves.toBe(true);
});

test('file does not exists', async () => {
  await expect(exists(resolve('./invalid.ext'))).resolves.toBe(false);
});

test('folder exists', async () => {
  await expect(exists(resolve('./'))).resolves.toBe(true);
});

test('folder does not exists', async () => {
  await expect(exists(resolve('./invalid/'))).resolves.toBe(false);
});
