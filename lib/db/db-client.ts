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
    payment: Omit<
      Payment,
      "payment_id" | "status" | "created_at" | "updated_at"
    >,
  ) => {
    const now = new Date().toISOString()
    const matchingPayment = payment.idempotency_key
      ? get().payments.find(
          (existingPayment) =>
            existingPayment.idempotency_key === payment.idempotency_key,
        )
      : undefined

    if (matchingPayment) {
      return matchingPayment
    }

    let createdPayment!: Payment
    set((state) => {
      createdPayment = {
        ...payment,
        payment_id: state.paymentIdCounter.toString(),
        status: "pending",
        created_at: now,
        updated_at: now,
      }

      return {
        payments: [...state.payments, createdPayment],
        paymentIdCounter: state.paymentIdCounter + 1,
      }
    })

    return createdPayment
  },
  listPayments: (filters?: {
    recipient?: string
    status?: PaymentStatus
    repository?: string
    bounty_id?: string
    issue_number?: string
  }) => {
    return get().payments.filter((payment) => {
      if (filters?.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters?.status && payment.status !== filters.status) {
        return false
      }
      if (filters?.repository && payment.repository !== filters.repository) {
        return false
      }
      if (filters?.bounty_id && payment.bounty_id !== filters.bounty_id) {
        return false
      }
      if (
        filters?.issue_number &&
        payment.issue_number !== filters.issue_number
      ) {
        return false
      }
      return true
    })
  },
  getPayment: (payment_id: string) => {
    return get().payments.find((payment) => payment.payment_id === payment_id)
  },
  updatePaymentStatus: (payment_id: string, status: PaymentStatus) => {
    let updatedPayment: Payment | undefined
    set((state) => {
      const existingPayment = state.payments.find(
        (payment) => payment.payment_id === payment_id,
      )

      if (!existingPayment) {
        return state
      }

      if (existingPayment.status !== "pending") {
        updatedPayment = existingPayment
        return state
      }

      const now = new Date().toISOString()
      updatedPayment = {
        ...existingPayment,
        status,
        updated_at: now,
      }

      return {
        payments: state.payments.map((payment) =>
          payment.payment_id === payment_id ? updatedPayment! : payment,
        ),
      }
    })

    return updatedPayment
  },
}))
