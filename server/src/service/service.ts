import { Prisma } from "@workspace/db/generated/prisma/client";
import { Repository } from "@workspace/server/repository";
import { Cache } from "@workspace/server/cache";
import type { Item, ReservedItem } from "@workspace/db/generated/prisma/client";
import type { TypeCheck } from "@workspace/server/parsing";


export class Service {
    private readonly repo: Repository;
    private readonly cache: Cache;
    private readonly typeCheck: TypeCheck;

    constructor(respository: Repository, cache: Cache, tc: TypeCheck) {
        this.repo = respository;
        this.cache = cache;
        this.typeCheck = tc;
    }

    public async addToCart(data: { customerId: string, itemId: string, count: number }) {

        const parsed = this.typeCheck.cart(data)

        if (!parsed.success) {
            throw Error("Invalid Input")
        }

        const isAdded = this.runTransaction(async (tx: Prisma.TransactionClient) => {
            const date = new Date().getTime() + 15 * 60 * 1000
            let flag = false;
            let reservedItem: ReservedItem
            let [cartExist, items] = await Promise.all([
                this.repo.getCustomerCart(tx, data.customerId),
                this.repo.isItemAvailable<Item[]>(tx, data.itemId, data.count)
            ])

            if (items.length <= 0) {
                throw Error("Item not available")
            }

            if (!cartExist) {
                cartExist = await this.repo.createCart(tx, data.customerId) as any;
            }

            if (cartExist && !cartExist.reservedItems) {
                await Promise.all([
                    reservedItem = await this.repo.createReservation(tx, data.itemId, cartExist.id, data.count, date),
                    await this.repo.updateInventoryItem(tx, data.itemId, data.count)
                ])
            }
            else if (cartExist && cartExist.reservedItems && cartExist.reservedItems.length > 0) {
                for (const item of cartExist.reservedItems) {
                    if (item.id === data.itemId) {
                        flag = true;
                        break;
                    }
                }
            }

            if (!flag) {
                await Promise.all([
                    reservedItem = await this.repo.createReservation(tx, data.itemId, cartExist!.id, data.count, date),
                    await this.repo.updateInventoryItem<Item>(tx, data.itemId, data.count)
                ])

                return true;
            }

            await Promise.all([
                reservedItem = await this.repo.updateReserveItem<ReservedItem>(tx, data.itemId, cartExist!.id, data.count),
                await this.repo.updateInventoryItem<Item>(tx, data.itemId, data.count)
            ])

            this.cache.addCache(reservedItem.id, date);

            return true;
        })

        return isAdded;
    }

    public async handleExpiredItem(reservedItemId: string) {
        const isHandled = await this.runTransaction(async (tx: Prisma.TransactionClient) => {
            const deleted = await this.repo.removeReservedItem(tx, reservedItemId);
            this.cache.cleanUp(reservedItemId);

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
