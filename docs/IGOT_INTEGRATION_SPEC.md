# StatIQ & iGOT Karmayogi DPI Integration Specification

## 1. Authentication & Single Sign-On (SSO) Flow

StatIQ integrates with the **Parichay / MeriPehchan** OIDC (OpenID Connect) Identity Provider (IdP) to ensure seamless and secure access for MoSPI officers.

**OAuth2 / OIDC Authorization Code Flow:**
1. **Initiation**: The unauthenticated officer clicks "Login with Parichay" on StatIQ.
2. **Authorization Request**: StatIQ redirects the user to the Parichay authorization endpoint:
   `GET https://parichay.nic.in/oauth2/auth?response_type=code&client_id=STATIQ_CLIENT_ID&redirect_uri=https://statiq.mospi.gov.in/auth/callback&scope=openid profile email frac_id`
3. **Authentication**: The officer logs into Parichay using their government credentials and consents to share their FRAC profile.
4. **Token Exchange**: Parichay redirects back to StatIQ with a temporary authorization code. StatIQ's backend securely exchanges this code at the Parichay token endpoint for an `access_token` and `id_token`.
5. **Session Establishment**: StatIQ validates the JWT `id_token`, extracts the `user_parichay_id`, queries the internal StatIQ Firestore database to load the officer's baseline competency profile, and establishes a secure local session.

---

## 2. iGOT Course Completion Webhook Payload (JSON)

When an officer completes a remedial course on the iGOT platform, iGOT fires a webhook to StatIQ. The payload adheres to the following structure:

```json
{
  "event_id": "evt_847291054",
  "event_type": "course.completion",
  "user_parichay_id": "mospi_off_8892",
  "course_id": "igot-mospi-sam-402",
  "course_name": "Advanced Sampling Techniques: Neyman Allocation",
  "completion_status": "COMPLETED",
  "score_percentage": 92.5,
  "frac_competencies_awarded": [
    {
      "axis": "Sampling",
      "level_awarded": 4.0,
      "competency_id": "FRAC-COMP-SAM-04"
    }
  ],
  "timestamp": "2026-09-02T10:15:00Z",
  "signature": "sha256=d9f4c3...a8b9c0"
}
```

---

## 3. Bi-Directional Competency Sync API (FastAPI)

```python
from fastapi import FastAPI, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict
import httpx
import hmac
import hashlib

app = FastAPI()

# --- Outbound Sync Models ---
class CompetencyScore(BaseModel):
    axis: str
    evaluated_score: float
    target_baseline: float
    delta: float = Field(..., description="Max(0, Target - Evaluated)")

class OutboundTelemetryPayload(BaseModel):
    user_parichay_id: str
    assessment_id: str
    scores: List[CompetencyScore]
    timestamp: str

# --- Inbound Webhook Models ---
class FRACAward(BaseModel):
    axis: str
    level_awarded: float
    competency_id: str

class InboundWebhookPayload(BaseModel):
    event_id: str
    event_type: str
    user_parichay_id: str
    course_id: str
    completion_status: str
    frac_competencies_awarded: List[FRACAward]
    timestamp: str

# --- Endpoint: Outbound Sync (StatIQ -> iGOT) ---
@app.post("/api/v1/igot/sync")
async def sync_competency_to_igot(payload: OutboundTelemetryPayload):
    """
    Fired post-assessment to update iGOT's central FRAC repository 
    with the latest evaluated competency scores and calculated deltas.
    """
    IGOT_TELEMETRY_URL = "https://api.igotkarmayogi.gov.in/v1/telemetry/frac/update"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            IGOT_TELEMETRY_URL, 
            json=payload.model_dump(),
            headers={"Authorization": "Bearer STATIQ_SERVICE_TOKEN"}
        )
        
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="Upstream iGOT Sync Failed")
            
    return {"status": "success", "message": "Telemetry synced to iGOT FRAC engine"}


# --- Endpoint: Inbound Webhook (iGOT -> StatIQ) ---
@app.post("/api/v1/igot/webhook/course-completion")
async def igot_course_completion_webhook(payload: InboundWebhookPayload, request: Request):
    """
    Listens for iGOT course completions. Recalculates the StatIQ FRAC Radar baseline.
    """
    # 1. Validate Webhook Signature (Security)
    signature = request.headers.get("X-iGOT-Signature")
    raw_body = await request.body()
    expected_sig = hmac.new(b"STATIQ_WEBHOOK_SECRET", raw_body, hashlib.sha256).hexdigest()
    
    if not signature or not hmac.compare_digest(f"sha256={expected_sig}", signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # 2. Process Data (Conceptual DB Update)
    if payload.completion_status == "COMPLETED":
        for award in payload.frac_competencies_awarded:
            # e.g., db.collection('users').doc(payload.user_parichay_id).update(...)
            print(f"Updating {payload.user_parichay_id} baseline for {award.axis} to {award.level_awarded}")

    return {"status": "acknowledged", "event_id": payload.event_id}
```

---

## 4. Remedial Deep-Linking Engine (JavaScript Utility)

This utility calculates the skill delta and securely routes learners directly to the targeted iGOT course based on the tags they failed during the diagnostic assessment.

```javascript
/**
 * Maps FRAC / Assessment topic tags to their corresponding iGOT course IDs.
 */
const COURSE_MAPPING_REGISTRY = {
  'Neyman Allocation': 'igot-mospi-sam-402',
  'Stratified Random Sampling': 'igot-mospi-sam-105',
  'National Accounts Computation': 'igot-mospi-acc-301',
  'Python Data Pandas': 'igot-tech-py-201',
  'DPDP Act 2023 Compliance': 'igot-gov-dpdp-001',
  'Data Quality Audits': 'igot-mospi-qlt-500'
};

const IGOT_BASE_URL = 'https://igotkarmayogi.gov.in/app/toc/';
const DEFAULT_COURSE_ID = 'igot-mospi-general-100'; // Fallback onboarding course

/**
 * Calculates competency delta and generates remedial deep links.
 * 
 * @param {Array<{topic: string, evaluatedScore: number, baselineTarget: number}>} competencyResults
 * @returns {Array<{topic: string, delta: number, courseUrl: string}>}
 */
export function generateiGOTDeepLinks(competencyResults) {
  return competencyResults
    .map(result => {
      // 1. Calculate Skill Delta: Max(0, Baseline_Target - Evaluated_Score)
      const delta = Math.max(0, result.baselineTarget - result.evaluatedScore);
      
      // 2. Only return links if there is a skill gap (Delta > 0)
      if (delta > 0) {
        const courseId = COURSE_MAPPING_REGISTRY[result.topic] || DEFAULT_COURSE_ID;
        return {
          topic: result.topic,
          delta: Number(delta.toFixed(2)),
          courseUrl: \`\${IGOT_BASE_URL}\${courseId}\`
        };
      }
      return null;
    })
    .filter(Boolean); // Filter out nulls (competencies that met the baseline)
}

// Example Usage:
// const results = [
//   { topic: 'Neyman Allocation', evaluatedScore: 2, baselineTarget: 4 },
//   { topic: 'DPDP Act 2023 Compliance', evaluatedScore: 5, baselineTarget: 5 }
// ];
// console.log(generateiGOTDeepLinks(results)); 
// Output: [ { topic: 'Neyman Allocation', delta: 2, courseUrl: 'https://igotkarmayogi.gov.in/app/toc/igot-mospi-sam-402' } ]
```
