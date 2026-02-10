import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"

import { combine } from "zustand/middleware"
import {
  type DatabaseSchema,
  type Payment,
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

  createPayment: (
    payment: Omit<Payment, "payment_id" | "created_at" | "status">,
  ) => {
    const newPayment: Payment = {
      ...payment,
      payment_id: `pay_${get().idCounter}`,
      status: "pending",
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      payments: [...state.payments, newPayment],
      idCounter: state.idCounter + 1,
    }))
    return newPayment
  },

  completePayment: (payment_id: string) => {
    set((state) => ({
      payments: state.payments.map((p) =>
        p.payment_id === payment_id
          ? {
              ...p,
              status: "completed" as const,
              completed_at: new Date().toISOString(),
            }
          : p,
      ),
    }))
  },

  getPayment: (payment_id: string) => {
    return get().payments.find((p) => p.payment_id === payment_id)
  },

  listPayments: (filters?: {
    recipient?: string
    status?: Payment["status"]
  }) => {
    let payments = get().payments

    if (filters?.recipient) {
      payments = payments.filter((p) => p.recipient === filters.recipient)
    }

    if (filters?.status) {
      payments = payments.filter((p) => p.status === filters.status)
    }

    return payments
  },
}))
