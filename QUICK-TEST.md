# 🚀 Quick Test Guide - New Features

Quick test for all new features in v1.1.0

---

## Prerequisites

Start NATS Server with JetStream:
```bash
docker run -p 4222:4222 nats:latest -js
```

---

## 1. ✨ Message Headers (2 Min)

**Flow:** `[inject] → [publish] → [subscribe] → [debug]`

**Publish Node:**
- Subject: `test.headers`
- ✅ Enable Headers: TRUE
- Static Headers: `{"X-App": "Test"}`
- Debug: TRUE

**Inject:**
```json
{
  "payload": "Test",
  "headers": { "X-User": "Admin" }
}
```

**✓ Expected:** Debug shows both headers (X-App + X-User)

---

## 2. ✨ Message Expiration (2 Min)

**Flow:** `[inject] → [stream-publisher] → [debug]`

**Publisher Node:**
- Stream: `test-stream`
- ✅ Enable Message Expiration: TRUE
- Expiration: `10` seconds
- Debug: TRUE

**Inject:**
```json
{
  "payload": "Expires in 10s"
}
```

**✓ Expected:** Debug log shows "Message expiration: 10s"

---

## 3. ✨ Consumer Pause/Resume (3 Min)

**Setup:** Fill stream with 10 messages

**Flow:** `[inject] → [stream-consumer] → [debug]`

**Consumer Node:**
- Stream: `test-stream`
- Consumer: `test-consumer`
- Operation: `consume` (for normal consumption)

**Test:**

1. **Start consume:**
```json
{ "batchSize": 10 }
```

2. **Send pause:**
```json
{ "operation": "pause" }
```
✓ Status: "paused"

3. **Send resume:**
```json
{ "operation": "resume" }
```
✓ Status: "resumed"

4. **Continue consume:**
```json
{ "batchSize": 10 }
```

---

## 4. ✨ Consumer Monitoring (2 Min)

**Flow:** `[inject] → [stream-consumer] → [debug]`

**Consumer Node:**
- Operation: `monitor`

**Inject:**
```json
{ "operation": "monitor" }
```

**✓ Expected:**
```json
{
  "stats": {
    "pending": 10,
    "delivered": 50,
    "ack_pending": 2,
    "delivery_rate": 5.25
  }
}
```

---

## 5. ✨ Stream Subject Update (2 Min)

**Flow:** `[inject] → [stream-publisher] → [debug]`

**Publisher Node:**
- Stream: `test-stream`
- Operation: `update-subjects`

**Inject:**
```json
{
  "operation": "update-subjects",
  "subjects": "test.>, sensor.>, data.>"
}
```

**✓ Expected:**
```json
{
  "operation": "update-subjects",
  "subjects": ["test.>", "sensor.>", "data.>"],
  "success": true
}
```

---

## 6. ✨ KV Delete/Purge (3 Min)

**Flow A - Create:** `[inject] → [kv-put] → [debug]`
```json
{
  "key": "test.key",
  "payload": "Test Value"
}
```

**Flow B - Delete:** 
```json
{
  "operation": "delete",
  "key": "test.key"
}
```
✓ Expected: `_deleted: true`

**Flow C - Purge:**
```json
{
  "operation": "purge",
  "key": "test.key"
}
```
✓ Expected: `_purged: true`

---

## 7. ✨ KV List Keys (2 Min)

**Flow:** `[inject] → [kv-get] → [debug]`

**KV Get Node:**
- Mode: `keys`
- Bucket: `config-store`

**Inject:**
```json
{}
```

**✓ Expected:**
```json
{
  "payload": ["key1", "key2", "key3"],
  "count": 3
}
```

---

## 8. ✨ Service Discovery (3 Min)

**Flow 1 - Start Service:**
```
[nats-service] → [function] → (auto-response)
```

**Service Node:**
- Mode: `service`
- Service Name: `test-service`
- Version: `1.0.0`
- Endpoint: `echo`
- Auto-Start: TRUE

**Function:**
```javascript
msg.respond({ echo: msg.payload });
return null;
```

**Flow 2 - Discovery:**
```
[inject] → [nats-service] → [debug]
```

**Discovery Node:**
- Mode: `discover`

**Inject:**
```json
{ "operation": "discover" }
```

**✓ Expected:**
```json
{
  "payload": [
    {
      "name": "test-service",
      "version": "1.0.0"
    }
  ],
  "count": 1
}
```

---

## 9. ✨ Service Stats (2 Min)

**Flow:** `[inject] → [nats-service] → [debug]`

**Service Node:**
- Mode: `stats`

**Inject:**
```json
{ "operation": "stats" }
```

**✓ Expected:**
```json
{
  "payload": [
    {
      "name": "test-service",
      "stats": {
        "requests": 5,
        "errors": 0
      }
    }
  ]
}
```

---

## 10. ✨ Service Endpoint (5 Min)

**Flow 1 - Service:**
```
[nats-service] → [function] → (response)
```

**Service Config:**
- Mode: `service`
- Service: `calculator`
- Endpoint: `add`
- Subject: `calc.add`

**Function:**
```javascript
const { a, b } = msg.payload;
msg.respond({ result: a + b });
return null;
```

**Flow 2 - Client:**
```
[inject] → [nats-request] → [debug]
```

**Request Config:**
- Subject: `calc.add`
- Timeout: 5000ms

**Inject:**
```json
{
  "payload": {
    "a": 10,
    "b": 5
  }
}
```

**✓ Expected:**
```json
{
  "payload": {
    "result": 15
  },
  "status": "success"
}
```

---

## ✅ All Tests Successful?

If all 10 tests work, all new features are correctly implemented! 🎉

**Total Time:** ~25 minutes

---

## Troubleshooting

### NATS Server Not Reachable
```
Error: Cannot connect - NATS server is not connected
```
**Fix:** Start NATS Server: `docker run -p 4222:4222 nats:latest -js`

### JetStream Features Not Available
```
Error: JetStream not enabled
```
**Fix:** Start NATS Server with `-js` flag

### Service Discovery Finds Nothing
```
{ "payload": [], "count": 0 }
```
**Fix:** Service node must be deployed with Auto-Start: TRUE

### Node Not Found
```
Error: Node type not found
```
**Fix:** Restart Node-RED after installation

---

**Happy Testing! 🚀**
