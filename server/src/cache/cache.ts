import { MinPriorityQueue } from "@datastructures-js/priority-queue"

export class Cache {

    public readonly map = new Map<string, number>();
    public readonly queue: MinPriorityQueue<{ reservedItemId: string, ttl: number }>;

    constructor() {
        this.queue = new MinPriorityQueue<{ reservedItemId: string, ttl: number }>({ compare: (a, b) => a.ttl - b.ttl });
    }

    public addCache(reservedItemId: string, ttl: number) {
        const cache = this.checkCache(reservedItemId);

        if (cache) {
            return false;
        }

        this.map.set(reservedItemId, ttl);
        this.queue.enqueue({ reservedItemId, ttl: ttl });

        return true;
    }

    public checkCache(reservedItemId: string) {
        const isExist = this.map.get(reservedItemId);

        return isExist ? isExist : null;
    }

    public cleanUp(reservedItemId: string) {
        return this.map.delete(reservedItemId);
    }
}
