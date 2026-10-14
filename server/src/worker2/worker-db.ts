import { repository } from "@workspace/server/dependency";
import { service } from "@workspace/server/dependency";

export function checkUps() {

    setTimeout(async () => {
        const currTime = new Date().getTime();
        const expired = await repository.client.reservedItem.findMany({
            where: {
                ttl: {
                    gte: currTime
                }
            }
        })

        if (expired.length <= 0) {
            checkUps()
            return
        }

        const [resolved] = await Promise.all([expired.forEach(async (idx) => {
            service.handleExpiredItem(idx.id)
        })])

        checkUps()
        return;
    }, 15000)
}
