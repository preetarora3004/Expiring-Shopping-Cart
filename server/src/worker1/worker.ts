import { cache } from "@workspace/server/dependency";
import { service } from "@workspace/server/dependency";

export function cleanUp() {

    let time = new Date().getTime();
    let job = cache.queue.dequeue();
    let delay: number;

    if (!job || cache.map.size <= 0) {
        setTimeout(() => {
            cleanUp();
        }, 10000);
    }
    else {
        delay = time - job.ttl!

        setTimeout(async () => {
            if (await service.handleExpiredItem(job.reservedItemId)) {
                console.log(`Successfully removed cache`);
            }
        }, delay);
    }
}




