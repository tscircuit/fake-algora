import { createStore, type StoreApi } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"
import { hoist, type HoistedStoreApi } from "zustand-hoist"

import { databaseSchema, type DatabaseSchema, type Thing, type Payment } from "./schema.ts"
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
    const now = new Date().toISOString()
    set((state) => ({
      payments: [
        ...state.payments,
        {
          ...payment,
          payment_id: `pay_${state.idCounter}`,
          created_at: now,
        },
      ],
      idCounter: state.idCounter + 1,
    }))
  },
}))
