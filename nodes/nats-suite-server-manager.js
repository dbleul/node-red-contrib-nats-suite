'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function (RED) {
  function NatsServerManagerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    this.serverType = config.serverType || 'embedded'; // 'embedded', 'nats-server', 'leaf'
    this.port = config.port || 4222;
    this.leafPort = config.leafPort || 7422;
    this.enableJetStream = config.enableJetStream || false;
    this.storeDir = config.storeDir || path.join(os.tmpdir(), 'nats-jetstream');
    this.leafRemoteUrl = config.leafRemoteUrl || '';
    this.leafRemoteUser = config.leafRemoteUser || '';
    this.leafRemotePass = config.leafRemotePass || '';
    this.autoStart = config.autoStart !== false;
    this.debug = config.debug || false;

    let natsServer = null;
    let natsServerProcess = null;
    let serverPort = null;

    const log = (message) => {
      if (node.debug) {
        node.log(`[NATS-SERVER] ${message}`);
      }
    };

    const setStatus = (status, text) => {
      const statusMap = {
        'stopped': { fill: 'grey', shape: 'ring', text: text || 'stopped' },
        'starting': { fill: 'yellow', shape: 'ring', text: text || 'starting...' },
        'running': { fill: 'green', shape: 'dot', text: text || 'running' },
        'error': { fill: 'red', shape: 'ring', text: text || 'error' }
      };
      node.status(statusMap[status] || statusMap.stopped);
    };

    // Start embedded NATS server (nats-memory-server)
    const startEmbeddedServer = async () => {
      try {
        // Try to use nats-memory-server if available
        let NatsServer;
        try {
          // Versuche zuerst direkt zu laden
          NatsServer = require('nats-memory-server').NatsServer;
        } catch (e) {
          // Versuche aus verschiedenen möglichen Pfaden
          try {
            const path = require('path');
            const fs = require('fs');
            // Mögliche Pfade für nats-memory-server
            // __dirname zeigt auf: /data/node_modules/node-red-contrib-nats-suite/nodes
            const possiblePaths = [
              path.join(__dirname, '../node_modules/nats-memory-server'), // Lokales node_modules (RICHTIG!)
              path.join(__dirname, '../../node_modules/nats-memory-server'), // Fallback
              '/data/node_modules/node-red-contrib-nats-suite/node_modules/nats-memory-server', // Absoluter Pfad
              '/data/node_modules/nats-memory-server', // Node-RED data node_modules
              '/usr/src/node-red/node_modules/nats-memory-server' // Container node_modules
            ];
            
            let found = false;
            for (const modulePath of possiblePaths) {
              try {
                if (fs.existsSync(modulePath)) {
                  NatsServer = require(modulePath).NatsServer;
                  found = true;
                  break;
                }
              } catch (err) {
                // Weiter zum nächsten Pfad
              }
            }
            
            if (!found) {
              throw new Error('nats-memory-server not found');
            }
          } catch (err2) {
            const installHint = 'Für Embedded Server: npm install nats-memory-server';
            node.error(`nats-memory-server nicht installiert. ${installHint}`);
            node.warn(`💡 Alternative: Verwenden Sie "NATS Server Prozess" oder "Leaf Node" als Server-Typ.`);
            setStatus('error', 'nats-memory-server fehlt');
            return;
          }
        }

        // Ensure port is a number
        const requestedPort = parseInt(node.port) || 4222;
        const enableJetStream = node.enableJetStream !== false; // Default true
        
        log(`Starte embedded NATS Server auf Port ${requestedPort}...`);
        setStatus('starting', 'starting embedded...');

        // Create server with proper options
        // Note: args must be an array to avoid "args is not iterable" error
        // Set explicit paths to avoid Docker container path issues
        // __dirname is: /data/node_modules/node-red-contrib-nats-suite/nodes
        const cacheDir = path.join(__dirname, '../node_modules/.cache/nats-memory-server');
        const serverOptions = {
          port: requestedPort,
          args: [], // Initialize args as empty array (required by nats-memory-server)
          downloadDir: cacheDir,
          binPath: path.join(cacheDir, 'nats-server')
        };
        
        if (enableJetStream) {
          // Add JetStream flag to args array
          serverOptions.args.push('--jetstream');
          if (node.storeDir) {
            serverOptions.args.push('--store_dir', node.storeDir);
          }
        }
        
        natsServer = new NatsServer(serverOptions);

        await natsServer.start();
        serverPort = natsServer.getPort ? natsServer.getPort() : (natsServer.port || requestedPort);

        log(`Embedded NATS Server läuft auf Port ${serverPort}`);
        setStatus('running', `embedded:${serverPort}`);
        
        node.send({
          topic: 'server.started',
          payload: {
            type: 'embedded',
            port: serverPort,
            url: `nats://localhost:${serverPort}`
          }
        });
      } catch (err) {
        node.error(`Fehler beim Starten des embedded Servers: ${err.message}`);
        setStatus('error', err.message.substring(0, 20));
      }
    };

    // Start NATS server as child process
    const startNatsServerProcess = () => {
      return new Promise((resolve, reject) => {
        log(`Starte NATS Server Prozess auf Port ${node.port}...`);
        setStatus('starting', 'starting process...');

        // Check if nats-server is available
        const natsServerCmd = process.platform === 'win32' ? 'nats-server.exe' : 'nats-server';
        
        const args = ['-p', node.port.toString()];
        
        if (node.enableJetStream) {
          args.push('-js');
          if (node.storeDir) {
            args.push('-sd', node.storeDir);
          }
        }

        log(`Befehl: ${natsServerCmd} ${args.join(' ')}`);

        natsServerProcess = spawn(natsServerCmd, args, {
          stdio: node.debug ? 'inherit' : 'pipe',
          shell: true
        });

        let started = false;
        const timeout = setTimeout(() => {
          if (!started) {
            reject(new Error('NATS Server start timeout'));
          }
        }, 10000);

        natsServerProcess.on('error', (err) => {
          clearTimeout(timeout);
          if (err.code === 'ENOENT') {
            node.error('nats-server nicht gefunden. Installieren Sie NATS Server oder verwenden Sie embedded Server.');
            setStatus('error', 'nats-server fehlt');
            reject(new Error('nats-server command not found'));
          } else {
            node.error(`Fehler beim Starten: ${err.message}`);
            setStatus('error', err.message.substring(0, 20));
            reject(err);
          }
        });

        natsServerProcess.on('spawn', () => {
          log('NATS Server Prozess gestartet');
        });

        natsServerProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          log(`NATS Server: ${output}`);
          if (output.includes('listening') && !started) {
            started = true;
            clearTimeout(timeout);
            serverPort = node.port;
            setStatus('running', `process:${serverPort}`);
            node.send({
              topic: 'server.started',
              payload: {
                type: 'process',
                port: serverPort,
                url: `nats://localhost:${serverPort}`,
                pid: natsServerProcess.pid
              }
            });
            resolve();
          }
        });

        natsServerProcess.stderr?.on('data', (data) => {
          const output = data.toString();
          log(`NATS Server stderr: ${output}`);
        });

        natsServerProcess.on('exit', (code) => {
          log(`NATS Server beendet mit Code ${code}`);
          setStatus('stopped', `exited:${code}`);
          natsServerProcess = null;
          node.send({
            topic: 'server.stopped',
            payload: { code, type: 'process' }
          });
        });
      });
    };

    // Start Leaf Node Server
    const startLeafNodeServer = () => {
      return new Promise((resolve, reject) => {
        log(`Starte Leaf Node Server auf Port ${node.leafPort}...`);
        setStatus('starting', 'starting leaf...');

        const natsServerCmd = process.platform === 'win32' ? 'nats-server.exe' : 'nats-server';
        
        // Create leaf node configuration
        const leafConfig = {
          port: node.leafPort,
          leafnodes: {
            remotes: [{
              url: node.leafRemoteUrl || 'nats://localhost:4222',
              ...(node.leafRemoteUser && { user: node.leafRemoteUser }),
              ...(node.leafRemotePass && { password: node.leafRemotePass })
            }]
          }
        };

        // Write config to temp file
        const configFile = path.join(os.tmpdir(), `nats-leaf-${Date.now()}.conf`);
        fs.writeFileSync(configFile, JSON.stringify(leafConfig, null, 2));

        const args = ['-c', configFile];
        
        if (node.enableJetStream) {
          args.push('-js');
        }

        log(`Befehl: ${natsServerCmd} ${args.join(' ')}`);

        natsServerProcess = spawn(natsServerCmd, args, {
          stdio: node.debug ? 'inherit' : 'pipe',
          shell: true
        });

        let started = false;
        const timeout = setTimeout(() => {
          if (!started) {
            reject(new Error('Leaf Node Server start timeout'));
          }
        }, 10000);

        natsServerProcess.on('error', (err) => {
          clearTimeout(timeout);
          if (err.code === 'ENOENT') {
            node.error('nats-server nicht gefunden. Installieren Sie NATS Server.');
            setStatus('error', 'nats-server fehlt');
            reject(new Error('nats-server command not found'));
          } else {
            node.error(`Fehler beim Starten: ${err.message}`);
            setStatus('error', err.message.substring(0, 20));
            reject(err);
          }
        });

        natsServerProcess.on('spawn', () => {
          log('Leaf Node Server Prozess gestartet');
        });

        natsServerProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          log(`Leaf Node: ${output}`);
          if (output.includes('listening') && !started) {
            started = true;
            clearTimeout(timeout);
            serverPort = node.leafPort;
            setStatus('running', `leaf:${serverPort}`);
            node.send({
              topic: 'server.started',
              payload: {
                type: 'leaf',
                port: serverPort,
                url: `nats://localhost:${serverPort}`,
                remoteUrl: node.leafRemoteUrl,
                pid: natsServerProcess.pid
              }
            });
            resolve();
          }
        });

        natsServerProcess.on('exit', (code) => {
          log(`Leaf Node Server beendet mit Code ${code}`);
          setStatus('stopped', `exited:${code}`);
          natsServerProcess = null;
          // Clean up config file
          try {
            fs.unlinkSync(configFile);
          } catch (e) {
            // Ignore
          }
          node.send({
            topic: 'server.stopped',
            payload: { code, type: 'leaf' }
          });
        });
      });
    };

    // Stop server
    const stopServer = async () => {
      log('Stoppe NATS Server...');
      setStatus('stopped', 'stopping...');

      if (natsServer) {
        // Embedded server
        try {
          await natsServer.stop();
          log('Embedded Server gestoppt');
        } catch (err) {
          node.error(`Fehler beim Stoppen: ${err.message}`);
        }
        natsServer = null;
      }

      if (natsServerProcess) {
        // Process server
        natsServerProcess.kill('SIGTERM');
        natsServerProcess = null;
        log('Server Prozess gestoppt');
      }

      serverPort = null;
      setStatus('stopped');
      node.send({
        topic: 'server.stopped',
        payload: { type: node.serverType }
      });
    };

    // Start server based on type
    const startServer = async () => {
      try {
        switch (node.serverType) {
          case 'embedded':
            await startEmbeddedServer();
            break;
          case 'nats-server':
            await startNatsServerProcess();
            break;
          case 'leaf':
            await startLeafNodeServer();
            break;
          default:
            node.error(`Unbekannter Server-Typ: ${node.serverType}`);
            setStatus('error', 'unknown type');
        }
      } catch (err) {
        node.error(`Fehler beim Starten: ${err.message}`);
        setStatus('error', err.message.substring(0, 20));
      }
    };

    // Input handler
    node.on('input', async (msg) => {
      const command = msg.payload?.command || msg.topic || 'toggle';

      switch (command) {
        case 'start':
          await startServer();
          break;
        case 'stop':
          await stopServer();
          break;
        case 'restart':
          await stopServer();
          setTimeout(() => startServer(), 1000);
          break;
        case 'status':
          node.send({
            topic: 'server.status',
            payload: {
              running: !!(natsServer || natsServerProcess),
              type: node.serverType,
              port: serverPort,
              url: serverPort ? `nats://localhost:${serverPort}` : null
            }
          });
          break;
        case 'toggle':
        default:
          if (natsServer || natsServerProcess) {
            await stopServer();
          } else {
            await startServer();
          }
          break;
      }
    });

    // Auto-start if configured
    if (node.autoStart) {
      setTimeout(() => {
        startServer();
      }, 1000);
    } else {
      setStatus('stopped');
    }

    // Cleanup on close
    node.on('close', async () => {
      await stopServer();
    });
  }

  RED.nodes.registerType('nats-suite-server-manager', NatsServerManagerNode);
};

