const mockSync = jest.fn();

export interface MockPkgDir {
  mockSync: jest.Mock;
}

module.exports.sync = mockSync;
module.exports.mockSync = mockSync;
