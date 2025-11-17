const nats = require('nats');

// Mock Node-RED
const mockRED = {
  nodes: {
    createNode: jest.fn(),
    getNode: jest.fn(),
  },
};

// Mock NATS connection
const mockNatsConnection = {
  publish: jest.fn(),
  close: jest.fn(),
};

jest.mock('nats', () => ({
  connect: jest.fn(() => Promise.resolve(mockNatsConnection)),
  StringCodec: {
    encode: jest.fn(data => Buffer.from(data)),
    decode: jest.fn(data => data.toString()),
  },
}));

describe('NATS Publish Node', () => {
  let NatsPublishNode;

  beforeEach(() => {
    jest.clearAllMocks();
    // Dynamically require the module after mocking
    delete require.cache[require.resolve('../nats-suite-publish')];
    NatsPublishNode = require('../nats-suite-publish')(mockRED);
  });

  test('should create node with correct configuration', () => {
    const config = {
      server: 'test-server',
      dataformat: 'uns_value',
      datapointid: 'test.datapoint',
      name: 'Test Node',
    };

    const node = new NatsPublishNode(config);
    expect(mockRED.nodes.createNode).toHaveBeenCalledWith(node, config);
  });

  test('should handle uns_value data format correctly', async () => {
    const config = {
      server: 'test-server',
      dataformat: 'uns_value',
      datapointid: 'test.datapoint',
      name: 'Test Node',
    };

    const node = new NatsPublishNode(config);
    const msg = { payload: 'test value' };

    // Mock the server config
    node.config = {
      getConnection: jest.fn(() => Promise.resolve(mockNatsConnection)),
      addStatusListener: jest.fn(),
    };

    await node.on.input(msg);

    expect(mockNatsConnection.publish).toHaveBeenCalled();
  });
});
