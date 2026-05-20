import { createStore, type StoreApi } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"
import { hoist, type HoistedStoreApi } from "zustand-hoist"

import {
  databaseSchema,
  type DatabaseSchema,
  type Payment,
  type Thing,
} from "./schema.ts"
import { combine } from "zustand/middleware"

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
  addPayment: (payment: Omit<Payment, "payment_id" | "created_at">) => {
    let createdPayment: Payment | undefined

    set((state) => {
      createdPayment = {
        ...payment,
        payment_id: state.paymentCounter.toString(),
        created_at: new Date().toISOString(),
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentCounter: state.paymentCounter + 1,
      }
    })

    if (!createdPayment) {
      throw new Error("Payment was not created")
    }

    return createdPayment
  },
}))
