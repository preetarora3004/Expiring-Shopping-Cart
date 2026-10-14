import type { Service } from "@workspace/server/service"
import type { Request, Response } from "express"

export class Controller {
    private service: Service

    constructor(service: Service) {
        this.service = service
    }

    public async addToCart(req: Request, res: Response) {
        const { count } = req.body
        const customerId = req.params.customerId as string;
        const itemId = req.params.itemId as string;

        const added = await this.service.addToCart({ itemId: itemId, customerId: customerId, count: count })

        return res.status(201).json({
            success: added
        })
    }
}
