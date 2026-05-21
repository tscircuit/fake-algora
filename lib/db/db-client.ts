import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

const initializer = combine(databaseSchema.parse({}), (set, get) => ({
  addThing: (thing: Omit<Thing, "thing_id">) => {
    set((state) => ({
      things: [
        ...state.things,
        { ...thing, thing_id: state.idCounter.toString() },
      ],
      idCounter: state.idCounter + 1,
    }))
  },
  addPayment: (
    payment: Omit<Payment, "payment_id" | "created_at" | "updated_at">,
  ) => {
    const now = new Date().toISOString()
    let createdPayment: Payment | undefined

    set((state) => {
      const payment_id = `pay_${state.idCounter}`
      const nextPayment: Payment = {
        ...payment,
        payment_id,
        created_at: now,
        updated_at: now,
      }
      createdPayment = nextPayment

      return {
        payments: [...state.payments, nextPayment],
        idCounter: state.idCounter + 1,
      }
    })

    return createdPayment as Payment
  },
  getPayment: (payment_id: string) =>
    get().payments.find((payment) => payment.payment_id === payment_id),
  getPaymentByIdempotencyKey: (idempotency_key: string) =>
    get().payments.find(
      (payment) => payment.idempotency_key === idempotency_key,
    ),
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    const now = new Date().toISOString()

    set((state) => {
      const payments = state.payments.map((payment) => {
        if (payment.payment_id !== payment_id) {
          return payment
        }

        const nextPayment: Payment = {
          ...payment,
          status,
          updated_at: now,
        }
        updatedPayment = nextPayment
        return nextPayment
      })

      return { payments }
    })

    return updatedPayment
  },
}))
