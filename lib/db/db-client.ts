import { createStore } from "zustand/vanilla"
import { hoist } from "zustand-hoist"

import { databaseSchema, type Payment, type Thing } from "./schema.ts"
import { combine } from "zustand/middleware"

export const createDatabase = () => {
  return hoist(createStore(initializer))
}

export type DbClient = ReturnType<typeof createDatabase>

type SendPaymentInput = Pick<Payment, "recipient" | "amount_usd"> &
  Partial<Pick<Payment, "memo" | "idempotency_key">>

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
  sendPayment: (input: SendPaymentInput) => {
    const currentState = get()
    const existingPayment = input.idempotency_key
      ? currentState.payments.find(
          (payment) => payment.idempotency_key === input.idempotency_key,
        )
      : undefined

    if (existingPayment) {
      return { payment: existingPayment, idempotent_replay: true }
    }

    const timestamp = new Date().toISOString()
    const payment: Payment = {
      payment_id: `pay_${currentState.paymentIdCounter}`,
      recipient: input.recipient,
      amount_usd: input.amount_usd,
      memo: input.memo,
      idempotency_key: input.idempotency_key,
      status: "sent",
      created_at: timestamp,
      sent_at: timestamp,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return { payment, idempotent_replay: false }
  },
}))
