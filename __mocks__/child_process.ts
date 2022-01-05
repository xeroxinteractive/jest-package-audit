import createSpawn from 'mock-spawn';

const mockSpawn = createSpawn();
mockSpawn.setSignals({
  SIGTERM: true,
});

const original = jest.requireActual('child_process');

export = { ...original, spawn: mockSpawn };
