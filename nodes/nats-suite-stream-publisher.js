'use strict';

const { StringCodec, headers: natsHeaders } = require('nats');

module.exports = function (RED) {
  function UnsStreamPublisherNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Validate server configuration
    if (!config.server) {
      node.error('NATS server configuration not selected');
      node.status({ fill: 'red', shape: 'ring', text: 'no server' });
      return;
    }

    this.serverConfig = RED.nodes.getNode(config.server);
    if (!this.serverConfig) {
      node.error('NATS server configuration not found');
      node.status({ fill: 'red', shape: 'ring', text: 'server not found' });
      return;
    }

    // Validate stream configuration
    if (!config.streamName) {
      node.error('Stream name is required');
      node.status({ fill: 'red', shape: 'ring', text: 'no stream' });
      return;
    }

    let jsClient = null;
    let streamInfo = null;
    const sc = StringCodec();

    // Helper: Parse duration string to nanoseconds (e.g., "24h" -> nanoseconds)
    const parseDuration = (duration) => {
      if (!duration) return 0;
      
      const match = duration.match(/^(\d+)([smhd])$/);
      if (!match) return 0;
      
      const [, num, unit] = match;
      const value = parseInt(num, 10);
      
      switch (unit) {
        case 's': return value * 1000000000; // seconds to nanoseconds
        case 'm': return value * 60 * 1000000000; // minutes
        case 'h': return value * 3600 * 1000000000; // hours
        case 'd': return value * 86400 * 1000000000; // days
        default: return 0;
      }
    };

    // Helper: Get or create stream
    const ensureStream = async () => {
      try {
        const nc = await node.serverConfig.getConnection();
        jsClient = nc.jetstream();
        const jsm = await nc.jetstreamManager();

        // Try to get existing stream
        try {
          streamInfo = await jsm.streams.info(config.streamName);
          node.log(`[STREAM PUB] Stream exists: ${config.streamName}`);
          node.status({ 
            fill: 'green', 
            shape: 'dot', 
            text: `${config.streamName} (${streamInfo.state.messages} msgs)` 
          });
          return true;
        } catch (err) {
          // Stream doesn't exist, create it
          if (err.message && err.message.includes('stream not found')) {
            node.log(`[STREAM PUB] Creating stream: ${config.streamName}`);
            
            const streamConfig = {
              name: config.streamName,
              subjects: [config.subjectPattern || '*'],
              retention: config.retention || 'limits',
              storage: config.storage === 'memory' ? 'memory' : 'file',
              max_msgs: parseInt(config.maxMessages, 10) || 10000,
              max_bytes: parseInt(config.maxBytes, 10) || 10485760, // 10MB
              max_age: parseDuration(config.maxAge || '24h'),
              duplicate_window: parseDuration(config.duplicateWindow || '2m'),
              num_replicas: parseInt(config.replicas, 10) || 1,
              discard: 'old', // Discard old messages when limits reached
            };

            await jsm.streams.add(streamConfig);
            streamInfo = await jsm.streams.info(config.streamName);
            
            node.log(`[STREAM PUB] Stream created: ${config.streamName}`);
            node.status({ fill: 'green', shape: 'dot', text: `${config.streamName} (ready)` });
            return true;
          }
          throw err;
        }
      } catch (err) {
        node.error(`Failed to ensure stream: ${err.message}`);
        node.status({ fill: 'red', shape: 'ring', text: 'stream error' });
        return false;
      }
    };

    // Register with connection pool
    this.serverConfig.registerConnectionUser(node.id);

    // Initialize stream
    ensureStream();

    // Status listener for connection changes
    const statusListener = (statusInfo) => {
      const status = statusInfo.status || statusInfo;
      
      switch (status) {
        case 'connected':
          // Re-ensure stream on reconnect
          ensureStream();
          break;
        case 'disconnected':
          node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
          jsClient = null;
          break;
        case 'connecting':
          node.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
          break;
      }
    };

    this.serverConfig.addStatusListener(statusListener);

    // Stream Management Operations
    const performStreamOperation = async (msg) => {
      try {
        const nc = await node.serverConfig.getConnection();
        const js = nc.jetstream();
        const jsm = await nc.jetstreamManager();
        
        const operation = msg.operation || config.operation || 'publish';
        const streamName = msg.stream || config.streamName || '';

        if (!streamName && operation !== 'list') {
          node.error('Stream name required for operation');
          return;
        }

        switch (operation) {
          case 'create':
          case 'update': {
            const streamConfig = {
              name: streamName,
              subjects: msg.subjects ? msg.subjects.split(',').map(s => s.trim()) : [config.subjectPattern || streamName + '.>'],
              retention: msg.retention || config.retention || 'limits',
              storage: msg.storage || config.storage === 'memory' ? 'memory' : 'file',
              max_msgs: msg.maxMessages ? parseInt(msg.maxMessages, 10) : (config.maxMessages ? parseInt(config.maxMessages, 10) : undefined),
              max_bytes: msg.maxBytes ? parseInt(msg.maxBytes, 10) : (config.maxBytes ? parseInt(config.maxBytes, 10) : undefined),
              max_age: msg.maxAge ? parseDuration(msg.maxAge) : (config.maxAge ? parseDuration(config.maxAge) : undefined),
              duplicate_window: msg.duplicateWindow ? parseDuration(msg.duplicateWindow) : (config.duplicateWindow ? parseDuration(config.duplicateWindow) : undefined),
              num_replicas: msg.replicas ? parseInt(msg.replicas, 10) : (config.replicas ? parseInt(config.replicas, 10) : 1),
            };

            // Remove undefined values
            Object.keys(streamConfig).forEach(key => {
              if (streamConfig[key] === undefined) delete streamConfig[key];
            });

            await jsm.streams.add(streamConfig);
            msg.payload = { operation: operation, stream: streamName, success: true };
            node.status({ fill: 'green', shape: 'dot', text: `${operation}d: ${streamName}` });
            break;
          }

          case 'update-subjects': {
            // Update stream subjects only (without changing other config)
            const currentStream = await jsm.streams.info(streamName);
            const updatedConfig = {
              ...currentStream.config,
              subjects: msg.subjects ? msg.subjects.split(',').map(s => s.trim()) : currentStream.config.subjects
            };
            
            await jsm.streams.update(streamName, updatedConfig);
            msg.payload = { 
              operation: 'update-subjects', 
              stream: streamName, 
              subjects: updatedConfig.subjects,
              success: true 
            };
            node.status({ fill: 'green', shape: 'dot', text: `subjects updated: ${streamName}` });
            node.log(`[STREAM PUB] Updated subjects for ${streamName}: ${updatedConfig.subjects.join(', ')}`);
            break;
          }

          case 'info': {
            const streamInfo = await jsm.streams.info(streamName);
            msg.payload = {
              operation: 'info',
              stream: streamName,
              config: streamInfo.config,
              state: streamInfo.state
            };
            node.status({ fill: 'green', shape: 'dot', text: streamName });
            break;
          }

          case 'delete': {
            await jsm.streams.delete(streamName);
            msg.payload = { operation: 'delete', stream: streamName, success: true };
            node.status({ fill: 'green', shape: 'dot', text: `deleted: ${streamName}` });
            break;
          }

          case 'purge': {
            const stream = await js.streams.get(streamName);
            await stream.purge();
            msg.payload = { operation: 'purge', stream: streamName, success: true };
            node.status({ fill: 'green', shape: 'dot', text: `purged: ${streamName}` });
            break;
          }

          case 'list': {
            const streams = [];
            for await (const stream of js.streams.list()) {
              streams.push({
                name: stream.config.name,
                subjects: stream.config.subjects,
                messages: stream.state.messages,
                bytes: stream.state.bytes
              });
            }
            msg.payload = streams;
            msg.operation = 'list';
            msg.count = streams.length;
            node.status({ fill: 'green', shape: 'dot', text: `${streams.length} streams` });
            break;
          }

          default:
            node.error(`Unknown operation: ${operation}`);
            return;
        }

        node.send(msg);
      } catch (err) {
        node.error(`Stream operation failed: ${err.message}`, msg);
        msg.error = err.message;
        node.send(msg);
        node.status({ fill: 'red', shape: 'ring', text: 'error' });
      }
    };

    // Input handler
    node.on('input', async function (msg) {
      try {
        // Check if this is a stream management operation
        const operation = msg.operation || config.operation || 'publish';
        
        if (operation !== 'publish') {
          await performStreamOperation(msg);
          return;
        }

        // Ensure we have a JetStream client
        if (!jsClient) {
          const ready = await ensureStream();
          if (!ready) {
            node.error('Stream not ready', msg);
            return;
          }
        }

        // Determine subject
        let subject = msg.subject || config.defaultSubject;
        if (!subject) {
          node.error('No subject specified (use msg.subject or configure default subject)', msg);
          return;
        }

        // Prepare payload
        let payload;
        if (typeof msg.payload === 'object') {
          payload = JSON.stringify(msg.payload);
        } else {
          payload = String(msg.payload);
        }

        // Prepare headers if provided
        let msgHeaders;
        if (msg.headers && typeof msg.headers === 'object') {
          msgHeaders = natsHeaders();
          Object.keys(msg.headers).forEach(key => {
            msgHeaders.append(key, String(msg.headers[key]));
          });
        }

        // Publish to stream
        const pubAck = await jsClient.publish(subject, sc.encode(payload), {
          headers: msgHeaders,
          msgID: msg._msgID || undefined, // Optional message ID for deduplication
        });

        // Update message with publish info
        msg.stream = pubAck.stream;
        msg.sequence = pubAck.seq;
        msg.published = true;
        msg.subject = subject;
        msg._duplicate = pubAck.duplicate || false;

        // Update status with stream stats
        if (streamInfo && streamInfo.state) {
          const msgCount = streamInfo.state.messages + 1; // Approximate
          node.status({ 
            fill: 'green', 
            shape: 'dot', 
            text: `${config.streamName} (${msgCount} msgs)` 
          });
        } else {
          node.status({ fill: 'green', shape: 'dot', text: 'published' });
        }

        // Send message to output
        node.send(msg);

        // Periodically update stream info (every 100 messages)
        if (pubAck.seq % 100 === 0) {
          ensureStream(); // Refresh stats
        }

      } catch (err) {
        msg.published = false;
        msg.error = err.message;
        
        node.error(`Stream publish error: ${err.message}`, msg);
        node.status({ fill: 'red', shape: 'ring', text: 'publish failed' });
        
        // Send error message to output
        node.send(msg);
      }
    });

    // Cleanup on close
    node.on('close', function () {
      this.serverConfig.removeStatusListener(statusListener);
      this.serverConfig.unregisterConnectionUser(node.id);
      jsClient = null;
      streamInfo = null;
      node.status({});
    });
  }

  RED.nodes.registerType('nats-suite-stream-publisher', UnsStreamPublisherNode);
};

