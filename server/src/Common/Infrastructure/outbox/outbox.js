// src/Common/Infrastructure/outbox/outbox.js

/**
 * Минимальный outbox:
 * - in-memory очередь
 * - worker по таймеру
 * - публикует события в bus.publish(eventName, payload)
 *
 * В будущем:
 * - вместо памяти -> Mongo коллекция outbox_events
 * - ack/retry/backoff
 * - дедупликация
 */

class InMemoryOutboxStore {
  constructor() {
    this.queue = [];
  }

  /**
   * Добавить событие в outbox
   * @param {{eventName:string, payload:any, meta?:any}} event
   */
  push(event) {
    this.queue.push({
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date(),
      attempts: 0,
      ...event,
    });
  }

  /**
   * Взять пачку событий
   */
  takeBatch(limit = 50) {
    if (!this.queue.length) return [];
    return this.queue.splice(0, limit);
  }

  size() {
    return this.queue.length;
  }
}

export const outboxStore = new InMemoryOutboxStore();

/**
 * Публичный helper — чтобы доменные события складывать в outbox,
 * а не вызывать bus напрямую (правильнее для интеграций).
 */
export function enqueueOutboxEvent(eventName, payload, meta = {}) {
  outboxStore.push({ eventName, payload, meta });
}

/**
 * Worker: периодически выгружает события из outbox и публикует в bus.
 * Возвращает stop() для graceful shutdown.
 */
export function startOutboxWorker({
  bus,
  logger,
  intervalMs = 1200,
  batchSize = 50,
} = {}) {
  if (!bus || typeof bus.publish !== "function") {
    throw new Error("Outbox: bus with publish(eventName,payload) is required");
  }

  let timer = null;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;

    try {
      const batch = outboxStore.takeBatch(batchSize);

      for (const evt of batch) {
        try {
          await bus.publish(evt.eventName, evt.payload);
        } catch (e) {
          // если publish упал — можно вернуть обратно (минимальный retry)
          evt.attempts = (evt.attempts || 0) + 1;

          // простая стратегия: вернуть в конец очереди, но ограничить попытки
          if (evt.attempts <= 3) {
            outboxStore.push(evt);
          } else {
            logger?.error?.("[OUTBOX] Dropped event after retries", {
              eventName: evt.eventName,
              attempts: evt.attempts,
              error: String(e?.message || e),
            });
          }
        }
      }
    } catch (err) {
      logger?.error?.("[OUTBOX] tick error", err);
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, intervalMs);

  // один прогон сразу при старте
  tick().catch(() => {});

  return function stopOutboxWorker() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  };
}
