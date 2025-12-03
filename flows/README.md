# 📁 Node-RED Flow Examples

This folder contains example flows for all nodes in the `node-red-contrib-nats-suite` package.

## 🚀 Available Example Flows

### **Core Nodes**

| **Flow** | **Description** | **Features** |
|----------|-----------------|--------------|
| `nats-suite-server-example.json` | NATS server configurations | Basic, TLS, JWT, NKey authentication |
| `nats-suite-publish-example.json` | NATS publish scenarios | Value, Event, Specific Topic, Batch, Rate Limiting |
| `nats-suite-subscribe-example.json` | NATS subscribe scenarios | Value, Event, Reply, Specific Subject, Wildcard |
| `nats-suite-request-example.json` | NATS request-reply patterns | Simple, Data, Timeout, Batch, Error handling |
| `nats-suite-health-example.json` | NATS health monitoring | Basic, Detailed, Minimal, Stress Test, Alert |

### **Advanced Nodes**

| **Flow** | **Description** | **Features** |
|----------|-----------------|--------------|
| `nats-suite-kv-get-example.json` | NATS Suite KV Get scenarios | Get, Watch, List, History, Test data |
| `nats-suite-kv-put-example.json` | NATS Suite KV Put scenarios | Put, Create, Update, Delete, Purge, TTL, Batch |
| `nats-suite-stream-publisher-example.json` | NATS stream publisher scenarios | Simple, Sensor, Event, Batch, Persistent, Throughput |
| `nats-suite-stream-consumer-example.json` | NATS stream consumer scenarios | Pull, Push, Replay, Batch, Durable, Throughput |

## 📋 Usage

### **1. Import a Flow**

1. Open Node-RED
2. Go to **Menu** → **Import**
3. Choose **"Select a file to import"**
4. Select one of the `.json` files from this folder
5. Click **"Import"**

### **2. Adjust Configuration**

- **NATS Server**: Adjust server URL and authentication
- **Credentials**: Configure NATS server credentials
- **Subjects**: Adapt NATS subjects to your application
- **Streams**: Configure JetStream streams and consumers

### **3. Test the Flow**

- **Inject nodes**: Use inject nodes to generate test data
- **Debug nodes**: Monitor the output in the debug sidebar
- **Status**: Check the status of the NATS server connection

## 🔧 Configuration

### **NATS Server Setup**

```javascript
// Example configuration
{
  "server": "localhost:4222",
  "authMethod": "none",
  "enableTLS": false
}
```

### **Credentials Setup**

```javascript
// Example credentials (stored in Node-RED credentials)
{
  "user": "nats_user",
  "pass": "nats_password",
  "token": "nats_token",
  "jwt": "jwt_token",
  "nkeySeed": "nkey_seed"
}
```

## 📊 Flow Overview

### **nats-suite-server-example.json**
- **Basic Server**: Simple connection without TLS
- **TLS Server**: Secure connection with TLS/SSL
- **JWT Server**: Authentication with JWT + NKey

### **nats-suite-publish-example.json**
- **Value**: Simple values with automatic data type detection
- **Event**: Structured events with UUID and timestamp
- **Specific Topic**: Custom NATS subjects outside a fixed schema
- **Batch Publishing**: Grouping of messages for better performance
- **Rate Limiting**: Protection against message flooding with token bucket

### **nats-suite-subscribe-example.json**
- **Value**: Subscribes to datapoint values
- **Event**: Subscribes to events with UUID and timestamp
- **Reply**: Subscribes to reply messages
- **Specific Subject**: Subscribes to custom NATS subjects
- **Wildcard**: Subscribes to multiple subjects using wildcards

### **nats-suite-request-example.json**
- **Simple Request**: Simple request with short response
- **Data Request**: Data query with longer response time
- **Timeout Request**: Request with short timeout (shows timeout behaviour)
- **Batch Request**: Batch processing with multiple items
- **Error Request**: Request to a non-existing service (shows error handling)

### **nats-suite-health-example.json**
- **Basic Health Check**: Standard health check every 10s
- **Detailed Health Check**: Detailed checks every 30s
- **Minimal Health Check**: Connection-only test every 5s
- **Stress Test Health Check**: High thresholds for performance tests
- **Alert Health Check**: Low thresholds for alerts

### **nats-suite-kv-get-example.json**
- **Get Value**: Fetches a single value from the KV store
- **Watch Key**: Watches changes of a single key
- **Watch Multiple Keys**: Watches multiple keys using wildcards
- **List All Keys**: Lists all keys in a bucket
- **Get History**: Fetches the history of a key

### **nats-suite-kv-put-example.json**
- **Put Value**: Stores a value (overwrites existing)
- **Create Value**: Creates a new value (fails if it exists)
- **Update Value**: Updates an existing value (fails if it does not exist)
- **Delete Value**: Deletes a value
- **Purge Bucket**: Removes all values from a bucket
- **TTL Example**: Stores a value with time-to-live

### **nats-suite-stream-publisher-example.json**
- **Simple Message**: Simple message written to a stream
- **Sensor Data**: Sensor data with deduplication
- **Event Data**: Event messages with headers
- **Batch Data**: Batch processing of data
- **Persistent Data**: Persistent storage using interest policy
- **High Throughput**: High message rate using memory storage

### **nats-suite-stream-consumer-example.json**
- **Pull Consumer**: Manually triggered message retrieval
- **Push Consumer**: Automatically pushed messages with heartbeat
- **Replay Consumer**: Replay of all messages in a stream
- **Batch Consumer**: Batch processing of messages
- **Durable Consumer**: Persistent consumer with state
- **Throughput Consumer**: High message rate with flow control

## 🛠️ Customisation

### **Create Your Own Flows**

1. **Copy** an existing flow
2. **Adjust** the configuration to your needs
3. **Test** the flow with your data
4. **Save** the flow in your Node-RED instance

### **Advanced Configuration**

- **Streams**: Configure JetStream streams with different retention policies
- **Consumers**: Create consumers with different acknowledgment policies
- **KV Stores**: Use NATS KV Store for distributed configuration
- **Security**: Implement TLS/SSL and advanced authentication

## 📚 Further Information

- **README.md**: Main documentation of the package
- **CHANGELOG.md**: Change log
- **SECURITY.md**: Security guidelines
- **docs/**: Detailed documentation (if available)

## 🤝 Support

If you have questions or issues:

1. **Check** the debug output
2. **Consult** the documentation
3. **Test** with the example flows
4. **Create** an issue in the repository

---

**Have fun experimenting with the example flows!** 🚀
