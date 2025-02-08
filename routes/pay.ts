import { withRouteSpec } from "lib/middleware/with-winter-spec";
import { z } from "zod";
import Stripe from "stripe";

// ✅ Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia", // Use the updated API version
  });
  
// ✅ Define API schema
export default withRouteSpec({
  methods: ["POST"],
  jsonRequest: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
    paymentMethodId: z.string(),
  }),
  jsonResponse: z.object({
    success: z.boolean(),
    paymentIntentId: z.string().optional(),
    message: z.string(),
  }),
})(
  async (req, ctx) => {
    try {
      // ✅ Fix: Parse JSON body properly
      const { amount, currency, paymentMethodId } = await req.json();

      // ✅ Convert amount to smallest unit (cents)
      const convertedAmount = amount * 100;

      // ✅ Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: convertedAmount,
        currency,
        payment_method: paymentMethodId,
        confirm: true,
      });

      // ✅ Return success response
      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          message: "Payment successful!",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error("Payment error:", error.message);

      // ✅ Stripe-specific error handling
      if (error.type === "StripeCardError") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Card was declined.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment failed. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
