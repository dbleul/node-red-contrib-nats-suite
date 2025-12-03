## Changelog

### 0.0.1 – Initial preview

- Initial public release of `node-red-contrib-nats-suite`.
- Core NATS nodes: `nats-suite-server`, `nats-suite-publish`, `nats-suite-subscribe`, `nats-suite-request`, `nats-suite-reply`, `nats-suite-health`, `nats-suite-stats`.
- JetStream nodes: `nats-suite-stream-publisher`, `nats-suite-stream-consumer` (including stream/consumer management operations).
- Key-Value Store nodes: `nats-suite-kv-get`, `nats-suite-kv-put`.
- Object Store nodes: `nats-suite-object-put`, `nats-suite-object-get`.
- Service API node: `nats-suite-service` (service discovery, stats, endpoints, ping).
- NATS Server Manager node: `nats-suite-server-manager` for starting/stopping NATS directly from Node-RED.
- Added Jest configuration and initial test cases under `__tests__` plus detailed manual scenarios in `TEST-CASES.md`.


