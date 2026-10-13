import { Prisma } from "@workspace/db/generated/prisma/client";
import { Repository } from "@workspace/server/repository";
import { Cache } from "@workspace/server/cache";
import type { Item, ReservedItem } from "@workspace/db/generated/prisma/client";


export class Service {
    private readonly repo: Repository;
    private readonly cache: Cache;

    constructor(respository: Repository, cache: Cache) {
        this.repo = respository;
        this.cache = cache;
    }

    public async addToCart(customerId: string, itemId: string, count: number) {

        const isAdded = this.runTransaction(async (tx: Prisma.TransactionClient) => {
            const date = new Date().getTime() + 15 * 60 * 10000
            let flag = false;
            let reservedItem: ReservedItem
            let [cartExist, items] = await Promise.all([
                this.repo.getCustomerCart(tx, customerId),
                this.repo.isItemAvailable<Item[]>(tx, itemId, count)
            ])

            if (items.length <= 0) {
                throw Error("Item not available")
            }

            if (!cartExist) {
                cartExist = await this.repo.createCart(tx, customerId) as any;
            }

            if (cartExist && !cartExist.reservedItems) {
                await Promise.all([
                    reservedItem = await this.repo.createReservation(tx, itemId, cartExist.id, count, date),
                    await this.repo.updateInventoryItem(tx, itemId, count)
                ])
            }
            else if (cartExist && cartExist.reservedItems && cartExist.reservedItems.length > 0) {
                for (const item of cartExist.reservedItems) {
                    if (item.id === itemId) {
                        flag = true;
                        break;
                    }
                }
            }

            if (!flag) {
                await Promise.all([
                    reservedItem = await this.repo.createReservation(tx, itemId, cartExist!.id, count, date),
                    await this.repo.updateInventoryItem<Item>(tx, itemId, count)
                ])

                return true;
            }

            await Promise.all([
                reservedItem = await this.repo.updateReserveItem<ReservedItem>(tx, itemId, cartExist!.id, count),
                await this.repo.updateInventoryItem<Item>(tx, itemId, count)
            ])

            this.cache.addCache(reservedItem.itemId, date);

            return true;
        })

        return isAdded;
    }

    public async handleExpiredItem(reservedItemId: string) {
        const isHandled = await this.runTransaction(async (tx: Prisma.TransactionClient) => {
            const deleted = await this.repo.removeReservedItem(tx, reservedItemId);

            if (!deleted) {
                throw Error("Unable to delete reserved item")
            }

            const restore = await this.repo.restoreStock(tx, deleted.itemId, deleted.count);

            if (!restore) {
                throw Error("Unable to update inventory")
            }

            return true;
        })

        return isHandled;
    }

    private async runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        return await this.repo.client.$transaction(fn, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000
        })
    }
}
