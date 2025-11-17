# 📦 NATS Suite - Example Flows

Pre-built test flows for all new features.

---

## 🚀 Quick Start

1. **Start NATS Server:**
   ```bash
   docker run -p 4222:4222 nats:latest -js
   ```

2. **Create Server Config Node:**
   - In Node-RED: Menu → Configuration Nodes → Add
   - Type: `nats-suite-server`
   - ID: `nats-server-config`
   - Server: `nats://localhost:4222` (or `nats://nats-server:4222` if in Docker)
   - Auth Method: No Authentication
   - Save

3. **Import Flow:**
   - Menu → Import → Select file
   - Deploy flow
   - Click test buttons

---

## 📚 Available Flows

### 01 - Message Headers
**File:** `01-message-headers.json`

**Feature:** Message Headers (static + dynamic)

**Test Procedure:**
1. Deploy flow
2. Click "Send with Headers" inject
3. Check debug output:
   - `msg.headers.X-App`: "Node-RED"
   - `msg.headers.X-Version`: "1.0"
   - `msg.headers.X-User`: "TestUser"
   - `msg.headers.X-Request-ID`: "12345"

**Expected:**
```json
{
  "payload": { "message": "Test with headers" },
  "headers": {
    "X-App": "Node-RED",
    "X-Version": "1.0",
    "X-User": "TestUser",
    "X-Request-ID": "12345"
  }
}
```

---

### 02 - Consumer Pause/Resume
**File:** `02-consumer-pause-resume.json`

**Feature:** Consumer Pause/Resume

**Test Procedure:**
1. Deploy flow
2. "1. Create Stream" → Create stream
3. "2. Fill Stream" → Add 10 messages
4. "3. Start Consume" → Consumer starts
5. "4. ✋ PAUSE" → Consumer pauses
6. "5. ▶️ RESUME" → Consumer continues
7. "6. Continue Consume" → More messages

**Nodes:**
- Stream Publisher (Create + Publish)
- Stream Consumer (Consume + Pause/Resume)
- Function Nodes (ACK Messages)

---

### 03 - Service API Echo Service
**File:** `03-service-echo.json`

**Feature:** Service API (Discover, Stats, Ping, Endpoints)

**Test Procedure:**
1. Deploy flow (Echo Service starts automatically)
2. "1. Discover Services" → Finds echo-service
3. "2. Call Echo Service" → Sends request, receives echo
4. "3. Get Service Stats" → Shows request statistics
5. "4. Ping Service" → Checks availability
6. "5. Load Test" → Sends 100 requests

**Service:**
- Name: `echo-service`
- Version: `1.0.0`
- Endpoint: `process` (`echo.process`)
- Handler: Echo logic with validation

**Expected Echo Response:**
```json
{
  "echo": "Hello from client!",
  "timestamp": 1234567890,
  "service": "echo-service",
  "version": "1.0.0",
  "requestId": "req-12345"
}
```

---

## 🔧 Customization

### Change Server URL

If NATS Server is not running on `localhost:4222`:

1. Open Configuration Nodes
2. Edit `nats-suite-server` config
3. Adjust server URL (e.g., `nats://192.168.1.100:4222`)
4. Save → Deploy

### Enable/Disable Debug

All nodes have a `debug` option:
- TRUE: Detailed logs in Node-RED debug console
- FALSE: Errors only

### Adjust Timeouts

Request nodes have timeout settings:
- Default: 5000ms (5 seconds)
- For slow services: 10000ms or more

---

## 📊 Additional Test Flows

### KV Store - Delete/Purge

**Manual Flow:**

```
[inject] → [kv-put: create] → [debug]
   ↓
[inject] → [kv-put: delete] → [debug]
   ↓
[inject] → [kv-put: purge] → [debug]
```

**Config:**
- Bucket: `test-bucket`
- Key: `test.key`

**Operations:**
1. Create: `{ "key": "test.key", "payload": "Test Value" }`
2. Delete: `{ "operation": "delete", "key": "test.key" }`
3. Purge: `{ "operation": "purge", "key": "test.key" }`

---

### KV Store - List Keys

**Manual Flow:**

```
[inject] → [kv-get: keys] → [debug]
```

**Config:**
- Mode: `keys`
- Bucket: `test-bucket`

**Inject:**
```json
{}
```

**Expected:**
```json
{
  "payload": ["key1", "key2", "key3"],
  "count": 3
}
```

---

### Stream - Subject Update

**Manual Flow:**

```
[inject] → [stream-publisher: update-subjects] → [debug]
```

**Config:**
- Operation: `update-subjects`
- Stream: `test-stream`

**Inject:**
```json
{
  "operation": "update-subjects",
  "subjects": "test.>, sensor.>, data.>"
}
```

---

### Consumer Monitoring

**Manual Flow:**

```
[inject: every 5s] → [stream-consumer: monitor] → [debug]
```

**Config:**
- Operation: `monitor`
- Stream: `test-stream`
- Consumer: `test-consumer`

**Inject (Repeat every 5s):**
```json
{ "operation": "monitor" }
```

**Expected:**
```json
{
  "stats": {
    "pending": 10,
    "delivered": 50,
    "ack_pending": 2,
    "redelivered": 1,
    "delivery_rate": 5.25
  }
}
```

---

## 🐛 Troubleshooting

### Flow Import Error

**Problem:** "Unknown node type: nats-suite-xxx"

**Solution:**
1. Ensure NATS Suite is installed
2. Restart Node-RED
3. Re-import flow

---

### Server Connection Failed

**Problem:** "Cannot connect - NATS server is not connected"

**Solution:**
1. Start NATS Server: `docker run -p 4222:4222 nats:latest -js`
2. Check Server Config Node (URL, Port)
3. Check firewall/network

---

### JetStream Features Not Available

**Problem:** "JetStream not enabled"

**Solution:**
NATS Server **must** be started with `-js` flag:
```bash
docker run -p 4222:4222 nats:latest -js
```

---

### Service Discovery Finds Nothing

**Problem:** `{ "payload": [], "count": 0 }`

**Solution:**
1. Service node must be deployed
2. Auto-Start must be TRUE
3. Wait 1-2 seconds after deploy
4. Trigger discovery again

---

### Debug Output Empty

**Problem:** No messages in debug

**Solution:**
1. Debug node enabled? (green dot)
2. Flow deployed?
3. Inject button clicked?
4. NATS Server running?

---

## 🎯 Best Practices

### 1. Always Start with Create Stream

Before JetStream tests:
```
Create Stream → Publish Messages → Consume Messages
```

### 2. Always ACK Messages

In Consumer:
```javascript
if (msg.ack) {
  msg.ack();
}
```

### 3. Error Handling

Always use Catch node:
```
[node] → [catch] → [debug: errors]
```

### 4. Service Auto-Start

Services should always have Auto-Start: TRUE so they start automatically after deploy.

### 5. Debug Logging

During development: Debug: TRUE
In production: Debug: FALSE

---

## 📖 Additional Resources

- **Main README:** `../README.md`
- **Test Cases:** `../TEST-CASES.md`
- **Quick Test:** `../QUICK-TEST.md`
- **NATS Docs:** https://docs.nats.io

---

**Happy Testing! 🚀**
