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

type SendPaymentInput = Omit<
  Payment,
  "payment_id" | "status" | "transfer_reference" | "created_at"
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
  sendPayment: (paymentInput: SendPaymentInput) => {
    if (paymentInput.idempotency_key) {
      const replayedPayment = get().payments.find(
        (payment) => payment.idempotency_key === paymentInput.idempotency_key,
      )

      if (replayedPayment) {
        return { payment: replayedPayment, replayed: true }
      }
    }

    const payment: Payment = {
      ...paymentInput,
      payment_id: `pay_${get().idCounter}`,
      status: "sent",
      transfer_reference: `fake_algora_${get().idCounter}`,
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: [...state.payments, payment],
      idCounter: state.idCounter + 1,
    }))

    return { payment, replayed: false }
  },
  listPayments: (filters?: {
    recipient?: string
    bounty_id?: string
  }) => {
    return get().payments.filter((payment) => {
      if (filters?.recipient && payment.recipient !== filters.recipient) {
        return false
      }

      if (filters?.bounty_id && payment.bounty_id !== filters.bounty_id) {
        return false
      }

      return true
    })
  },
}))
