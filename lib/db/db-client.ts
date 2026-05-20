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
  sendPayment: (payment: Omit<Payment, "payment_id" | "status">) => {
    let payment_id = ""
    set((state) => {
      payment_id = `payment_${state.idCounter}`
      return {
        payments: [
          ...state.payments,
          { ...payment, payment_id, status: "sent" as const },
        ],
        idCounter: state.idCounter + 1,
      }
    })
    return payment_id
  },
}))
