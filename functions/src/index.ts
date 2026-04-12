import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateAndSendInvoice } from "./invoicing";

admin.initializeApp();

/**
 * Cloud Function to create an electronic invoice for Costa Rica (Hacienda v4.3)
 * This function should be called after a successful payment/subscription update.
 */
export const createElectronicInvoice = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }

  const { userId, planId, amount, currency } = data;

  try {
    const result = await generateAndSendInvoice(userId, { planId, amount, currency });
    return result;
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    throw new functions.https.HttpsError("internal", error.message || "Error al generar la factura.");
  }
});
