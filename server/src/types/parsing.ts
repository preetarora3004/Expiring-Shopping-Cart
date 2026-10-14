import z from "zod"

export class TypeCheck {

    private cartInputChecking: z.ZodObject<{ itemId: z.ZodString; customerId: z.ZodString; count: z.ZodNumber; }, z.core.$strip> = z.object({
        itemId: z.string(),
        customerId: z.string(),
        count: z.number()
    })


    public cart(data: { itemId?: string, customerId?: string, count?: number }) {
        const parsed = this.cartInputChecking.safeParse(data)

        return parsed.success ? { success: parsed.success, data: parsed.data } : { success: parsed.success, error: parsed.error }
    }
}
