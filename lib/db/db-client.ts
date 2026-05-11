import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type DatabaseSchema,
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

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
  createPayment: (
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    let createdPayment: Payment
    set((state) => {
      const now = new Date().toISOString()
      createdPayment = {
        ...payment,
        payment_id: `payment_${state.idCounter}`,
        status: "pending",
        created_at: now,
        updated_at: now,
      }
      return {
        payments: [...state.payments, createdPayment],
        idCounter: state.idCounter + 1,
      }
    })
    return createdPayment!
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    set((state) => {
      const now = new Date().toISOString()
      return {
        payments: state.payments.map((payment) => {
          if (payment.payment_id !== paymentId) return payment
          updatedPayment = {
            ...payment,
            status,
            updated_at: now,
          }
          return updatedPayment
        }),
      }
    })
    return updatedPayment
  },
}))
