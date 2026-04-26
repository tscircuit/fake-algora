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
    payment: Omit<Payment, "payment_id" | "created_at" | "status">,
  ) => {
    const state = get()
    const newPayment: Payment = {
      ...payment,
      payment_id: `pay_${state.idCounter}`,
      status: "pending",
      created_at: new Date().toISOString(),
    }
    set((s) => ({
      payments: [...s.payments, newPayment],
      idCounter: s.idCounter + 1,
    }))
    return newPayment
  },
  getPayment: (payment_id: string): Payment | undefined => {
    return get().payments.find((p) => p.payment_id === payment_id)
  },
  listPayments: (filters?: {
    recipient?: string
    status?: "pending" | "completed" | "failed"
  }): Payment[] => {
    let payments = get().payments
    if (filters?.recipient) {
      payments = payments.filter((p) => p.recipient === filters.recipient)
    }
    if (filters?.status) {
      payments = payments.filter((p) => p.status === filters.status)
    }
    return payments
  },
  completePayment: (payment_id: string): boolean => {
    const state = get()
    const index = state.payments.findIndex((p) => p.payment_id === payment_id)
    if (index === -1) return false
    set((s) => ({
      payments: s.payments.map((p, i) =>
        i === index
          ? { ...p, status: "completed", completed_at: new Date().toISOString() }
          : p,
      ),
    }))
    return true
  },
  failPayment: (payment_id: string): boolean => {
    const state = get()
    const index = state.payments.findIndex((p) => p.payment_id === payment_id)
    if (index === -1) return false
    set((s) => ({
      payments: s.payments.map((p, i) =>
        i === index ? { ...p, status: "failed" } : p,
      ),
    }))
    return true
  },
}))