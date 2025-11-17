'use strict';

const { StringCodec } = require('nats');

// NATS Error Code Constants
const NATS_ERROR_CODES = {
  CANCELLED: 'CANCELLED',
  BAD_SUBSCRIPTION: 'BAD_SUBSCRIPTION',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: '503'
};

module.exports = function (RED) {
  function NatsSubscribeNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Define status functions
    const setStatusRed = () => {
      node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    };

    const setStatusGreen = () => {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
    };

    const setStatusYellow = () => {
      node.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    };

    setStatusRed();

    // Validate server configuration ID
    if (!config.server) {
      node.error('NATS server configuration not selected. Please select a NATS server node.');
      setStatusRed();
      return;
    }
    
    this.config = RED.nodes.getNode(config.server);
    
    // Validate server configuration
    if (!this.config) {
      node.error('NATS server configuration not found. Please configure a NATS server node.');
      setStatusRed();
      return;
    }

    let subscription = null;
    let subscriptionIterator = null; // For Async Iterator cleanup
    let subject = '';
    let connectionTimeout = null;
    let connectionStartTime = null;

    switch (config.dataformat) {
      case 'uns_value':
        subject = 'uns.' + config.datapointid;
        break;
      case 'uns_command':
        subject = 'cmd.' + config.datapointid;
        break;
      case 'uns_event':
        subject = 'event.' + config.datapointid;
        break;
      case 'specific_subject':
        subject = config.datapointid;
        break;
      default:
        node.error('Invalid data format specified');
        setStatusRed();
        return;
    }

    // Add status listener to server config
    const statusListener = status => {
      // Handle both old format (string) and new format (object)
      const statusValue = typeof status === 'object' ? status.status : status;
      
      switch (statusValue) {
        case 'connected':
          
          // Clear connection timeout
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          
          const connectionTime = connectionStartTime ? Math.floor((Date.now() - connectionStartTime) / 1000) : 0;
          if (connectionTime > 5) {
            node.warn(`NATS connection established after ${connectionTime}s`);
          }
          
          setStatusGreen();
          setupSubscription();
          break;
        case 'disconnected':
          // Clear connection timeout
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          
          setStatusRed();
          if (subscription) {
            subscription.unsubscribe();
            subscription = null;
          }
          break;
        case 'connecting':
          setStatusYellow();
          
          // Start connection timeout warning
          connectionStartTime = Date.now();
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }
          
          // Warn after 10 seconds
          connectionTimeout = setTimeout(() => {
            const elapsed = Math.floor((Date.now() - connectionStartTime) / 1000);
            node.warn(`NATS connection taking longer than expected (${elapsed}s). Check server availability.`);
            setStatusYellow();
          }, 10000);
          break;
        default:
          // Unknown status - ignore
      }
    };

    this.config.addStatusListener(statusListener);
    
    // Connection Pool: Register this node as connection user
    this.config.registerConnectionUser(node.id);

    // Create StringCodec once for performance
    const sc = StringCodec();

    // Helper function for message processing (DRY principle)
    const processMessage = (msg) => {
      let message = sc.decode(msg.data);
      let send_message;

      try {
        switch (config.dataformat) {
          case 'uns_value':
            // Safe JSON parsing with error handling
            try {
              message = JSON.parse(message);
            } catch (parseError) {
              node.error({
                message: 'Invalid JSON in UNS value message',
                code: 'JSON_PARSE_ERROR',
                originalError: parseError.message
              }, { 
                topic: subject, 
                rawData: message,
                errorContext: 'uns_value parsing'
              });
              return; // Stop processing on invalid JSON
            }
            
            // Datatype conversion with switch for better performance & readability
            switch (message.datatype) {
              case 1: // Integer
                message.value = parseInt(message.value, 10);
                break;
              case 2: // Float
                message.value = parseFloat(message.value);
                break;
              case 3: // Boolean
                message.value = message.value === 'true' || message.value === '1';
                break;
              case 4: // String
                // String stays string - no conversion needed
                break;
              case 5: // JSON
                try {
                  message.value = JSON.parse(message.value);
                } catch (e) {
                  // If JSON parsing fails, keep as string
                  // Silent fail - keep as string
                }
                break;
              default:
                // Unknown datatype - value stays unchanged
                break;
            }
            
            // Set topic field based on configuration
            let topicValue = msg.subject; // Default
            if (config.topicfield === 'id') {
              topicValue = message.id;
            } else if (config.topicfield === 'name') {
              topicValue = message.name;
            } else if (config.topicfield === 'datatype') {
              topicValue = String(message.datatype);
            }
            
            // For UNS Value: Only value as payload, rest as msg properties
            send_message = {
              topic: topicValue,
              payload: message.value,
              datatype: message.datatype,
              id: message.id,
              name: message.name,
              timestamp: message.timestamp
            };
            break;
          case 'uns_event':
            // For UNS Events: Parse JSON and extract event information
            try {
              message = JSON.parse(message);
              
              // Set topic field based on configuration
              let topicValue = msg.subject; // Default
              if (config.topicfield === 'id') {
                topicValue = message.id;
              } else if (config.topicfield === 'name') {
                topicValue = message.type || 'event';
              } else if (config.topicfield === 'datatype') {
                topicValue = 'event';
              }
              
              // For UNS Events: Event details as payload, additional properties available
              send_message = {
                topic: topicValue,
                payload: message.payload || message,
                id: message.id,
                type: message.type,
                startTime: message.startTime,
                endTime: message.endTime,
                timestamp: message.timestamp || Date.now()
              };
            } catch (parseError) {
              // If JSON parsing fails, log error and use raw message
              node.warn({
                message: 'Invalid JSON in UNS event message, using raw data',
                code: 'JSON_PARSE_ERROR',
                originalError: parseError.message
              });
              send_message = {
                topic: msg.subject,
                payload: message,
                _parseError: true
              };
            }
            break;
          default:
            // For specific_subject: Try to parse as JSON, fallback to string
            let parsedPayload = message;
            let isJson = false;
            
            // Attempt JSON parsing
            if (typeof message === 'string' && message.trim().length > 0) {
              try {
                parsedPayload = JSON.parse(message);
                isJson = true;
              } catch (parseError) {
                // JSON parsing failed, use raw string
                // Silent fail - this is expected for non-JSON messages
                parsedPayload = message;
              }
            }
            
            send_message = {
              topic: msg.subject,
              payload: parsedPayload,
              _format: isJson ? 'json' : 'string', // Indicator for downstream nodes
            };
        }

        // set _reply to the reply subject if not emtpy or undefined
        if (msg.reply) {
          send_message._unsreply = msg.reply;
        }

        node.send(send_message);
      } catch (err) {
        const cleanError = {
          message: err.message || 'Unknown error',
          code: err.code || 'UNKNOWN',
          name: err.name || 'Error',
        };
        // Safe error reporting with fallback
        node.error(cleanError, { 
          topic: subject, 
          rawData: msg?.data ? String(msg.data) : 'N/A',
          errorContext: 'processMessage'
        });
      }
    };

    const setupSubscription = async () => {
      try {
        const natsnc = await this.config.getConnection();
        
        // Cleanup old subscription
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
        
        // Cleanup running iterator
        if (subscriptionIterator) {
          subscriptionIterator = null;
        }
        
        // New subscription with modern Async Iterator API
        subscription = natsnc.subscribe(subject);
        
        // Async iterator for message processing
        subscriptionIterator = (async () => {
          try {
            for await (const msg of subscription) {
              processMessage(msg);
            }
          } catch (err) {
            // Iterator was stopped or error occurred
            if (err.code !== NATS_ERROR_CODES.CANCELLED && err.code !== NATS_ERROR_CODES.BAD_SUBSCRIPTION) {
              const cleanError = {
                message: err.message,
                code: err.code,
                name: err.name,
              };
              node.error(cleanError, { topic: subject });
            }
          }
        })();
        
      } catch (err) {
        const cleanError = {
          message: err.message,
          code: err.code,
          name: err.name,
        };
        node.error(cleanError, { topic: subject });
      }
    };

    // on node close
    node.on('close', function (done) {
      if (subscription) {
        node.log('Unsubscribing from subscription on close');
        subscription.unsubscribe();
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      this.config.removeStatusListener(statusListener);
      // Connection Pool: Unregister this node as connection user
      this.config.unregisterConnectionUser(node.id);
      done();
    });
  }

  RED.nodes.registerType('uns-subscribe', NatsSubscribeNode);
};
