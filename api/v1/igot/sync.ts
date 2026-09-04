import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../src/lib/firebase";

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
    const { user_parichay_id, assessment_id, scores, timestamp } = req.body || {};
    
    if (!user_parichay_id || !scores) {
      return res.status(400).json({ error: "Missing user_parichay_id or scores", success: false });
    }

    console.log(`[iGOT Outbound Sync] Syncing telemetry for officer ${user_parichay_id} on assessment ${assessment_id}`);

    // Call upstream iGOT Telemetry API if configured, otherwise fallback to mock registration
    const iGOT_API_URL = "https://api.igotkarmayogi.gov.in/v1/telemetry/frac/update";
    const apiKey = process.env.IGOT_TELEMETRY_API_KEY || "STATIQ_SERVICE_TOKEN";
    
    let upstreamSuccess = false;
    try {
      const response = await fetch(iGOT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_parichay_id,
          assessment_id,
          scores,
          timestamp
        })
      });
      upstreamSuccess = response.ok;
      console.log(`[iGOT Outbound Sync] Upstream status code: ${response.status}`);
    } catch (fetchError) {
      console.warn("[iGOT Outbound Sync] Upstream iGOT API unreachable. Running in offline fallback mode:", fetchError);
    }

    // Always record local sync record in Firestore to ensure durability
    try {
      await addDoc(collection(db, "telemetry_logs"), {
        user_parichay_id,
        assessment_id,
        scores,
        clientTimestamp: timestamp || new Date().toISOString(),
        syncedToiGOT: upstreamSuccess,
        createdAt: serverTimestamp()
      });
    } catch (fsError) {
      console.error("[iGOT Outbound Sync] Failed to log telemetry in Firestore:", fsError);
    }

    return res.status(200).json({
      status: "success",
      message: "Telemetry synchronized successfully",
      syncedToiGOT: upstreamSuccess
    });
  } catch (error: any) {
    console.error("Telemetry sync failed", error);
    return res.status(500).json({ error: error.message || "Telemetry sync failed", success: false });
  }
}
