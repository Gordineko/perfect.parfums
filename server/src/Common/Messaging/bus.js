// src/Common/Messaging/bus.js

/**
 * Простейшая in-memory шина событий.
 * Используется для:
 *  - domain events
 *  - outbox pattern
 *  - loose coupling между модулями
 */
export class InMemoryBus {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * Подписка на событие
   * @param {string} eventName
   * @param {(payload:any)=>Promise<void>|void} handler
   */
  subscribe(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    this.handlers.get(eventName).push(handler);

    // unsubscribe
    return () => {
      const list = this.handlers.get(eventName) || [];
      this.handlers.set(
        eventName,
        list.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Публикация события
   * @param {string} eventName
   * @param {any} payload
   */
  async publish(eventName, payload) {
    const handlers = this.handlers.get(eventName) || [];

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[BUS] handler error for "${eventName}"`, err);
      }
    }
  }

  /**
   * Очистка всех подписчиков (на shutdown)
   */
  clear() {
    this.handlers.clear();
  }
}

export default InMemoryBus;
