import { type HoistedStoreApi, hoist } from "zustand-hoist"
import { combine } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { type StoreApi, createStore } from "zustand/vanilla"
import {
  type Payment,
  type PaymentStatus,
  type Thing,
  databaseSchema,
} from "./schema.ts"

type CreatePaymentInput = Omit<
  Payment,
  | "payment_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "canceled_at"
  | "failed_at"
  | "cancel_reason"
  | "failure_reason"
>

type PaymentFilters = {
  recipient?: string
  status?: PaymentStatus
  owner?: string
  repo?: string
  repository?: string
  bounty_id?: string
  issue_number?: number
}

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
  sendPayment: (input: CreatePaymentInput) => {
    if (input.idempotency_key) {
      const existingPayment = get().payments.find(
        (item) => item.idempotency_key === input.idempotency_key,
      )

      if (existingPayment) return existingPayment
    }

    const now = new Date().toISOString()
    const payment: Payment = {
      ...input,
      payment_id: get().paymentIdCounter.toString(),
      status: "pending",
      created_at: now,
      updated_at: now,
    }

    set((state) => ({
      payments: [...state.payments, payment],
      paymentIdCounter: state.paymentIdCounter + 1,
    }))

    return payment
  },
  listPayments: (filters: PaymentFilters = {}) => {
    return get().payments.filter((payment) => {
      if (filters.recipient && payment.recipient !== filters.recipient) {
        return false
      }
      if (filters.status && payment.status !== filters.status) {
        return false
      }
      if (filters.owner && payment.owner !== filters.owner) {
        return false
      }
      if (filters.repo && payment.repo !== filters.repo) {
        return false
      }
      if (filters.repository && payment.repository !== filters.repository) {
        return false
      }
      if (filters.bounty_id && payment.bounty_id !== filters.bounty_id) {
        return false
      }
      if (
        filters.issue_number !== undefined &&
        payment.issue_number !== filters.issue_number
      ) {
        return false
      }
      return true
    })
  },
  getPayment: (paymentId: string) => {
    return get().payments.find((payment) => payment.payment_id === paymentId)
  },
  completePayment: (paymentId: string) => {
    return get().updatePaymentStatus(paymentId, "completed")
  },
  cancelPayment: (paymentId: string, cancelReason?: string) => {
    return get().updatePaymentStatus(paymentId, "canceled", {
      cancel_reason: cancelReason,
    })
  },
  failPayment: (paymentId: string, failureReason?: string) => {
    return get().updatePaymentStatus(paymentId, "failed", {
      failure_reason: failureReason,
    })
  },
  updatePaymentStatus: (
    paymentId: string,
    status: Exclude<PaymentStatus, "pending">,
    options: { cancel_reason?: string; failure_reason?: string } = {},
  ) => {
    const existingPayment = get().payments.find(
      (payment) => payment.payment_id === paymentId,
    )

    if (!existingPayment) return undefined

    const now = new Date().toISOString()
    const payment: Payment = {
      ...existingPayment,
      status,
      updated_at: now,
      completed_at: status === "completed" ? now : existingPayment.completed_at,
      canceled_at: status === "canceled" ? now : existingPayment.canceled_at,
      failed_at: status === "failed" ? now : existingPayment.failed_at,
      cancel_reason:
        status === "canceled"
          ? options.cancel_reason
          : existingPayment.cancel_reason,
      failure_reason:
        status === "failed"
          ? options.failure_reason
          : existingPayment.failure_reason,
    }

    set((state) => ({
      payments: state.payments.map((item) =>
        item.payment_id === paymentId ? payment : item,
      ),
    }))

    return payment
  },
}))
