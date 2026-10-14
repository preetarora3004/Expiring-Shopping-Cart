import { Prisma, PrismaClient } from "@workspace/db/generated/prisma/client"

export class Repository {
    public readonly client: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.client = prisma
    }

    public async createCart(tx: Prisma.TransactionClient, customerId: string) {
        return tx.cart.create({
            data: {
                customerId: customerId
            }
        })
    }

    public async updateReserveItem<T>(tx: Prisma.TransactionClient, itemId: string, cartId: string, count: number): Promise<T> {
        return tx.$queryRaw<T>`
            UPDATE "ReservedItem"
            SET count = ${count}
            WHERE itemId = ${itemId}
            AND cartId = ${cartId}
            RETURNING *;
        `
    }

    public async updateInventoryItem<T>(tx: Prisma.TransactionClient, itemId: string, count: number): Promise<T> {
        return tx.$queryRaw<T>`
            UPDATE "Item"
            SET count = count - ${count}
            WHERE id = ${itemId}
            RETURNING *;
        `
    }

    public async getCustomerCart(tx: Prisma.TransactionClient, customerId: string) {
        return tx.cart.findFirst({
            where: {
                customerId: customerId,
                isActive: true
            },
            include: {
                reservedItems: true
            }
        })
    }

    public async removeReservedItem(tx: Prisma.TransactionClient, reservedItemId: string) {
        return tx.reservedItem.delete({
            where: {
                id: reservedItemId
            }
        })
    }

    public async restoreStock(tx: Prisma.TransactionClient, itemId: string, count: number) {
        return tx.item.update({
            where: {
                id: itemId
            },
            data: {
                count: {
                    increment: count
                }
            }
        })
    }

    public async createReservation(tx: Prisma.TransactionClient, itemId: string, cartId: string, count: number, ttl: number) {
        return tx.reservedItem.create({
            data: {
                itemId: itemId,
                cartId: cartId,
                count: count,
                ttl: ttl
            }
        })
    }

    public async isItemAvailable<T>(tx: Prisma.TransactionClient, itemId: string, count: number): Promise<T> {

        const items = tx.$queryRaw<T>`
            SELECT count FROM "Item"
            WHERE id = ${itemId} 
            AND count >= ${count};
        `

        return items;
    }
}
