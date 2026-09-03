# Karmayogi StatIQ (SIH26101) - Functional Specification & API Schema

## 1. System Architecture & Workflow

### 1.1 Admin Workflow (Assessment Management & Creation)
* **Global Dashboard Filter**: Multi-select filtering by Cohorts (ISS Probationers, SSS-JSO 2026, Field Enumerators), Zones (Western, Northern, Central, Eastern, Southern, North-Eastern), and the 8 Competency Axes.
* **Assessment Creation**: 
  * "+ New Assessment" CTA leading to the Ingestion Engine.
  * **Ingestion Engine**: Accepts PDF/manual text inputs. Invokes Gemini 1.5 Flash using structured JSON outputs via Pydantic to enforce schema. 
  * **Trainer QA Preview**: Side-by-side view comparing AI-generated questions with raw source snippets for auditor validation.
* **Assessment Management**:
  * Cards display generated tests with a (⋮) menu: *Publish to Cohort/Zone*, *Edit Assessment*, *Schedule Deployment*, *Assessment Analytics*, *Delete*.
* **TPAC Workshop Engine**:
  * An automated cron/trigger process that evaluates aggregated cohort results.
  * Rule: If `Failure Rate > 40%` for a specific `Zone` on a `Competency Axis`, automatically draft a Training Program Approval Committee (TPAC) nomination memo targeting the NSSTA Greater Noida facility.

### 1.2 Learner Workflow (Execution & FRAC Skill Gap)
* **QuizRunner**:
  * **Ergonomics**: Keyboard-first execution (`1-4` or `A-D` for options, `Enter` to submit, `Arrow` keys for navigation).
  * **UI Components**: Sticky countdown timer, progress bar, and immediate diagnostic rationale drawer post-submission.
* **Mistake Re-Roll**:
  * Post-submission feature. Extracts failed `topic_tags`.
  * Triggers a fast 3-question targeted micro-drill on those exact failed concepts.
* **Competency Radar**:
  * Visualizes the learner's structural competency across the 8 MoSPI axes: *Sampling, Accounts, Indices, Python/R, GIS, Governance, Quality, Field Ops*.

---

## 2. API Schema (FastAPI / Pydantic)

These models strictly enforce the JSON structure returned by the Gemini 1.5 Flash AI Engine, preventing markdown glitches and ensuring deterministic parsing.

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class DifficultyLevel(str, Enum):
    L1 = "Recall (L1)"
    L2 = "Application (L2)"
    L3 = "Scenario (L3)"

class CompetencyAxis(str, Enum):
    SAMPLING = "Sampling"
    ACCOUNTS = "Accounts"
    INDICES = "Indices"
    PYTHON_R = "Python/R"
    GIS = "GIS"
    GOVERNANCE = "Governance"
    QUALITY = "Quality"
    FIELD_OPS = "Field Ops"

class QuestionModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the question")
    question_text: str
    options: List[str] = Field(..., min_length=4, max_length=4, description="Exactly 4 options")
    correct_option_index: int = Field(..., ge=0, le=3, description="0-based index of the correct answer")
    bloom_taxonomy_level: DifficultyLevel
    explanation: str = Field(..., description="Official justification referencing MoSPI methodology")
    topic_tag: str = Field(..., description="Specific sub-topic for Mistake Re-roll targeting")

class AssessmentGenerationRequest(BaseModel):
    source_text: str = Field(..., description="Raw text from MoSPI manuals/circulars")
    target_competency: CompetencyAxis
    difficulty_level: DifficultyLevel

class AssessmentGenerationResponse(BaseModel):
    assessment_title: str
    target_competency: CompetencyAxis
    difficulty_level: str
    questions: List[QuestionModel]

class TPACMemoDraft(BaseModel):
    cohort: str
    zone: str
    failed_competency: CompetencyAxis
    failure_rate: float = Field(..., ge=0.0, le=1.0)
    auto_drafted_memo: str
```

---

## 3. Frontend State Engine (TypeScript Interfaces)

These TypeScript interfaces map directly to the Next.js/React frontend state, aligning with the backend schemas.

```typescript
export type Cohort = 'ISS Probationers' | 'SSS-JSO 2026' | 'Field Enumerators' | 'All';
export type Zone = 'Western' | 'Northern' | 'Central' | 'Eastern' | 'Southern' | 'North-Eastern' | 'All';
export type CompetencyAxis = 'Sampling' | 'Accounts' | 'Indices' | 'Python/R' | 'GIS' | 'Governance' | 'Quality' | 'Field Ops';

export interface Question {
  id: string | number;
  text: string;
  options: string[];
  correctIndex: number; // 0 to 3
  explanation: string;
  bloom: 'Recall (L1)' | 'Application (L2)' | 'Scenario (L3)';
  source: string; // Maps to topic_tag
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  cohorts?: Cohort[];
  zones?: Zone[];
  questions: Question[];
  createdBy: string;
  createdAt: any; // Firestore Timestamp
  status?: 'Draft' | 'Published' | 'Scheduled';
}

export interface LearnerResult {
  userId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  delta: number;
  failedConcepts: string[]; // Triggers Mistake Re-Roll
  submittedAt: any; // Firestore Timestamp
}

export interface CompetencyProfile {
  subject: CompetencyAxis;
  current: number; // 0-5 scale
  benchmark: number; // 0-5 scale
  delta?: number;
}

export interface TPACMemo {
  id: string;
  cohort: Cohort;
  zone: Zone;
  failedCompetency: CompetencyAxis;
  failureRate: number; // e.g., 0.45 for 45%
  memoText: string;
  status: 'Pending Review' | 'Approved' | 'Sent to NSSTA';
  createdAt: any;
}
```
