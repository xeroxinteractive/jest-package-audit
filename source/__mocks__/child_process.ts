import createSpawn from 'mock-spawn';

const mockSpawn = createSpawn();
mockSpawn.setSignals({
  SIGTERM: true,
});

const original = require.requireActual('child_process');

export interface MockChildProcess {
  mockSpawn: typeof mockSpawn;
}

module.exports = original;

module.exports.spawn = mockSpawn;
module.exports.mockSpawn = mockSpawn;
