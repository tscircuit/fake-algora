import { createStore, type StoreApi } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"
import { hoist, type HoistedStoreApi } from "zustand-hoist"

import {
  databaseSchema,
  type DatabaseSchema,
  type Payment,
  type PaymentStatus,
  type Thing,
} from "./schema.ts"
import { combine } from "zustand/middleware"

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
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at" | "metadata"
    > & {
      metadata?: Record<string, string>
    },
  ) => {
    const now = new Date().toISOString()
    set((state) => ({
      payments: [
        ...state.payments,
        {
          ...payment,
          payment_id: state.idCounter.toString(),
          status: "pending",
          metadata: payment.metadata ?? {},
          created_at: now,
          updated_at: now,
        },
      ],
      idCounter: state.idCounter + 1,
    }))
  },
  findPaymentById: (payment_id: string) => {
    return get().payments.find((p) => p.payment_id === payment_id)
  },
  findPaymentByIdempotencyKey: (idempotency_key: string) => {
    return get().payments.find((p) => p.idempotency_key === idempotency_key)
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    const now = new Date().toISOString()
    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === payment_id
          ? { ...payment, status, updated_at: now }
          : payment,
      ),
    }))
  },
}))
