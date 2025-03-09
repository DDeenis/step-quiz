import { Moment } from "./utils";
import type { RateLimiterImpl, RateLimiterStorage } from "./types";

const RESET_AFTER = Moment.from("1h");

export class Throttler implements RateLimiterImpl {
  private timeoutSeconds: number[];
  private storage: RateLimiterStorage;

  constructor(storage: RateLimiterStorage, timeoutSeconds: number[]) {
    this.storage = storage;
    this.timeoutSeconds = timeoutSeconds;
  }

  async consume(key: string): Promise<boolean> {
    let counter = (await this.storage.get(key)) ?? null;
    const now = Date.now();

    if (counter === null || now - counter.lastRequest >= RESET_AFTER) {
      counter = {
        count: 0,
        lastRequest: now,
      };
      await this.storage.set(key, counter);
      return true;
    }

    const allowed =
      now - counter.lastRequest >= this.timeoutSeconds[counter.count]! * 1000;
    if (!allowed) {
      return false;
    }
    counter.lastRequest = now;
    counter.count = Math.min(counter.count + 1, this.timeoutSeconds.length - 1);
    await this.storage.set(key, counter);
    return true;
  }

  async reset(key: string) {
    await this.storage.delete(key);
  }
}
