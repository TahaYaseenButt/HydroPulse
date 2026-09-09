/**
 * Pure JavaScript MQTT 3.1.1 WebSocket Client for React Native & Expo
 * Connects over secure WebSockets (wss://) to HiveMQ Cloud.
 * Zero external native dependencies.
 */

export class HydroMobileMQTTClient {
  constructor(options = {}) {
    this.host = options.host || '';
    this.port = options.port || 8884;
    this.path = options.path || '/mqtt';
    this.username = options.username || '';
    this.password = options.password || '';
    this.clientId = options.clientId || ('hydro_expo_' + Math.random().toString(16).substring(2, 10));
    this.keepAlive = options.keepAlive || 60;

    this.onConnect = options.onConnect || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onLog = options.onLog || (() => {});

    this.ws = null;
    this.packetId = 1;
    this.pingTimer = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.autoReconnect = true;
    this.subscribedTopics = new Set();
  }

  connect() {
    this.disconnect(false);

    const protocol = 'wss://';
    const cleanPath = this.path.startsWith('/') ? this.path : `/${this.path}`;
    const url = `${protocol}${this.host}:${this.port}${cleanPath}`;

    this.onLog(`[MQTT] Connecting to ${url}...`, 'info');

    try {
      this.ws = new WebSocket(url, ['mqtt', 'mqttv3.1.1', 'mqttv3.1']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.onLog('[MQTT] WebSocket connected. Sending CONNECT frame...', 'info');
        this.sendConnectPacket();
      };

      this.ws.onmessage = (event) => {
        let uint8Data;
        if (event.data instanceof ArrayBuffer) {
          uint8Data = new Uint8Array(event.data);
        } else if (event.data && event.data.buffer) {
          uint8Data = new Uint8Array(event.data.buffer);
        } else {
          return;
        }
        this.handleIncomingData(uint8Data);
      };

      this.ws.onerror = (err) => {
        this.onLog(`[MQTT] WebSocket error: ${err.message || 'Unknown'}`, 'error');
        this.onError(err);
      };

      this.ws.onclose = (event) => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        clearInterval(this.pingTimer);
        this.onLog(`[MQTT] WebSocket closed (code: ${event.code})`, wasConnected ? 'warn' : 'error');
        this.onClose(event);

        if (this.autoReconnect) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.onLog('[MQTT] Auto-reconnecting to HiveMQ...', 'info');
            this.connect();
          }, 6000);
        }
      };
    } catch (ex) {
      this.onLog(`[MQTT] Exception during connect: ${ex.message}`, 'error');
      this.onError(ex);
    }
  }

  disconnect(manual = true) {
    if (manual) this.autoReconnect = false;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingTimer);

    if (this.ws) {
      if (this.isConnected) {
        try {
          this.ws.send(new Uint8Array([0xE0, 0x00]).buffer);
        } catch (e) {}
      }
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
  }

  sendConnectPacket() {
    const protocolName = 'MQTT';
    const protocolLevel = 4; // MQTT 3.1.1
    let flags = 0x02; // Clean Session

    if (this.username) flags |= 0x80;
    if (this.password) flags |= 0x40;

    const varHeader = [];
    this.writeString(varHeader, protocolName);
    varHeader.push(protocolLevel);
    varHeader.push(flags);
    varHeader.push((this.keepAlive >> 8) & 0xFF);
    varHeader.push(this.keepAlive & 0xFF);

    const payload = [];
    this.writeString(payload, this.clientId);
    if (this.username) this.writeString(payload, this.username);
    if (this.password) this.writeString(payload, this.password);

    const fullBody = varHeader.concat(payload);
    const packet = this.buildPacket(0x10, fullBody); // 0x10 = CONNECT

    this.sendRaw(packet);
  }

  subscribe(topic, qos = 0) {
    this.subscribedTopics.add(topic);

    if (!this.isConnected || !this.ws) {
      return;
    }

    const pId = this.nextPacketId();
    const varHeader = [(pId >> 8) & 0xFF, pId & 0xFF];
    const payload = [];
    this.writeString(payload, topic);
    payload.push(qos & 0x03);

    const packet = this.buildPacket(0x82, varHeader.concat(payload)); // 0x82 = SUBSCRIBE
    this.sendRaw(packet);
    this.onLog(`[MQTT] Subscribed to topic: ${topic}`, 'info');
  }

  publish(topic, message, qos = 0) {
    if (!this.isConnected || !this.ws) {
      this.onLog(`[MQTT] Cannot publish to "${topic}": Not connected`, 'warn');
      return false;
    }

    const flags = (qos & 0x03) << 1;
    const varHeader = [];
    this.writeString(varHeader, topic);

    let pId = 0;
    if (qos > 0) {
      pId = this.nextPacketId();
      varHeader.push((pId >> 8) & 0xFF);
      varHeader.push(pId & 0xFF);
    }

    const payload = [];
    const msgStr = String(message);
    this.writeAsciiOrUtf8(payload, msgStr);

    const fullBody = varHeader.concat(payload);
    const packet = this.buildPacket(0x30 | flags, fullBody); // 0x30 = PUBLISH
    this.sendRaw(packet);
    this.onLog(`[MQTT TX] ${topic} → ${msgStr}`, 'data');
    return true;
  }

  sendRaw(packet) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const arr = new Uint8Array(packet);
      this.ws.send(arr.buffer);
    }
  }

  handleIncomingData(data) {
    let offset = 0;
    while (offset < data.length) {
      const headerByte = data[offset++];
      const packetType = headerByte >> 4;
      const flags = headerByte & 0x0F;

      let remLength = 0;
      let multiplier = 1;
      let encodedByte;
      do {
        if (offset >= data.length) return;
        encodedByte = data[offset++];
        remLength += (encodedByte & 0x7F) * multiplier;
        multiplier *= 128;
      } while ((encodedByte & 0x80) !== 0);

      const packetEnd = offset + remLength;
      const packetData = data.subarray(offset, packetEnd);
      offset = packetEnd;

      this.processPacket(packetType, flags, packetData);
    }
  }

  processPacket(packetType, flags, data) {
    switch (packetType) {
      case 2: // CONNACK
        this.handleConnack(data);
        break;
      case 3: // PUBLISH
        this.handlePublish(flags, data);
        break;
      case 9: // SUBACK
        this.onLog('[MQTT] Subscription confirmed (SUBACK)', 'success');
        break;
      case 13: // PINGRESP
        break;
      default:
        break;
    }
  }

  handleConnack(data) {
    const returnCode = data[1];
    if (returnCode === 0) {
      this.isConnected = true;
      this.onLog('[MQTT] Connected to HiveMQ Cloud!', 'success');

      // Resubscribe to all registered topics
      for (const topic of this.subscribedTopics) {
        this.subscribe(topic);
      }

      // Keepalive Ping
      clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => {
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendRaw([0xC0, 0x00]); // PINGREQ
        }
      }, (this.keepAlive / 2) * 1000);

      this.onConnect();
    } else {
      this.onLog(`[MQTT] Connection rejected (code ${returnCode})`, 'error');
      this.onError(new Error(`Code ${returnCode}`));
    }
  }

  handlePublish(flags, data) {
    let offset = 0;
    const topicLen = (data[offset] << 8) | data[offset + 1];
    offset += 2;
    const topic = this.bytesToString(data.subarray(offset, offset + topicLen));
    offset += topicLen;

    const qos = (flags >> 1) & 0x03;
    if (qos > 0) {
      const pId = (data[offset] << 8) | data[offset + 1];
      offset += 2;
      if (qos === 1) {
        this.sendRaw([0x40, 0x02, (pId >> 8) & 0xFF, pId & 0xFF]);
      }
    }

    const payloadBytes = data.subarray(offset);
    const payloadStr = this.bytesToString(payloadBytes);

    this.onMessage(topic, payloadStr);
  }

  buildPacket(typeAndFlags, body) {
    const remLengthBytes = this.encodeRemainingLength(body.length);
    return [typeAndFlags, ...remLengthBytes, ...body];
  }

  encodeRemainingLength(length) {
    const result = [];
    let num = length;
    do {
      let digit = num % 128;
      num = Math.floor(num / 128);
      if (num > 0) digit |= 0x80;
      result.push(digit);
    } while (num > 0);
    return result;
  }

  writeString(arr, str) {
    const bytes = this.stringToUtf8Bytes(str);
    arr.push((bytes.length >> 8) & 0xFF);
    arr.push(bytes.length & 0xFF);
    for (let i = 0; i < bytes.length; i++) {
      arr.push(bytes[i]);
    }
  }

  writeAsciiOrUtf8(arr, str) {
    const bytes = this.stringToUtf8Bytes(str);
    for (let i = 0; i < bytes.length; i++) {
      arr.push(bytes[i]);
    }
  }

  stringToUtf8Bytes(str) {
    const utf8 = [];
    for (let i = 0; i < str.length; i++) {
      let charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
    }
    return utf8;
  }

  bytesToString(bytes) {
    let out = '';
    let i = 0;
    const len = bytes.length;
    while (i < len) {
      const c = bytes[i++];
      switch (c >> 4) {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
          out += String.fromCharCode(c);
          break;
        case 12: case 13: {
          const char2 = bytes[i++];
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        }
        case 14: {
          const char2 = bytes[i++];
          const char3 = bytes[i++];
          out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
          break;
        }
        default:
          out += String.fromCharCode(c);
          break;
      }
    }
    return out;
  }

  nextPacketId() {
    this.packetId = (this.packetId % 65535) + 1;
    return this.packetId;
  }
}
