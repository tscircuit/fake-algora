import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"
import { type Payment, type Thing, databaseSchema } from "./schema.ts"

type CreatePaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at" | "completed_at"
>

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

const initializer = combine(databaseSchema.parse({}), (set) => ({
  addThing: (thing: Omit<Thing, "thing_id">) => {
    set((state) => ({
      things: [
        ...state.things,
        { ...thing, thing_id: state.idCounter.toString() },
      ],
      idCounter: state.idCounter + 1,
    }))
  },
  sendPayment: (input: CreatePaymentInput) => {
    let payment: Payment | undefined

    set((state) => {
      if (input.idempotency_key) {
        const existingPayment = state.payments.find(
          (item) => item.idempotency_key === input.idempotency_key,
        )

        if (existingPayment) {
          payment = existingPayment
          return {}
        }
      }

      const now = new Date().toISOString()
      payment = {
        ...input,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, payment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    return payment!
  },
  completePayment: (paymentId: string) => {
    let payment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => {
      const payments = state.payments.map((item) => {
        if (item.payment_id !== paymentId) return item

        payment = {
          ...item,
          status: "completed",
          completed_at: item.completed_at ?? now,
          updated_at: now,
        }
        return payment
      })

      if (!payment) return {}

      return { payments }
    })

    return payment
  },
}))
