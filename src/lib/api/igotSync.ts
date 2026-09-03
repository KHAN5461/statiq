/**
 * StatIQ & iGOT Karmayogi Bi-Directional Synchronization Service
 * Maps FRAC competencies to iGOT courses and manages bi-directional telemetry.
 */

export const COURSE_MAPPING_REGISTRY: Record<string, string> = {
  // Mapping of exact MoSPI Competency Axes
  'Sampling': 'igot-mospi-sam-402',
  'Accounts': 'igot-mospi-acc-101',
  'Indices': 'igot-mospi-ind-305',
  'Python/R': 'igot-mospi-py-202',
  'GIS': 'igot-mospi-gis-501',
  'Governance': 'igot-mospi-gov-108',
  'Quality': 'igot-mospi-qua-204',
  'Field Ops': 'igot-mospi-fld-102',

  // Mapping of exact failed topic tags
  'Neyman Allocation': 'igot-mospi-sam-402',
  'Stratified Random Sampling': 'igot-mospi-fld-102',
  'National Accounts Computation': 'igot-mospi-acc-101',
  'Python Data Pandas': 'igot-mospi-py-202',
  'DPDP Act 2023 Compliance': 'igot-mospi-gov-108',
  'Data Quality Audits': 'igot-mospi-qua-204'
};

export const IGOT_BASE_URL = 'https://igotkarmayogi.gov.in/app/toc/';
export const DEFAULT_COURSE_ID = 'igot-mospi-general-100';

/**
 * Generates a direct iGOT Karmayogi deep-link for a given topic or competency axis.
 * Uses safe search fallback queries to prevent 404 errors during demos.
 * @param topicOrAxis The statistical subject, topic, or competency axis
 * @returns The absolute URL to the course search on iGOT
 */
export function generateiGOTDeepLink(topicOrAxis: string): string {
  const searchQuery = encodeURIComponent(`MoSPI ${topicOrAxis}`);
  return `https://igotkarmayogi.gov.in/app/search?q=${searchQuery}&source=statiq_mospi`;
}

/**
 * Calculates skill delta and generates remedial deep links for a set of results.
 * Delta = Max(0, Baseline_Target - Evaluated_Score)
 */
export interface CompetencyResult {
  topic: string;
  evaluatedScore: number;
  baselineTarget: number;
}

export interface iGOTRecommendation {
  topic: string;
  delta: number;
  courseUrl: string;
}

export function generateiGOTDeepLinks(competencyResults: CompetencyResult[]): iGOTRecommendation[] {
  return competencyResults
    .map(result => {
      const delta = Math.max(0, result.baselineTarget - result.evaluatedScore);
      if (delta > 0) {
        return {
          topic: result.topic,
          delta: parseFloat(delta.toFixed(2)),
          courseUrl: generateiGOTDeepLink(result.topic)
        };
      }
      return null;
    })
    .filter((item): item is iGOTRecommendation => item !== null);
}

/**
 * Sends outbound telemetry data representing a completed assessment to the backend
 * which in turn proxies/syncs to iGOT Karmayogi.
 */
export interface TelemetryScore {
  axis: string;
  evaluated_score: number;
  target_baseline: number;
  delta: number;
}

export async function sendAssessmentTelemetry(
  userId: string,
  assessmentId: string,
  scores: TelemetryScore[]
): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/igot/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_parichay_id: userId,
        assessment_id: assessmentId,
        scores,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Outbound sync failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Outbound telemetry sync response:', data);
    return true;
  } catch (error) {
    console.error('Failed to send assessment telemetry to iGOT:', error);
    return false;
  }
}
