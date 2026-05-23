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

type SendPaymentInput = Pick<Payment, "recipient" | "amount"> &
  Partial<
    Pick<
      Payment,
      | "currency"
      | "bounty_id"
      | "issue_number"
      | "repository"
      | "idempotency_key"
    >
  >

type ListPaymentsFilters = Partial<
  Pick<Payment, "recipient" | "status" | "repository">
>

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
    const idempotentPayment =
      input.idempotency_key != null
        ? get().payments.find(
            (payment) => payment.idempotency_key === input.idempotency_key,
          )
        : undefined

    if (idempotentPayment) {
      return idempotentPayment
    }

    const now = new Date().toISOString()
    const payment: Payment = {
      payment_id: get().paymentIdCounter.toString(),
      recipient: input.recipient,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: "pending",
      bounty_id: input.bounty_id,
      issue_number: input.issue_number,
      repository: input.repository,
      idempotency_key: input.idempotency_key,
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  getPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  listPayments: (filters: ListPaymentsFilters = {}) => {
    return get().payments.filter((payment) => {
      if (filters.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters.status && payment.status !== filters.status) {
        return false
      }
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      return true
    })
  },
  updatePaymentStatus: (paymentId: string, status: PaymentStatus) => {
    const payment = get().payments.find(
      (candidate) => candidate.payment_id === paymentId,
    )

    if (!payment) {
      return undefined
    }

    if (payment.status !== "pending") {
      return payment
    }

    const updatedPayment = {
      ...payment,
      status,
      updated_at: new Date().toISOString(),
    }

    set((state) => ({
      payments: state.payments.map((candidate) =>
        candidate.payment_id === paymentId ? updatedPayment : candidate,
      ),
    }))

    return updatedPayment
  },
}))
