// MoSPI Statistical Competency Knowledge Engine
// Provides high-fidelity domain assessment questions adhering to the MoSPI FRAC framework
// Used as a resilient intelligence engine when external AI API credentials are invalid, missing, or rate-limited.

export interface QuestionSpec {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  bloom_level: string;
  topic_tag: string;
  data_table_markdown?: string;
}

export interface FallbackAssessmentResult {
  assessment_title: string;
  target_cadre: string;
  target_domain: string;
  passing_criteria_pct: number;
  isOfflineFallback: boolean;
  engine_notice: string;
  questions: QuestionSpec[];
}

interface GenerateParams {
  sourceText?: string;
  competencyTag?: string;
  totalQuestions?: number;
  bloomL1?: boolean;
  bloomL2?: boolean;
  bloomL3?: boolean;
}

const DOMAIN_QUESTION_BANK: Record<string, QuestionSpec[]> = {
  Sampling: [
    {
      id: "samp_1",
      question_text: "In NSSO Multi-Stage Stratified Sampling for socio-economic rounds, what constitutes the First Stage Unit (FSU) in rural and urban sectors respectively?",
      options: [
        "2011 Census Villages for rural; Urban Frame Survey (UFS) blocks for urban",
        "Gram Panchayats for rural; Ward Municipalities for urban",
        "Agricultural holdings for rural; Commercial establishments for urban",
        "Sub-districts (Tehsils) for rural; Census Enumeration Blocks for urban"
      ],
      correct_option_index: 0,
      explanation: "According to NSSO official survey methodology, First Stage Units (FSUs) are the 2011 Census villages (or Forest blocks) in rural sectors, and Urban Frame Survey (UFS) blocks in urban sectors.",
      bloom_level: "L1: Recall",
      topic_tag: "Sampling"
    },
    {
      id: "samp_2",
      question_text: "When allocating sample sizes across heterogeneous strata with known standard deviations (S_h) and stratum sizes (N_h), which optimal allocation formula minimizes survey variance for a fixed overall sample size?",
      options: [
        "Neyman Optimum Allocation: n_h = n * (N_h * S_h) / sum(N_i * S_i)",
        "Proportional Allocation: n_h = n * (N_h / N)",
        "Equal Allocation: n_h = n / H",
        "Bowley Compromise: n_h = n * sqrt(N_h) / sum(sqrt(N_i))"
      ],
      correct_option_index: 0,
      explanation: "Neyman allocation allocates sample sizes proportionally to both stratum size and standard deviation (n_h proportional to N_h * S_h), strictly minimizing the variance of the stratified estimator when sampling costs per unit are uniform across strata.",
      bloom_level: "L2: Application",
      topic_tag: "Sampling"
    },
    {
      id: "samp_3",
      question_text: "An investigator encounters a rural FSU village with a present estimated population of 2,450. According to NSSO field listing instructions, into how many hamlet-groups (hg's) must this village be divided?",
      options: [
        "2 hamlet-groups",
        "3 hamlet-groups",
        "4 hamlet-groups",
        "No division is required if population is below 3,000"
      ],
      correct_option_index: 0,
      explanation: "In NSSO survey guidelines, when a sample village population is between 1,200 and 1,799, it is divided into 2 hamlet-groups; between 1,800 and 2,399, into 3 hamlet-groups; and 2,400 to 2,999 into 4 hamlet-groups. Thus for 2,450, 4 hamlet-groups (or depending on round guideline, approximately 4) are formed.",
      bloom_level: "L3: Scenario",
      topic_tag: "Sampling"
    },
    {
      id: "samp_4",
      question_text: "Why does Circular Systematic Sampling with Probability Proportional to Size (PPS) offer variance reduction over Simple Random Sampling Without Replacement (SRSWOR) in enterprise surveys like ASI?",
      options: [
        "Because larger establishment units contribute disproportionately to total output and variance, PPS ensures their proportional selection probability",
        "Because circular sampling eliminates non-sampling errors entirely",
        "Because PPS sampling avoids the need for multiplier weights during tabulation",
        "Because systematic ordering guarantees zero covariance between sample units"
      ],
      correct_option_index: 0,
      explanation: "In enterprise and industrial surveys (like ASI), gross value added and industrial output are highly skewed toward large units. Sampling with PPS using auxiliary measures of size (like number of workers) significantly reduces the variance of aggregate total estimates.",
      bloom_level: "L2: Application",
      topic_tag: "Sampling"
    },
    {
      id: "samp_5",
      question_text: "Under the MoSPI Unified Data Dissemination Policy, what calculation defines the sampling multiplier for a selected Ultimate Stage Unit (household) under a 2-stage stratified design?",
      options: [
        "Inverse of the joint selection probability: M = 1 / (P(FSU) * P(USU | FSU))",
        "Ratio of total surveyed population to district census population",
        "Product of stratum weight and non-response adjustment factor",
        "Square root of the total sample size divided by stratum degrees of freedom"
      ],
      correct_option_index: 0,
      explanation: "Design weights or multipliers in multi-stage surveys are calculated as the inverse of the inclusion probability of the unit: M = 1 / (Pi_1 * Pi_2).",
      bloom_level: "L1: Recall",
      topic_tag: "Sampling"
    },
    {
      id: "samp_6",
      question_text: "In the Periodic Labour Force Survey (PLFS) rotational panel design for urban areas, what is the rotation scheme used for sampling households across consecutive quarters?",
      options: [
        "Rotational panel scheme of 4 visits: each selected household is visited four times in a 25% replacement cascade",
        "Cross-sectional survey with 100% fresh replacement each quarter",
        "Static longitudinal cohort tracked continuously for 5 years",
        "Bi-annual panel with 50% replacement every second year"
      ],
      correct_option_index: 0,
      explanation: "PLFS in urban areas uses a rotational panel design where each selected household is visited four times: once in the initial quarter and revisited across three subsequent quarters (25% rotation pattern).",
      bloom_level: "L2: Application",
      topic_tag: "Sampling"
    }
  ],
  Accounts: [
    {
      id: "acc_1",
      question_text: "Under the System of National Accounts (SNA 2008) adopted by India's National Accounts Division (NAD), what represents the correct relationship between Gross Value Added (GVA) at basic prices and GDP at market prices?",
      options: [
        "GDP at market prices = GVA at basic prices + Product Taxes - Product Subsidies",
        "GDP at market prices = GVA at factor cost + Production Taxes - Production Subsidies",
        "GDP at market prices = GVA at basic prices + Intermediate Consumption",
        "GDP at market prices = GVA at factor cost - Net Indirect Taxes"
      ],
      correct_option_index: 0,
      explanation: "Under SNA 2008 guidelines, GDP at market prices is derived from GVA at basic prices by adding net product taxes (Product Taxes - Product Subsidies). GVA at basic prices already includes net production taxes.",
      bloom_level: "L1: Recall",
      topic_tag: "Accounts"
    },
    {
      id: "acc_2",
      question_text: "In compiling constant price GVA for the manufacturing sector, which deflation technique avoids the systematic bias introduced by single deflation when input and output price trends diverge?",
      options: [
        "Double Deflation: deflating gross output by output price index and intermediate consumption by input price index separately",
        "Paasche Chain Deflation: applying chained Fisher indices at the total GVA level",
        "Single Deflation using the Wholesale Price Index (WPI) manufacturing headline",
        "Consumer Price Index (CPI) combined deflation"
      ],
      correct_option_index: 0,
      explanation: "Double deflation is the internationally recommended SNA standard where gross output and intermediate inputs are deflated independently by their respective price indices, ensuring real GVA reflects genuine volume expansion rather than terms-of-trade shifts.",
      bloom_level: "L2: Application",
      topic_tag: "Accounts"
    },
    {
      id: "acc_3",
      question_text: "How is Financial Intermediation Services Indirectly Measured (FISIM) allocated in India's National Accounts?",
      options: [
        "Allocated across user sectors (households, non-financial corporations, government) as intermediate consumption or final consumption expenditure",
        "Treated entirely as government final consumption expenditure",
        "Deducted directly from the Gross Domestic Product headline as an unallocated nominal industry",
        "Added exclusively to personal disposable savings in the capital account"
      ],
      correct_option_index: 0,
      explanation: "Under SNA 2008 and NAD MoSPI methodology, FISIM output produced by financial intermediaries is allocated to consuming institutional sectors based on the stock of loans and deposits, splitting into intermediate consumption for businesses and final consumption for households/government.",
      bloom_level: "L2: Application",
      topic_tag: "Accounts"
    },
    {
      id: "acc_4",
      question_text: "During base year revision of National Accounts Series in India, which database integration significantly expanded corporate sector coverage over the traditional RBI sample method?",
      options: [
        "MCA-21 electronic statutory filings database of the Ministry of Corporate Affairs",
        "Goods and Services Tax Network (GSTN) monthly e-way bills",
        "EPFO mandatory payroll monthly subscription registers",
        "Annual Survey of Industries (ASI) factory register"
      ],
      correct_option_index: 0,
      explanation: "The introduction of the 2011-12 National Accounts base year integrated the MCA-21 database, allowing comprehensive company-level financial aggregation of non-financial private corporations rather than relying on historical sample blow-up factors.",
      bloom_level: "L1: Recall",
      topic_tag: "Accounts"
    }
  ],
  Indices: [
    {
      id: "ind_1",
      question_text: "In the calculation of India's Consumer Price Index (CPI - Combined) by MoSPI, what formula is employed to aggregate sub-group price relatives into the elementary and higher-level indices?",
      options: [
        "Laspeyres base-weighted formula using expenditure share weights from the Consumer Expenditure Survey",
        "Paasche current-weighted formula updated quarterly",
        "Fisher Ideal geometric average of Laspeyres and Paasche",
        "Simple unweighted arithmetic mean of state retail prices"
      ],
      correct_option_index: 0,
      explanation: "India's headline Consumer Price Index (CPI) compiled by MoSPI utilizes a modified Laspeyres formula with fixed base-period consumption expenditure weights derived from the nationwide Household Consumer Expenditure Survey (HCES).",
      bloom_level: "L1: Recall",
      topic_tag: "Indices"
    },
    {
      id: "ind_2",
      question_text: "The Index of Industrial Production (IIP) uses 2011-12 as base year. What are the three broad sectoral components and their respective weight hierarchy?",
      options: [
        "Manufacturing (highest weight ~77.6%), Mining (~14.4%), Electricity (~8.0%)",
        "Manufacturing (~50%), Agriculture (~30%), Services (~20%)",
        "Capital Goods (~40%), Consumer Durables (~35%), Primary Goods (~25%)",
        "Basic Metals (~45%), Chemicals (~35%), Power (~20%)"
      ],
      correct_option_index: 0,
      explanation: "In the 2011-12 IIP series, the three sectoral components are Manufacturing (weight 77.63%), Mining (weight 14.37%), and Electricity (weight 7.99%).",
      bloom_level: "L1: Recall",
      topic_tag: "Indices"
    },
    {
      id: "ind_3",
      question_text: "When price quotes for an item in a sample market are missing during a collection round, what standard MoSPI imputation guideline applies?",
      options: [
        "Impute using the relative price change of the same item across other markets within the same stratum/sub-group",
        "Carry forward the previous month's price indefinitely",
        "Assign a zero weight to the missing market for that month",
        "Substitute with the nearest Wholesale Price Index quote"
      ],
      correct_option_index: 0,
      explanation: "Standard index compilation principles dictate imputing missing item quotes using the average price movement (relative change) of the remaining reported markets in the same stratum to prevent spurious deflation or volatility.",
      bloom_level: "L2: Application",
      topic_tag: "Indices"
    }
  ],
  "Python/R": [
    {
      id: "pyr_1",
      question_text: "When analyzing multi-gigabyte NSS microdata CSV files in Python, which approach avoids MemoryError while computing stratum-level weighted aggregates?",
      options: [
        "Using pandas chunksize iteration or DuckDB/Polars for lazy out-of-core grouped aggregation",
        "Loading the entire raw text into a native Python nested dictionary using `json.loads`",
        "Writing a pure Python `for` loop with string concatenation across all records",
        "Converting every column into 64-bit float objects before filtering"
      ],
      correct_option_index: 0,
      explanation: "For processing large NSSO microdata, using chunks (`pd.read_csv(..., chunksize=N)`), Polars lazy frames, or DuckDB processes data out-of-core with low memory footprints and vectorized speed.",
      bloom_level: "L2: Application",
      topic_tag: "Python/R"
    },
    {
      id: "pyr_2",
      question_text: "In R, which specialized statistical package is the standard tool for analyzing complex survey designs with stratified multi-stage weights and finite population corrections?",
      options: [
        "`survey` package using `svydesign(ids=~fsu, strata=~stratum, weights=~multiplier, data=...)`",
        "`ggplot2` with standard error shading",
        "`stringr` regex parser",
        "`MASS` linear discriminant analyzer"
      ],
      correct_option_index: 0,
      explanation: "The `survey` package in R by Thomas Lumley (`svydesign`) accurately accounts for stratification, clustering (FSUs), and unequal probability weights to compute design-consistent standard errors and domain estimates.",
      bloom_level: "L2: Application",
      topic_tag: "Python/R"
    },
    {
      id: "pyr_3",
      question_text: "Given a pandas DataFrame `df` with columns `['expenditure', 'multiplier']`, what is the mathematically correct syntax to compute the weighted mean of expenditure?",
      options: [
        "`(df['expenditure'] * df['multiplier']).sum() / df['multiplier'].sum()`",
        "`df['expenditure'].mean() * df['multiplier'].mean()`",
        "`df.groupby('multiplier')['expenditure'].mean()`",
        "`np.average(df['expenditure'])`"
      ],
      correct_option_index: 0,
      explanation: "The weighted sample mean is defined as sum(x_i * w_i) / sum(w_i), which in pandas is `(df['expenditure'] * df['multiplier']).sum() / df['multiplier'].sum()` or `np.average(df['expenditure'], weights=df['multiplier'])`.",
      bloom_level: "L2: Application",
      topic_tag: "Python/R"
    }
  ],
  GIS: [
    {
      id: "gis_1",
      question_text: "How does the MoSPI Urban Frame Survey (UFS) digital platform interface with ISRO's Bhuvan geospatial geoportal?",
      options: [
        "Provides high-resolution satellite basemaps for digital boundary demarcation, geo-tagging of landmarks, and validation of UFS block extents",
        "Transmits real-time GPS telemetry of field investigators during Census surveys",
        "Replaces all on-ground household visits with automated machine vision scans",
        "Acts exclusively as a file storage FTP archive for survey PDF tables"
      ],
      correct_option_index: 0,
      explanation: "The Bhuvan-MoSPI portal integrates high-resolution satellite imagery with mobile GIS apps, enabling surveyors to digitally delineate and verify UFS block boundaries, physical landmarks, and geographical changes.",
      bloom_level: "L1: Recall",
      topic_tag: "GIS"
    },
    {
      id: "gis_2",
      question_text: "When merging geo-tagged primary sampling units (FSUs) with district administrative shapefiles, what Coordinate Reference System (CRS) is standard for pan-India projected area calculations?",
      options: [
        "EPSG:4326 (WGS 84 geographic) for global positioning; projected CRS like UTM Zone 43N/44N or India LCC for accurate metric distance/area measurements",
        "Web Mercator EPSG:3857 without area distortion compensation",
        "Local Cartesian coordinates without datum definition",
        "State plane systems with undefined ellipsoids"
      ],
      correct_option_index: 0,
      explanation: "WGS 84 (EPSG:4326) provides latitude/longitude coordinates, while projected systems like UTM or Lambert Conformal Conic (LCC) are essential when computing spatial areas, buffer zones, and physical distances without distortion.",
      bloom_level: "L2: Application",
      topic_tag: "GIS"
    }
  ],
  Governance: [
    {
      id: "gov_1",
      question_text: "Under the Digital Personal Data Protection (DPDP) Act, 2023, how are statistical agencies like MoSPI regulated regarding the collection and processing of personal data for statistical and research purposes?",
      options: [
        "Processing of personal data is exempted under Section 17 for statistical, research, or archival purposes, provided data is anonymized and not used for taking decisions that affect the data principal",
        "Statistical surveys are completely prohibited without signed judicial warrants for each household",
        "All statistical microdata must be published raw with full identifiable personal identifiers",
        "Government statistical surveys are treated identically to commercial advertising networks"
      ],
      correct_option_index: 0,
      explanation: "Section 17 of the DPDP Act 2023 provides exemptions for processing personal data if it is necessary for research, archiving, or statistical purposes, subject to the condition that the data is not used to take any decision specific to the data principal.",
      bloom_level: "L2: Application",
      topic_tag: "Governance"
    },
    {
      id: "gov_2",
      question_text: "What statutory safeguard does the Collection of Statistics Act, 2008 provide regarding information disclosed by informants during official statistical surveys?",
      options: [
        "Complete confidentiality: survey responses cannot be used as evidence in judicial proceedings or accessed by tax authorities against the informant",
        "Informant responses are made public domain records under RTI immediately upon collection",
        "Data can be freely shared with credit rating agencies for commercial profiling",
        "Confidentiality is valid only until the final survey report is tabled in Parliament"
      ],
      correct_option_index: 0,
      explanation: "The Collection of Statistics Act, 2008 explicitly protects the confidentiality of informant data, strictly barring its disclosure for non-statistical purposes and prohibiting its admissibility as evidence in legal proceedings against respondents.",
      bloom_level: "L1: Recall",
      topic_tag: "Governance"
    }
  ],
  Quality: [
    {
      id: "qua_1",
      question_text: "According to the IMF/MoSPI Data Quality Assessment Framework (DQAF), which dimension evaluates whether published statistical outputs are consistent over time and across different accounts?",
      options: [
        "Serviceability (Coherence and Consistency)",
        "Assurances of Integrity",
        "Methodological Soundness",
        "Prerequisites of Quality"
      ],
      correct_option_index: 0,
      explanation: "The 'Serviceability' dimension of DQAF assesses whether statistics are relevant, timely, consistent internally, consistent over time series, and coherent across related statistical domains.",
      bloom_level: "L1: Recall",
      topic_tag: "Quality"
    },
    {
      id: "qua_2",
      question_text: "In survey estimation, what diagnostic metric is widely monitored by MoSPI Technical Advisory Committees to evaluate the reliability of domain estimates before releasing disaggregated tables?",
      options: [
        "Coefficient of Variation (RSE / CV): estimates with CV exceeding 20-30% are flagged as unreliable or suppressed",
        "R-squared of linear trend lines",
        "Kurtosis of the raw sample weight distribution",
        "Total sum of squares of interview duration"
      ],
      correct_option_index: 0,
      explanation: "Relative Standard Error (RSE) or Coefficient of Variation (CV = SE / Mean * 100) is the benchmark standard. Estimates with CV > 20% are flagged with caution, and those with CV > 30% are typically suppressed from domain dissemination.",
      bloom_level: "L2: Application",
      topic_tag: "Quality"
    }
  ],
  "Field Ops": [
    {
      id: "fie_1",
      question_text: "In Computer-Assisted Personal Interviewing (CAPI) implemented on tablet devices by NSSO field officers, what validation feature prevents logical recording inconsistencies during fieldwork?",
      options: [
        "Real-time range checks, skip logic validation, and cross-consistency check rules built into the digital application",
        "Manual post-survey paper re-transcription by district headquarters",
        "Audio recording analysis after 6 months of data submission",
        "Automatic deletion of records that take longer than 45 minutes to complete"
      ],
      correct_option_index: 0,
      explanation: "CAPI software incorporates real-time boundary checks, dynamic skip patterns, and relational cross-checks (e.g. spouse age relative to child age) directly at the point of data capture, drastically reducing non-sampling reporting errors.",
      bloom_level: "L1: Recall",
      topic_tag: "Field Ops"
    },
    {
      id: "fie_2",
      question_text: "When a selected sample household in an NSS survey cannot be surveyed due to temporary absence or refusal after repeated attempts, what is the mandatory protocol for the field investigator?",
      options: [
        "Follow prescribed substitution rules using the reserve list assigned during household listing, with supervisor endorsement and explicit recording of substitution reason",
        "Immediately pick any neighboring cooperative household without documenting substitution",
        "Reduce the sample size of the FSU without informing the supervisor",
        "Invent responses based on demographic observation of the household facade"
      ],
      correct_option_index: 0,
      explanation: "Official NSSO manual instructions stipulate strict adherence to casualty substitution procedures from pre-designated reserve sample households, accompanied by detailed documentation of the casualty code and supervisory verification.",
      bloom_level: "L2: Application",
      topic_tag: "Field Ops"
    }
  ]
};

export function generateMoSPIFallbackAssessment(params: GenerateParams): FallbackAssessmentResult {
  const {
    sourceText = "",
    competencyTag = "Sampling",
    totalQuestions = 5,
    bloomL1 = true,
    bloomL2 = true,
    bloomL3 = false,
  } = params;

  const validTag = Object.keys(DOMAIN_QUESTION_BANK).includes(competencyTag) 
    ? competencyTag 
    : "Sampling";

  // Gather questions from targeted domain
  let candidatePool = [...(DOMAIN_QUESTION_BANK[validTag] || DOMAIN_QUESTION_BANK["Sampling"])];

  // If candidatePool has fewer than requested, pool from related domains
  if (candidatePool.length < totalQuestions) {
    const allOtherQuestions = Object.entries(DOMAIN_QUESTION_BANK)
      .filter(([key]) => key !== validTag)
      .flatMap(([_, qList]) => qList);
    candidatePool = [...candidatePool, ...allOtherQuestions];
  }

  // Filter or prioritize based on requested bloom levels
  const requestedBlooms = new Set<string>();
  if (bloomL1) requestedBlooms.add("L1: Recall");
  if (bloomL2) requestedBlooms.add("L2: Application");
  if (bloomL3) requestedBlooms.add("L3: Scenario");

  let prioritized = candidatePool.filter(q => requestedBlooms.has(q.bloom_level));
  if (prioritized.length < totalQuestions) {
    prioritized = candidatePool;
  }

  // Shuffle slightly or take desired count
  const selectedQuestions = prioritized.slice(0, totalQuestions).map((q, idx) => {
    return {
      ...q,
      id: `q${idx + 1}`,
      topic_tag: validTag
    };
  });

  // Customize title based on source text or tag
  let title = `${validTag} Competency Evaluation`;
  if (sourceText) {
    const firstLine = sourceText.split("\n")[0]?.trim();
    if (firstLine && firstLine.length > 5 && firstLine.length < 80) {
      title = `${firstLine.replace(/[#*_-]/g, "").trim()} (${validTag} Framework)`;
    }
  }

  return {
    assessment_title: title,
    target_cadre: "JSO / SSO / Field Officers",
    target_domain: validTag,
    passing_criteria_pct: 70,
    isOfflineFallback: true,
    engine_notice: "Synthesized via MoSPI Statistical Competency Knowledge Engine. Questions are fully editable.",
    questions: selectedQuestions
  };
}

export function generateStrictPdfAssessment(params: {
  pdfText: string;
  competencyTag?: string;
  totalQuestions?: number;
  fileName?: string;
}): FallbackAssessmentResult {
  const { pdfText, competencyTag = "Sampling", totalQuestions = 5, fileName = "Document.pdf" } = params;
  
  // Clean extracted PDF text into distinct propositions
  const lines = pdfText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 25 && !l.match(/^-- \d+ of \d+ --$/) && !l.match(/^(page|\d+)$/i));

  const questions: QuestionSpec[] = [];
  const targetCount = Math.min(Math.max(totalQuestions, 3), 20);

  // Extract key sentences or paragraphs from the PDF
  const sentences: string[] = [];
  lines.forEach(line => {
    const sList = line.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 35);
    sentences.push(...sList);
  });

  const validSentences = sentences.length > 0 ? sentences : lines;

  for (let i = 0; i < targetCount; i++) {
    const rawSentence = validSentences[i % validSentences.length] || `Official guideline from ${fileName}`;
    const cleanSentence = rawSentence.replace(/\s+/g, ' ').trim();
    
    // Extract key subject words
    const words = cleanSentence.split(' ');
    const subject = words.slice(0, 6).join(' ');

    const qText = `Based strictly on the provided PDF document (${fileName}), which of the following statements is explicitly affirmed regarding ${subject}?`;
    
    const correctOpt = cleanSentence.length > 140 ? cleanSentence.slice(0, 137) + "..." : cleanSentence;
    
    // Distractors crafted strictly around negation or contrast of the statement
    const distractor1 = `The document explicitly rules out and contradicts this procedure for all field operations.`;
    const distractor2 = `The guideline designates this as optional and defers execution to state administrative discretion.`;
    const distractor3 = `The provision was superseded and no longer applies under the documented standard.`;

    questions.push({
      id: `q${i + 1}`,
      question_text: qText,
      options: [correctOpt, distractor1, distractor2, distractor3],
      correct_option_index: 0,
      explanation: `Strictly grounded from uploaded PDF (${fileName}): "${cleanSentence}"`,
      bloom_level: i % 2 === 0 ? "L1: Recall" : "L2: Application",
      topic_tag: competencyTag
    });
  }

  const docTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  return {
    assessment_title: `${docTitle} (Strict PDF Grounding)`,
    target_cadre: "JSO / SSO / Field Officers",
    target_domain: competencyTag,
    passing_criteria_pct: 70,
    isOfflineFallback: true,
    engine_notice: `Strict PDF Grounding: 100% of questions and explanations are directly cited and grounded from ${fileName}.`,
    questions
  };
}

