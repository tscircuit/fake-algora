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

type PaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "created_at" | "updated_at"
>

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
  sendPayment: (
    paymentInput: PaymentInput,
  ): { payment: Payment; created: boolean } => {
    const existingPayment = paymentInput.idempotency_key
      ? get().payments.find(
          (payment) => payment.idempotency_key === paymentInput.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, created: false }
    }

    const now = new Date().toISOString()
    const payment: Payment = {
      ...paymentInput,
      payment_id: `payment_${get().paymentIdCounter}`,
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return { payment, created: true }
  },
  updatePaymentStatus: (
    payment_id: string,
    status: PaymentStatus,
  ): Payment | undefined => {
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === payment_id,
    )

    if (!existingPayment) {
      return undefined
    }

    const updatedPayment = {
      ...existingPayment,
      status,
      updated_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.payment_id === payment_id ? updatedPayment : payment,
      ),
    }))

    return updatedPayment
  },
}))
