# 🧠 Autonomous Knowledge Research System (AKRS) Architecture

## Overview

AKRS is a **research-grade AI system** that operates independently to:
- Generate its own research questions
- Search and scrape the web (no API required)
- Extract and normalize information
- Detect and analyze contradictions
- Score information credibility
- Learn from reasoning loops

---

## 🏗️ System Architecture (6 Layers)

```
┌─────────────────────────────────────────────────────┐
│ L6: AUTONOMY LAYER (autonomy_loop.js)              │
│ - Question generation                               │
│ - Decision making                                   │
│ - Loop control                                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ L5: REASONING LAYER                                │
│ - causal.js (cause → effect)                       │
│ - inference.js (derive new knowledge)              │
│ - analogy.js (cross-domain mapping)               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ L4: EVALUATION LAYER                               │
│ - truth_score_v2.js (5-factor analysis)           │
│ - contradiction_v2.js (conflict detection)         │
│ - checker.js (validation)                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ L3: KNOWLEDGE LAYER                                │
│ - normalize.js (standardization)                   │
│ - parser.js (text parsing)                         │
│ - ontology.js (concept mapping)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ L2: EXTRACTION LAYER                               │
│ - ingest.js (pipeline entry)                       │
│ - writer.js (storage)                              │
│ - entity.js (entity extraction)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ L1: WEB LAYER (web_crawler.js)                     │
│ - Search queries                                   │
│ - HTML fetching                                    │
│ - Text extraction                                  │
│ - Link discovery                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Seed Question OR Auto-Generated Question         │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 2. Search Query Generator (autonomy_loop.js)       │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 3. Web Fetch (web_crawler.js)                      │
│    - HTML → Text extraction                        │
│    - Link discovery                                │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 4. Parser (parser.js)                              │
│    - Clean text                                    │
│    - Chunk content                                 │
│    - Extract claims                                │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 5. Normalize (normalize.js)                        │
│    - Standard format                               │
│    - Add metadata                                  │
│    - Link entities                                 │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 6. Store (writer.js)                               │
│    - Claims vault                                  │
│    - Evidence vault                                │
│    - Sources vault                                 │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 7. Reasoning (causal.js)                           │
│    - Build causal graph                            │
│    - Find patterns                                 │
│    - Generate inferences                           │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 8. Contradiction Detection                         │
│    - contradiction_v2.js                           │
│    - Type: direct, logical, temporal              │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 9. Truth Scoring (truth_score_v2.js)              │
│    - 5-factor analysis                             │
│    - Generate credibility score                    │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 10. Graph Update                                   │
│     - Update causal graph                          │
│     - Add relationships                            │
│     - Adjust scores                                │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│ 11. Loop Decision (autonomy_loop.js)              │
│     - Continue / Refine / Stop                     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Memory Structure (Knowledge Vault)

```
Knowledge-Vault/
├── claims/           # Atomic statements {id, text, confidence}
├── concepts/         # Abstract structures {name, definition, type}
├── evidence/         # Proof and data {id, claim_id, strength, source}
├── sources/          # Web data {url, title, domain, reliability}
├── contradictions/   # Conflict records {claim1, claim2, severity}
├── questions/        # Generated queries {question, type, priority}
└── graph/           # Relationship edges {source, target, relation_type}
```

### Data Unit Schema (universal)

```json
{
  "id": "unique_identifier",
  "text": "content",
  "source": "url_or_origin",
  "confidence": 0-100,
  "timestamp": "ISO8601",
  "links": ["related_ids"],
  "metadata": {
    "type": "claim|evidence|concept",
    "category": "...",
    "tags": []
  }
}
```

---

## 🧠 Core Modules

### 1. **autonomy_loop.js** - 🤖 AI Decision Engine
- Generates questions dynamically
- Detects knowledge gaps
- Makes loop decisions (continue/refine/stop)
- Manages contradiction handling

**Key Functions:**
```javascript
startAutonomyLoop(initialQuestion)  // Start self-learning
generateQuestion()                  // Create new research questions
identifyKnowledgeGaps()            // Find what system doesn't know
makeDecision(state)                // Choose next action
```

### 2. **web_crawler.js** - 🌐 Web Discovery (No API)
- Fetches HTML without external APIs
- Extracts text and links
- Chunks content
- Mines claims from text

**Key Functions:**
```javascript
fetchHTML(url)              // Get web content
extractTextFromHTML(html)   // Clean text
extractClaims(text)         // Mine statements
scrapePage(url)             // Full pipeline
```

### 3. **truth_score_v2.js** - 📊 5-Factor Truth Analysis
- Evidence Strength (quality of proof)
- Source Reliability (trustworthiness)
- Contradiction Check (conflicts)
- Causal Validity (logical coherence)
- Cross-Source Agreement (consensus)

**Formula:**
```
TruthScore = 
  (EvidenceStrength × 0.25)
  + (SourceReliability × 0.25)
  + (CausalValidity × 0.20)
  + (CrossSourceAgreement × 0.20)
  - (ContradictionPenalty × 0.10)
```

**Key Functions:**
```javascript
calculateCompositeTruthScore(claimData)  // Get 0-100 score
generateTruthReport(claims)              // Detailed analysis
compareTruthScores(claim1, claim2)       // Compare credibility
```

### 4. **contradiction_v2.js** - ⚠️ Conflict Detection
- Direct contradictions ("A" vs "not A")
- Logical inversions
- Temporal conflicts

### 5. **causal.js** - 🔗 Causal Reasoning
- Build cause → effect relationships
- Navigate causal graphs
- Detect causal loops

### 6. **system_bootstrap.js** - 🚀 System Initialization
- Initialize all modules
- Load existing knowledge
- Setup health monitoring
- Start autonomy loop

---

## 🎯 Question Generation (Autonomy)

The system generates 5 types of questions:

```javascript
WHAT:    "นิยามของ X คืออะไร?"           // Definition gaps
WHY:     "ทำไม X ถึง Y?"                 // Causal gaps
HOW:     "X ทำงานอย่างไร?"              // Mechanism gaps
WHERE:   "X เกี่ยวข้องกับ domain?"       // Domain extension
WHAT_IF: "ถ้า X ล่มสลาย จะเกิดอะไร?"   // Counterfactual
```

---

## ⚙️ Truth Scoring Explained

### Factor 1: Evidence Strength
```
Direct evidence:       100%
Statistical:           85%
Expert testimony:      80%
Experimental:          95%
Testimonial:           60%
Anecdotal:             40%
Hearsay:               10%
```

### Factor 2: Source Reliability
```
Peer-reviewed:         95%
Academic:              90%
Government:            85%
Major news:            75%
Domain expert:         85%
Verified user:         60%
Social media:          20%
Forum:                 35%
```

### Factors 3-5: Combined Analysis
- **Causal Validity**: Does the claim follow logical patterns?
- **Cross-Source Agreement**: Do multiple sources agree?
- **Contradiction**: Are there conflicting statements?

---

## 🔁 Autonomy Loop Example

```javascript
import { startAutonomyLoop } from './autonomy_loop.js';

const result = await startAutonomyLoop("ความรู้ AI คืออะไร?");
// System will:
// 1. Start with your question
// 2. Search for information
// 3. Extract claims and evidence
// 4. Build causal relationships
// 5. Detect contradictions
// 6. Score truth values
// 7. Generate new questions
// 8. Repeat until confident or gaps resolved
```

---

## 🚀 Getting Started

### Initialize System
```javascript
import { initializeSystem, startSystem } from './system_bootstrap.js';

await initializeSystem({
    mode: 'research',
    autoStartLoop: true,
    maxIterations: 1000
});

await startSystem();
```

### Manual Single Query
```javascript
import { scrapePage } from './web_crawler.js';
import { calculateCompositeTruthScore } from './truth_score_v2.js';

const result = await scrapePage('https://example.com');
const truthScore = calculateCompositeTruthScore({
    claim: "Example claim",
    evidence: result.claims
});
```

---

## 📊 System Metrics

- **Trust Level**: 0-100% (system confidence)
- **Knowledge Gaps**: Number of unanswered questions
- **Contradiction Count**: Number of conflicts detected
- **Loop Iterations**: Self-learning cycles completed
- **Question Count**: Total questions generated

---

## ⚠️ Important Limitations

1. **No external APIs** - Uses only web scraping and local processing
2. **CORS limitations** - Browser requires proxy for some sites
3. **Rate limiting** - Manual delays needed between requests
4. **Accuracy** - Depends on source quality and extraction rules
5. **Scalability** - Single-threaded JS (Node.js workers needed for production)

---

## 🛣️ Roadmap

- [ ] Multi-language support
- [ ] Concept linking optimization
- [ ] Advanced NLP for claim extraction
- [ ] Distributed system architecture
- [ ] Real-time API endpoint
- [ ] Graph visualization UI
- [ ] Automated fact-checking

---

## 📞 Debugging

Check system diagnostics:
```javascript
import { getSystemDiagnostics } from './system_bootstrap.js';

const diagnostics = getSystemDiagnostics();
console.log(diagnostics);
```

---

**Built with ❤️ for research automation**