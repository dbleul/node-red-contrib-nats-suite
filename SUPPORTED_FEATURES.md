# Supported NATS Features

## Core NATS (Basic NATS Core Functionality)

Fully supported by:

- **nats-suite-publish** - Publishes messages to subjects
- **nats-suite-subscribe** - Subscribes to messages from subjects
- **nats-suite-request** - Request/Reply pattern (Client)
- **nats-suite-reply** - Request/Reply pattern (Server - dedicated)
- **nats-suite-server** - Server configuration and connection management
- **nats-suite-health** - Server health monitoring
- **nats-suite-stats** - Detailed server statistics

**Features:**
- Publish/Subscribe messaging
- Request/Reply pattern
- Queue Groups
- Headers support
- Wildcard subjects
- TLS encryption
- Authentication (Token, User/Pass, JWT, NKey)
- Clustering support
- Leaf Node support

## JetStream (JetStream Functionality)

Fully supported by:

- **nats-suite-stream-publisher** - Publishes messages to JetStream streams + Stream management (create/update/update-subjects/delete/purge/list/info)
- **nats-suite-stream-consumer** - Consumes messages from JetStream streams + Consumer management (create/info/delete/list/pause/resume/monitor) + Stream management (info/delete/purge)

**Features:**
- Stream management (Auto-creation + Explicit management)
- Retention policies (Limits, Interest, Work Queue)
- Consumer management (Pull, Push, Durable + Explicit management)
- Acknowledgment tracking
- Replay functionality
- Deduplication
- Headers support
- Batch processing
- Stream purge
- Stream/Consumer info & status
- Consumer pause/resume
- Consumer monitoring

## KV Store (NATS KV Functionality - uses JetStream)

Fully supported by:

- **nats-suite-kv-get** - Reads values from KV Store + List keys + Watch
- **nats-suite-kv-put** - Writes values to KV Store + Delete/Purge keys + Bucket management (create/info/delete/list)

**Features:**
- Bucket management
- Get/Put operations
- Delete/Purge operations
- Watch functionality (monitor changes)
- List all keys
- History support
- TTL (Time To Live)
- Compression
- Replication
- Storage options (File/Memory)

## Object Store (NATS Object Store Functionality - uses JetStream)

Fully supported by:

- **nats-suite-object-put** - Uploads objects + Deletes objects + Bucket management (create/info/delete/list)
- **nats-suite-object-get** - Downloads objects + Lists objects

**Features:**
- Bucket management
- Object upload/download
- Object listing
- Object deletion
- Metadata support
- Chunking support
- Compression
- Replication
- Storage options (File/Memory)

## Service API (NATS Service API - Microservice Discovery)

Fully supported by:

- **nats-suite-service** - Service discovery, stats, ping, and endpoint management

**Features:**
- Service discovery
- Service statistics
- Service ping
- Service endpoints (with auto load balancing)
- Metadata support
- Auto-start option

---

## Summary

| Feature | Status | Nodes |
|---------|--------|-------|
| **Core NATS** | Complete | publish, subscribe, request, reply, server, health, stats |
| **JetStream** | Complete | stream-publisher, stream-consumer |
| **KV Store** | Complete | kv-get, kv-put |
| **Object Store** | Complete | object-put, object-get |
| **Service API** | Complete | service |

## Additional Features

### Monitoring & Management
- **nats-suite-health** - Server health monitoring
- **nats-suite-stats** - Detailed server statistics (Server, JetStream, Connections)
- **nats-suite-server-manager** - Starts/stops NATS Server directly in Node-RED

### Request/Reply
- **nats-suite-reply** - Dedicated reply node for Request/Reply server-side

## Summary

All major NATS features are now implemented!
