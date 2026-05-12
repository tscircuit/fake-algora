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
  addPayment: (
    payment: Omit<
      Payment,
      | "payment_id"
      | "status"
      | "created_at"
      | "updated_at"
      | "completed_at"
      | "cancelled_at"
    >,
  ) => {
    let createdPayment: Payment | undefined

    set((state) => {
      const now = new Date().toISOString()
      createdPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    if (!createdPayment) {
      throw new Error("Payment was not created")
    }

    return createdPayment
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined

    set((state) => {
      const now = new Date().toISOString()

      return {
        payments: state.payments.map((payment) => {
          if (payment.payment_id !== payment_id) return payment

          updatedPayment = {
            ...payment,
            status,
            updated_at: now,
            ...(status === "completed" ? { completed_at: now } : {}),
            ...(status === "cancelled" ? { cancelled_at: now } : {}),
          }

          return updatedPayment
        }),
      }
    })

    return updatedPayment
  },
}))
