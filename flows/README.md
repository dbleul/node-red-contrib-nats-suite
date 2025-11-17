# 📁 Node-RED Flow Examples

Dieser Ordner enthält Beispiel-Flows für alle Nodes im `node-red-contrib-nats-suite` Package.

## 🚀 Verfügbare Beispiel-Flows

### **Core Nodes**

| **Flow** | **Beschreibung** | **Features** |
|----------|------------------|--------------|
| `nats-suite-server-example.json` | UNS Server Konfigurationen | Basic, TLS, JWT, NKey Authentication |
| `nats-suite-publish-example.json` | UNS Publish Szenarien | UNS Value, Event, Specific Topic, Batch, Rate Limiting |
| `nats-suite-subscribe-example.json` | UNS Subscribe Szenarien | UNS Value, Event, Reply, Specific Subject, Wildcard |
| `nats-suite-request-example.json` | UNS Request-Reply Pattern | Simple, Data, Timeout, Batch, Error Handling |
| `nats-suite-health-example.json` | UNS Health Monitoring | Basic, Detailed, Minimal, Stress Test, Alert |

### **Advanced Nodes**

| **Flow** | **Beschreibung** | **Features** |
|----------|------------------|--------------|
| `nats-suite-kv-get-example.json` | NATS-SUITE KV Get Szenarien | Get, Watch, List, History, Test Data |
| `nats-suite-kv-put-example.json` | UNS KV Put Szenarien | Put, Create, Update, Delete, Purge, TTL, Batch |
| `nats-suite-stream-publisher-example.json` | UNS Stream Publisher Szenarien | Simple, Sensor, Event, Batch, Persistent, Throughput |
| `nats-suite-stream-consumer-example.json` | UNS Stream Consumer Szenarien | Pull, Push, Replay, Batch, Durable, Throughput |

## 📋 Verwendung

### **1. Flow Importieren**

1. Öffne Node-RED
2. Gehe zu **Menu** → **Import**
3. Wähle **"Select a file to import"**
4. Wähle eine der `.json` Dateien aus diesem Ordner
5. Klicke **"Import"**

### **2. Konfiguration anpassen**

- **NATS Server**: Passe die Server-URL und Authentifizierung an
- **Credentials**: Konfiguriere die NATS Server Credentials
- **Subjects**: Passe die NATS Subjects an deine Anwendung an
- **Streams**: Konfiguriere JetStream Streams und Consumers

### **3. Flow testen**

- **Inject Nodes**: Verwende die Inject Nodes um Test-Daten zu generieren
- **Debug Nodes**: Überwache die Ausgabe in der Debug-Sidebar
- **Status**: Überprüfe den Status der NATS Server Verbindung

## 🔧 Konfiguration

### **NATS Server Setup**

```javascript
// Beispiel Konfiguration
{
  "server": "localhost:4222",
  "authMethod": "none",
  "enableTLS": false
}
```

### **Credentials Setup**

```javascript
// Beispiel Credentials (in Node-RED Credentials gespeichert)
{
  "user": "nats_user",
  "pass": "nats_password",
  "token": "nats_token",
  "jwt": "jwt_token",
  "nkeySeed": "nkey_seed"
}
```

## 📊 Flow Übersicht

### **nats-suite-server-example.json**
- **Basic Server**: Einfache Verbindung ohne TLS
- **TLS Server**: Sichere Verbindung mit TLS/SSL
- **JWT Server**: Authentifizierung mit JWT + NKey

### **nats-suite-publish-example.json**
- **UNS Value**: Einfache Werte mit automatischer Datatype-Erkennung
- **UNS Event**: Strukturierte Events mit UUID und Timestamp
- **Specific Topic**: Custom NATS Subjects außerhalb UNS Schema
- **Batch Publishing**: Gruppierung von Messages für bessere Performance
- **Rate Limiting**: Schutz vor Message-Flooding mit Token Bucket

### **nats-suite-subscribe-example.json**
- **UNS Value**: Abonniert UNS Datapoint Werte
- **UNS Event**: Abonniert UNS Events mit UUID und Timestamp
- **Reply**: Abonniert Reply Messages
- **Specific Subject**: Abonniert Custom NATS Subjects
- **Wildcard**: Abonniert mehrere Subjects mit Wildcards

### **nats-suite-request-example.json**
- **Simple Request**: Einfache Anfrage mit kurzer Antwort
- **Data Request**: Datenbankabfrage mit längerer Antwortzeit
- **Timeout Request**: Request mit kurzem Timeout (zeigt Timeout-Verhalten)
- **Batch Request**: Batch-Verarbeitung mit vielen Daten
- **Error Request**: Request an nicht existierenden Service (zeigt Error-Handling)

### **nats-suite-health-example.json**
- **Basic Health Check**: Standard Health Check alle 10s
- **Detailed Health Check**: Detaillierte Checks alle 30s
- **Minimal Health Check**: Nur Connection Test alle 5s
- **Stress Test Health Check**: Hohe Thresholds für Performance-Tests
- **Alert Health Check**: Niedrige Thresholds für Alerts

### **nats-suite-kv-get-example.json**
- **Get Value**: Holt einen einzelnen Wert aus dem KV Store
- **Watch Key**: Überwacht Änderungen an einem Key
- **Watch Multiple Keys**: Überwacht mehrere Keys mit Wildcards
- **List All Keys**: Listet alle Keys in einem Bucket auf
- **Get History**: Holt die Historie eines Keys

### **nats-suite-kv-put-example.json**
- **Put Value**: Speichert einen Wert (überschreibt existierende)
- **Create Value**: Erstellt einen neuen Wert (fehlschlag wenn existiert)
- **Update Value**: Aktualisiert einen existierenden Wert (fehlschlag wenn nicht existiert)
- **Delete Value**: Löscht einen Wert
- **Purge Bucket**: Löscht alle Werte in einem Bucket
- **TTL Example**: Speichert mit Time-To-Live

### **nats-suite-stream-publisher-example.json**
- **Simple Message**: Einfache Nachricht in einen Stream
- **Sensor Data**: Sensordaten mit Deduplication
- **Event Data**: Event-Nachrichten mit Headers
- **Batch Data**: Batch-Verarbeitung von Daten
- **Persistent Data**: Dauerhafte Speicherung mit Interest Policy
- **High Throughput**: Hohe Nachrichtenrate mit Memory Storage

### **nats-suite-stream-consumer-example.json**
- **Pull Consumer**: Manuell getriggerte Nachrichtenabholung
- **Push Consumer**: Automatisch gepushte Nachrichten mit Heartbeat
- **Replay Consumer**: Replay aller Nachrichten in einem Stream
- **Batch Consumer**: Batch-Verarbeitung von Nachrichten
- **Durable Consumer**: Persistenter Consumer mit State
- **Throughput Consumer**: Hohe Nachrichtenrate mit Flow Control

## 🛠️ Anpassungen

### **Eigene Flows erstellen**

1. **Kopiere** einen bestehenden Flow
2. **Passe** die Konfiguration an deine Bedürfnisse an
3. **Teste** den Flow mit deinen Daten
4. **Speichere** den Flow in deinem Node-RED

### **Erweiterte Konfiguration**

- **Streams**: Konfiguriere JetStream Streams mit verschiedenen Retention Policies
- **Consumers**: Erstelle Consumer mit verschiedenen Acknowledgment Policies
- **KV Stores**: Verwende NATS KV Store für verteilte Konfiguration
- **Security**: Implementiere TLS/SSL und erweiterte Authentifizierung

## 📚 Weitere Informationen

- **README.md**: Hauptdokumentation des Packages
- **CHANGELOG.md**: Änderungsprotokoll
- **SECURITY.md**: Sicherheitsrichtlinien
- **docs/**: Detaillierte Dokumentation

## 🤝 Support

Bei Fragen oder Problemen:

1. **Überprüfe** die Debug-Ausgabe
2. **Konsultiere** die Dokumentation
3. **Teste** mit den Beispiel-Flows
4. **Erstelle** ein Issue im Repository

---

**Viel Spaß beim Experimentieren mit den Beispiel-Flows!** 🚀

