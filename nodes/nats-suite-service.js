'use strict';

const { StringCodec } = require('nats');

module.exports = function (RED) {
  function NatsServiceNode(config) {
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

    let nc = null;
    let service = null;
    const sc = StringCodec();
    const isDebug = !!config.debug;

    // Service state
    let isServiceRunning = false;
    let serviceStats = {
      requests: 0,
      errors: 0,
      avgProcessingTime: 0,
      lastRequest: null
    };

    // Register with connection pool
    this.serverConfig.registerConnectionUser(node.id);

    // Status listener for connection changes
    const statusListener = (statusInfo) => {
      const status = statusInfo.status || statusInfo;
      
      switch (status) {
        case 'connected':
          if (config.mode === 'service' && config.autoStart) {
            startService();
          }
          break;
        case 'disconnected':
          node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
          if (service) {
            stopService();
          }
          break;
        case 'connecting':
          node.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
          break;
      }
    };

    this.serverConfig.addStatusListener(statusListener);

    // Helper: Start service
    const startService = async () => {
      if (isServiceRunning) {
        node.warn('[SERVICE] Service already running');
        return;
      }

      try {
        nc = await node.serverConfig.getConnection();
        
        const serviceName = config.serviceName || 'default-service';
        const version = config.serviceVersion || '1.0.0';
        const description = config.serviceDescription || '';

        // Create service config
        const serviceConfig = {
          name: serviceName,
          version: version,
          description: description,
          queue: config.queueGroup || serviceName
        };

        // Add metadata if configured
        if (config.metadata) {
          try {
            serviceConfig.metadata = JSON.parse(config.metadata);
          } catch (err) {
            node.warn(`[SERVICE] Failed to parse metadata: ${err.message}`);
          }
        }

        // Create service
        service = await nc.services.add(serviceConfig);
        isServiceRunning = true;

        // Add endpoint
        const endpoint = config.endpoint || 'process';
        const subject = config.endpointSubject || `${serviceName}.${endpoint}`;

        const endpointHandler = async (err, msg) => {
          const startTime = Date.now();
          
          try {
            serviceStats.requests++;
            serviceStats.lastRequest = Date.now();

            if (err) {
              serviceStats.errors++;
              node.error(`[SERVICE] Error in endpoint: ${err.message}`);
              return;
            }

            // Decode request
            const requestData = sc.decode(msg.data);
            let payload;
            try {
              payload = JSON.parse(requestData);
            } catch (e) {
              payload = requestData;
            }

            if (isDebug) {
              node.log(`[SERVICE] Request received on ${subject}: ${JSON.stringify(payload)}`);
            }

            // Build output message
            const outMsg = {
              payload: payload,
              subject: msg.subject,
              service: serviceName,
              endpoint: endpoint,
              respond: (response) => {
                try {
                  const responseData = typeof response === 'string' ? response : JSON.stringify(response);
                  msg.respond(sc.encode(responseData));
                  
                  // Update stats
                  const processingTime = Date.now() - startTime;
                  serviceStats.avgProcessingTime = 
                    (serviceStats.avgProcessingTime * (serviceStats.requests - 1) + processingTime) / serviceStats.requests;
                  
                  if (isDebug) {
                    node.log(`[SERVICE] Response sent in ${processingTime}ms`);
                  }
                } catch (err) {
                  serviceStats.errors++;
                  node.error(`[SERVICE] Failed to respond: ${err.message}`);
                }
              },
              respondError: (error, code) => {
                try {
                  serviceStats.errors++;
                  const errorResponse = {
                    error: error,
                    code: code || 'SERVICE_ERROR'
                  };
                  msg.respond(sc.encode(JSON.stringify(errorResponse)));
                } catch (err) {
                  node.error(`[SERVICE] Failed to send error response: ${err.message}`);
                }
              }
            };

            // Send to output for processing
            node.send(outMsg);
            
            // Update status
            node.status({ 
              fill: 'green', 
              shape: 'dot', 
              text: `${serviceName} (${serviceStats.requests} reqs)` 
            });

          } catch (err) {
            serviceStats.errors++;
            node.error(`[SERVICE] Handler error: ${err.message}`);
            
            try {
              msg.respond(sc.encode(JSON.stringify({
                error: 'Internal service error',
                code: 'INTERNAL_ERROR'
              })));
            } catch (respondErr) {
              node.error(`[SERVICE] Failed to send error response: ${respondErr.message}`);
            }
          }
        };

        // Add endpoint to service
        await service.addEndpoint(endpoint, endpointHandler);

        node.log(`[SERVICE] Service started: ${serviceName} v${version}`);
        node.log(`[SERVICE] Endpoint: ${subject}`);
        node.status({ fill: 'green', shape: 'dot', text: `${serviceName} (running)` });

      } catch (err) {
        node.error(`[SERVICE] Failed to start service: ${err.message}`);
        node.status({ fill: 'red', shape: 'ring', text: 'start failed' });
      }
    };

    // Helper: Stop service
    const stopService = async () => {
      if (!isServiceRunning || !service) {
        return;
      }

      try {
        await service.stop();
        isServiceRunning = false;
        service = null;

        node.log('[SERVICE] Service stopped');
        node.status({ fill: 'grey', shape: 'ring', text: 'stopped' });

      } catch (err) {
        node.error(`[SERVICE] Failed to stop service: ${err.message}`);
      }
    };

    // Helper: Service discovery
    const discoverServices = async () => {
      try {
        nc = await node.serverConfig.getConnection();
        
        const serviceName = config.serviceName || '*';
        const services = [];

        // Ping services
        const infos = await nc.services.ping(serviceName === '*' ? undefined : serviceName);

        for (const info of infos) {
          services.push({
            name: info.name,
            id: info.id,
            version: info.version,
            type: info.type,
            metadata: info.metadata || {}
          });
        }

        return services;

      } catch (err) {
        node.error(`[SERVICE] Discovery failed: ${err.message}`);
        throw err;
      }
    };

    // Helper: Service stats
    const getServiceStats = async () => {
      try {
        nc = await node.serverConfig.getConnection();
        
        const serviceName = config.serviceName || '*';
        const stats = [];

        // Get stats for services
        const infos = await nc.services.stats(serviceName === '*' ? undefined : serviceName);

        for (const info of infos) {
          stats.push({
            name: info.name,
            id: info.id,
            version: info.version,
            endpoints: info.endpoints || [],
            stats: info.stats || {}
          });
        }

        return stats;

      } catch (err) {
        node.error(`[SERVICE] Stats failed: ${err.message}`);
        throw err;
      }
    };

    // Auto-start service if configured
    if (config.mode === 'service' && config.autoStart) {
      setTimeout(() => {
        if (this.serverConfig.connectionStatus === 'connected') {
          startService();
        }
      }, 500);
    } else {
      node.status({ fill: 'grey', shape: 'ring', text: 'ready' });
    }

    // Input handler
    node.on('input', async function (msg) {
      try {
        const operation = msg.operation || config.operation || config.mode || 'discover';

        switch (operation) {
          case 'start':
            await startService();
            msg.payload = { operation: 'start', success: true, running: isServiceRunning };
            node.send(msg);
            break;

          case 'stop':
            await stopService();
            msg.payload = { operation: 'stop', success: true, running: isServiceRunning };
            node.send(msg);
            break;

          case 'discover':
            const services = await discoverServices();
            msg.payload = services;
            msg.operation = 'discover';
            msg.count = services.length;
            node.status({ fill: 'blue', shape: 'dot', text: `${services.length} services` });
            node.send(msg);
            break;

          case 'stats':
            const stats = await getServiceStats();
            msg.payload = stats;
            msg.operation = 'stats';
            msg.count = stats.length;
            node.status({ fill: 'blue', shape: 'dot', text: `${stats.length} services` });
            node.send(msg);
            break;

          case 'ping':
            const serviceName = msg.serviceName || config.serviceName;
            nc = await node.serverConfig.getConnection();
            const pingResults = await nc.services.ping(serviceName);
            msg.payload = pingResults;
            msg.operation = 'ping';
            msg.count = pingResults.length;
            node.send(msg);
            break;

          default:
            node.error(`Unknown operation: ${operation}`);
            return;
        }

      } catch (err) {
        node.error(`Service operation failed: ${err.message}`, msg);
        msg.error = err.message;
        node.send(msg);
        node.status({ fill: 'red', shape: 'ring', text: 'error' });
      }
    });

    // Cleanup on close
    node.on('close', async function () {
      await stopService();
      this.serverConfig.removeStatusListener(statusListener);
      this.serverConfig.unregisterConnectionUser(node.id);
      node.status({});
    });
  }

  RED.nodes.registerType('nats-suite-service', NatsServiceNode);
};

