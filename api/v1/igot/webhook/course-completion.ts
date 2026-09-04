import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from "crypto";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../src/lib/firebase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }

  try {
    const signature = req.headers["x-igot-signature"];
    const payload = req.body;

    if (!payload || !payload.user_parichay_id || !payload.frac_competencies_awarded) {
      return res.status(400).json({ error: "Invalid iGOT Webhook payload structure", success: false });
    }

    // Verify HMAC-SHA256 signature if configured
    const webhookSecret = process.env.IGOT_WEBHOOK_SECRET || "STATIQ_WEBHOOK_SECRET";
    if (signature) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
      
      const providedSig = typeof signature === "string" ? signature.replace(/^sha256=/, "") : "";
      
      try {
        if (!crypto.timingSafeEqual(Buffer.from(providedSig, "utf8"), Buffer.from(expectedSig, "utf8"))) {
          return res.status(401).json({ error: "Invalid iGOT signature validation failed", success: false });
        }
      } catch (cryptoErr) {
        return res.status(401).json({ error: "Signature comparison mismatch length", success: false });
      }
    } else {
      console.warn("[iGOT Webhook] Warning: Skipping webhook signature verification since header is missing.");
    }

    const { user_parichay_id, course_id, frac_competencies_awarded } = payload;
    console.log(`[iGOT Inbound Webhook] Received course-completion webhook for officer ${user_parichay_id}, course ${course_id}`);

    // Update user's baseline in Firestore
    try {
      const usersRef = collection(db, "users");
      const userDocRef = doc(db, "users", user_parichay_id);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          lastCompletedCourse: course_id,
          lastCompetencyAwardedAt: serverTimestamp(),
          igotAwards: frac_competencies_awarded
        });
        console.log(`[iGOT Webhook] Successfully updated profile for user ${user_parichay_id}`);
      } else {
        const q = query(usersRef, where("email", "==", user_parichay_id));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const userDoc = qSnap.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), {
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: serverTimestamp(),
            igotAwards: frac_competencies_awarded
          });
          console.log(`[iGOT Webhook] Successfully updated profile for user email ${user_parichay_id}`);
        } else {
          await setDoc(doc(db, "users", user_parichay_id), {
            uid: user_parichay_id,
            role: "learner",
            lastCompletedCourse: course_id,
            lastCompetencyAwardedAt: serverTimestamp(),
            igotAwards: frac_competencies_awarded
          }, { merge: true });
          console.log(`[iGOT Webhook] Registered new/fallback profile for user ${user_parichay_id}`);
        }
      }

      await addDoc(collection(db, "igot_webhook_logs"), {
        payload,
        processedAt: serverTimestamp(),
        success: true
      });

    } catch (dbError: any) {
      console.error("[iGOT Webhook] Failed to process database update:", dbError);
      return res.status(500).json({ error: "Database sync failed during webhook execution: " + dbError.message, success: false });
    }

    return res.status(200).json({
      status: "acknowledged",
      message: "iGOT course completion successfully processed and competency baselines updated."
    });

  } catch (error: any) {
    console.error("Webhook handler execution failed", error);
    return res.status(500).json({ error: error.message || "Webhook handler execution failed", success: false });
  }
}
