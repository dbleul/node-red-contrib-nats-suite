# node-red-contrib-nats-suite

A comprehensive Node-RED module for NATS (NATS Messaging System) with support for all major NATS features. This is a **generic NATS implementation** that works with any NATS server - not bound to a specific platform.

## Status & Versioning

- **Current version**: `0.0.1` (initial preview release)
- **Stability**: APIs and node options may still change between minor versions.
- **Tested with**: Node-RED `>= 3.0.0`, Node.js `>= 14.0.0`, NATS Server `>= 2.9` (with JetStream enabled for JetStream/KV/Object Store features).
- For detailed manual test flows, see `TEST-CASES.md`. Automated tests are located in the `__tests__` directory and can be executed via `npm test`.

## Features

### ✅ Core NATS (Basic NATS Core Functionality)
- **Publish/Subscribe**: Full support for NATS Pub/Sub messaging
- **Request/Reply**: NATS Request/Reply pattern for synchronous communication
- **Queue Groups**: Load balancing with Queue Groups
- **Headers**: Support for NATS Headers
- **Wildcards**: Subject wildcards (*, >)
- **TLS**: Encrypted connections
- **Authentication**: Token, Username/Password, JWT or NKey
- **Reconnect**: Automatic reconnection on connection loss
- **Clustering**: Support for NATS clustering
- **Leaf Nodes**: Support for NATS Leaf Node connections

### ✅ JetStream (JetStream Functionality)
- **Streams**: JetStream Stream management with auto-creation
- **Publishers**: Publishes messages to streams
- **Consumers**: Pull/Push consumers with various modes
- **Retention Policies**: Limits, Interest, Work Queue
- **Replay**: Message replay functionality
- **Deduplication**: Automatic deduplication

### ✅ KV Store (NATS KV Functionality - uses JetStream)
- **Bucket Management**: Create and configure KV buckets
- **Get/Put**: Read and write values
- **Watch**: Monitor changes
- **History**: Access to history
- **TTL**: Time To Live support
- **Compression**: Value compression

### ✅ Object Store (NATS Object Store - uses JetStream)
- **Bucket Management**: Create and configure Object Store buckets
- **Upload**: Upload objects (automatic chunking)
- **Download**: Download objects
- **List**: List all objects
- **Delete**: Delete objects
- **Metadata**: Support for metadata and Content-Type

## Installation

```bash
npm install node-red-contrib-nats-suite
```

Or in the Node-RED Editor:
1. Menu → Manage palette → Install
2. Search for `node-red-contrib-nats-suite`
3. Install

## Node Overview

### 🔧 Configuration & Management

| Node | Description | Category |
|------|-------------|----------|
| **nats-suite-server** | NATS Server connection configuration (for all other nodes) | Config |
| **nats-suite-server-manager** | Starts/stops NATS Server directly in Node-RED (Embedded/Process/Leaf Node) | Management |

### 📡 Core NATS

| Node | Function | Input | Output |
|------|----------|-------|--------|
| **nats-suite-publish** | Publishes messages to subjects + Headers + Message Expiration (TTL) | `msg.payload`, `msg.topic`, `msg.headers`, `msg.expiration` | - |
| **nats-suite-subscribe** | Subscribes to messages from subjects | - | `msg.payload`, `msg.topic`, `msg.headers` |
| **nats-suite-request** | Request/Reply pattern (Client) | `msg.payload`, `msg.topic` | `msg.payload` (Response) |
| **nats-suite-reply** | Request/Reply pattern (Server) | `msg.payload` | `msg.payload` (Request) |
| **nats-suite-health** | Server health monitoring | - | `msg.payload` (Health Status) |
| **nats-suite-stats** | Detailed server statistics | - | `msg.payload` (Stats) |
| **nats-suite-service** | Service API (Discovery, Stats, Endpoints) | `msg.operation` | `msg.payload` (Services/Stats/Requests) |

### 🌊 JetStream

| Node | Function | Input | Output |
|------|----------|-------|--------|
| **nats-suite-stream-publisher** | Publishes to JetStream streams + Stream management (create/update/update-subjects/delete/purge/list/info) | `msg.payload`, Stream name, `msg.operation`, `msg.subjects` | - |
| **nats-suite-stream-consumer** | Consumes from JetStream streams + Consumer management (create/info/delete/list/pause/resume/monitor) + Stream management (info/delete/purge) | `msg.operation`, `msg.consumer` | `msg.payload` (Stream messages or Consumer info) |

### 💾 KV Store (Key-Value)

| Node | Function | Input | Output |
|------|----------|-------|--------|
| **nats-suite-kv-get** | Reads values from KV Store + List keys + Watch | Key, `msg.operation` (get/keys/watch) | `msg.payload` (Value/Keys array) |
| **nats-suite-kv-put** | Writes values to KV Store + Delete/Purge keys + Bucket management (create/info/delete/list) | Key, `msg.payload` (Value), `msg.operation` (put/create/update/delete/purge) | Status |

### 📦 Object Store

| Node | Function | Input | Output |
|------|----------|-------|--------|
| **nats-suite-object-put** | Uploads objects + Deletes objects + Bucket management (create/info/delete/list) | Object name, `msg.payload` (Data), `msg.operation` | Status |
| **nats-suite-object-get** | Downloads objects + Lists objects | Object name, `msg.operation` | `msg.payload` (Data/Array) |

---

## Quick Reference

### Core NATS Workflow
```
[Inject] → [nats-suite-publish] → NATS Server → [nats-suite-subscribe] → [Debug]
```

### Request/Reply Pattern
```
[Inject] → [nats-suite-request] → NATS Server → [nats-suite-subscribe] → [Function] → [nats-suite-publish]
```

### JetStream Workflow
```
[Inject] → [nats-suite-stream-publisher] → JetStream → [nats-suite-stream-consumer] → [Debug]
```

### KV Store Workflow
```
[Inject] → [nats-suite-kv-put] → KV Store
[Inject] → [nats-suite-kv-get] → KV Store → [Debug]
```

## Usage Examples

### 1. Publish/Subscribe
```
[Inject] → [nats-suite-publish] → [nats-suite-subscribe] → [Debug]
```
- Configure `nats-suite-server` with your NATS server URL
- `nats-suite-publish`: Subject `my.topic`, `msg.payload` = message
- `nats-suite-subscribe`: Subject `my.topic`

### 2. Request/Reply
```
[Inject] → [nats-suite-request] → [Debug]
```
- `nats-suite-request`: Subject `service.request`, Timeout 10000ms
- Response is automatically received

### 3. JetStream Streams
```
[Inject] → [nats-suite-stream-publisher] → [nats-suite-stream-consumer] → [Debug]
```
- Stream is automatically created
- Messages are persistently stored

### 4. KV Store
```
[Inject] → [nats-suite-kv-put] (Key: "mykey", Value: msg.payload)
[Inject] → [nats-suite-kv-get] (Key: "mykey") → [Debug]
```
- Bucket is automatically created
- Values are persistently stored

## NATS Server Setup

### Option 1: External NATS Server
```bash
docker run -p 4222:4222 nats:latest
# or
nats-server
```

### Option 2: NATS Server Manager (in Node-RED)
Use the `nats-suite-server-manager` node:

- **Embedded**: `npm install nats-memory-server` (for testing)
- **Process**: Starts `nats-server` as a separate process  
- **Leaf Node**: Connects to remote NATS cluster

**Commands:** `msg.payload.command = "start"|"stop"|"restart"|"status"`

## Requirements

- Node-RED >= 3.0.0
- Node.js >= 14.0.0
- NATS Server (local, remote or Leaf Node)

---

## ✨ Advanced Features

### 🔥 Core NATS Extensions

#### **Message Headers**
- Static headers in node configuration (JSON)
- Dynamic headers via `msg.headers`
- Automatic merging of static + dynamic headers
- Debugging support

#### **Message Expiration (TTL)**
- Configurable message-level TTL (0-86400 seconds)
- Dynamic TTL via `msg.expiration`
- Automatic conversion to nanoseconds for NATS

### 🌊 JetStream Extensions

#### **Stream Subject Update**
- New operation `update-subjects` for Stream Publisher
- Updates only subjects without changing other stream config
- Input via `msg.subjects` (comma-separated)

#### **Consumer Pause/Resume**
- New operations `pause` and `resume` for Stream Consumer
- Temporarily stops/starts message fetching
- Local state management
- Status display in Node-RED

#### **Consumer Monitoring**
- New operation `monitor` for detailed consumer stats
- Metrics: pending, delivered, ack_pending, redelivered, waiting
- Delivery rate calculation (messages/second)
- Pause status display

### 💾 KV Store Extensions

#### **KV Delete Operations** *(already available, documented)*
- `delete` - Soft delete (marked as deleted)
- `purge` - Hard delete (removes all revisions)

#### **KV Keys List** *(already available, documented)*
- New operation `keys` in KV Get node
- Lists all keys of a bucket
- Output: Array with all keys + count

### 🔌 Service API (NEW)

Completely new node for NATS Service API (Microservice Discovery):

#### **Service Discovery**
- Finds all available NATS services in the network
- Filter by service name or all services (`*`)
- Output: Name, Version, ID, Metadata

#### **Service Stats**
- Retrieve performance metrics for services
- Request counts, endpoints, stats
- Monitoring and health checks

#### **Service Endpoints**
- Creates NATS service endpoints
- Request handler with `msg.respond()` and `msg.respondError()`
- Automatic load balancing via Queue Groups
- Metadata support (JSON)
- Auto-start option
- Automatic stats tracking (requests, errors, avg processing time)

#### **Ping Services**
- Checks service availability
- Ping responses from all service instances

---

## License

MIT License - see LICENSE file for details.

## Author

blanpa

## Support

For issues or questions, please create an issue in the repository.
