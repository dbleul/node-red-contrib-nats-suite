# Node-Specific Example Flows

Comprehensive example flows for each NATS Suite node, demonstrating all features and configuration options.

## 📋 Available Flows

### 01 - Publish Node Examples (`01-publish-examples.json`)
**Features demonstrated:**
- Basic publish (JSON, String, Buffer, Reply formats)
- Message Headers (static + dynamic)
- Message Expiration (TTL)
- Buffering (count-based + byte-based)
- Buffer Persistence (context, file, both)
- Batch Processing (size, interval, hybrid modes)
- Rate Limiting (drop, delay actions)
- Auto-Reply Handler

**Use Cases:**
- Simple message publishing
- Headers for routing/metadata
- TTL for time-sensitive messages
- Buffering during disconnection
- High-throughput batch publishing
- Rate limiting for API compliance

---

### 02 - Subscribe Node Examples (`02-subscribe-examples.json`)
**Features demonstrated:**
- Auto parsing (automatic format detection)
- Manual parsing (JSON, String, Buffer)
- Topic field options (subject, id, name, datatype)
- Wildcard subjects (`test.>`)
- Queue groups (load balancing)

**Use Cases:**
- Receiving messages with automatic parsing
- Manual format control
- Wildcard subscriptions
- Load-balanced message processing

---

### 03 - Request Node Examples (`03-request-examples.json`)
**Features demonstrated:**
- Basic request/reply
- Timeout handling (with status messages)
- Different data formats
- Error handling

**Use Cases:**
- Synchronous service calls
- Timeout-aware requests
- Error handling patterns

---

### 04 - Reply Node Examples (`04-reply-examples.json`)
**Features demonstrated:**
- Basic reply (echo service)
- Error responses
- Complex service (calculator)
- Request validation

**Use Cases:**
- Simple echo services
- Calculator/processing services
- Error handling in services

---

### 05 - Health & Stats Nodes (`05-health-stats-examples.json`)
**Features demonstrated:**
- Health monitoring
- Server statistics
- JetStream statistics
- Connection statistics
- All statistics combined

**Use Cases:**
- Health checks
- Performance monitoring
- Connection tracking
- System diagnostics

---

### 06 - KV Store Nodes (`06-kv-examples.json`)
**Features demonstrated:**
- Put/Get operations
- Delete (soft delete)
- Purge (hard delete)
- List all keys
- Watch keys (real-time monitoring)
- Bucket management (create)

**Use Cases:**
- Configuration storage
- Key-value caching
- Real-time config updates
- Bucket management

---

### 07 - Stream Nodes (`07-stream-examples.json`)
**Features demonstrated:**
- Stream creation
- Subject updates (without recreating stream)
- Message publishing
- Consumer creation
- Message consumption
- Consumer pause/resume
- Consumer monitoring

**Use Cases:**
- Persistent message storage
- Event streaming
- Consumer management
- Performance monitoring

---

### 08 - Object Store Nodes (`08-object-examples.json`)
**Features demonstrated:**
- Object upload (Put)
- Object download (Get)
- Object listing
- Object deletion
- Bucket management (create)

**Use Cases:**
- File storage
- Configuration files
- Data archives
- Bucket management

---

### 09 - Service Node Examples (`09-service-examples.json`)
**Features demonstrated:**
- Service Discovery (find all services)
- Service Stats (performance metrics)
- Service Ping (availability check)
- Service Endpoints (Echo service, Calculator service)
- Auto-start services
- Queue groups (load balancing)

**Use Cases:**
- Microservice discovery
- Service monitoring
- Health checks
- Load-balanced services

---

### 10 - Server Manager Node (`10-server-manager-examples.json`)
**Features demonstrated:**
- Start server (embedded, process)
- Stop server
- Restart server
- Status check
- Embedded server mode
- Process server mode

**Use Cases:**
- Local development
- Testing environments
- Embedded NATS server
- Process management

---

## 🚀 Quick Start

1. **Start NATS Server:**
   ```bash
   docker run -p 4222:4222 nats:latest -js
   ```

2. **Import Flow:**
   - In Node-RED: Menu → Import → Select file
   - Deploy flow

3. **Configure Server:**
   - Open Configuration Nodes
   - Edit `nats-suite-server` config
   - Set server URL (e.g., `nats://localhost:4222`)
   - Save → Deploy

4. **Test Features:**
   - Click inject buttons in order
   - Check debug output
   - Verify results

---

## 📝 Notes

- All flows use a shared `nats-suite-server` config node
- Debug logging is enabled in most nodes for visibility
- Some flows require specific setup (e.g., Stream flows need JetStream enabled)
- Watch operations run continuously (no inject needed)

---

## 🔧 Customization

### Change Server URL
1. Open Configuration Nodes
2. Edit `nats-suite-server` config
3. Update server URL
4. Save → Deploy

### Enable/Disable Debug
- Most nodes have a `debug` option
- Set to `true` for detailed logs
- Set to `false` for production

---

**Happy Testing! 🚀**

