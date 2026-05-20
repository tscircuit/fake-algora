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

type NewPayment = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
> & {
  status?: PaymentStatus
}

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
  addPayment: (paymentInput: NewPayment) => {
    const now = new Date().toISOString()
    const payment: Payment = {
      ...paymentInput,
      payment_id: `pay_${get().paymentIdCounter}`,
      status: paymentInput.status ?? "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  findPaymentById: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  findPaymentByIdempotencyKey: (idempotencyKey: string) => {
    return get().payments.find(
      (payment) => payment.idempotency_key === idempotencyKey,
    )
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === paymentId,
    )
    if (!existingPayment) return null

    const updatedPayment = {
      ...existingPayment,
      status,
      updated_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === paymentId ? updatedPayment : payment,
      ),
    }))

    return updatedPayment
  },
}))
