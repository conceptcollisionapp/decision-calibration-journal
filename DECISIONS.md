# Build Decisions

## DECISIONS.md

### Project: Decision Journal App

**Summary:**
The Decision Journal app helps users improve their decision-making calibration. Users log decisions with predicted outcomes and confidence levels. On a scheduled review date, the app prompts for the actual outcome. Over time, it provides a dashboard showing calibration (actual accuracy vs. stated confidence), streaks of well-calibrated calls, total decisions reviewed, and the biggest miss. The app features a dark UI and persists data locally using `localStorage`.

---

### Key Technical Decisions

1.  **Technology Stack:**
    *   **Framework:** React
    *   **Build Tool:** Vite
    *   **Styling:** Tailwind CSS with PostCSS and Autoprefixer
    *   **Rationale:** Chosen for a modern, lean, and efficient development experience.

2.  **Data Persistence (localStorage):**
    *   **Mechanism:** All decision data is stored in `localStorage` as a JSON string.
    *   **Schema Versioning:** A `schemaVersion: 1` field is included in the stored payload. On `loadDecisions`, if a version mismatch occurs, the existing data is loaded (not `[]`), but a `schemaValid` flag is set to `false`. Subsequent `saveDecisions` calls are gated by this `schemaValid` flag, preventing accidental overwrites of older schema data.
    *   **Error Handling:** Both `JSON.parse` in `loadDecisions` and `localStorage.setItem` in `saveDecisions` are wrapped in `try/catch` blocks to prevent app crashes from malformed data or storage quota exceeding.

3.  **Date and Time Handling:**
    *   **Date Representation:** All review dates and creation/reviewed timestamps are stored as bare `YYYY-MM-DD` strings.
    *   **Date Arithmetic (`addInterval`):** A custom `addInterval` helper function handles calculations for "1 week," "1 month," and "3 months." It includes logic to clamp the day of the month when adding months (e.g., Jan 31 + 1 month → Feb 28/29).
    *   **Timezone Consistency:** When converting `YYYY-MM-DD` strings to `Date` objects for calculations, `T00:00:00` is appended to ensure consistent parsing as UTC midnight, mitigating timezone-related day shifts.
    *   **Custom Date Input:** The custom review date picker (`<input type="date">`) enforces a `min={today}` to prevent users from accidentally selecting past dates for review.

4.  **Unique Identifiers:**
    *   **Decision IDs:** `crypto.randomUUID()` is used to generate unique IDs for each decision, preventing collisions that could occur with `Date.now()`.

5.  **Calibration Logic:**
    *   **Outcome Weighting:** Decision outcomes are weighted for accuracy calculation: 'worked' = 1, 'partially' = 0.5, 'failed' = 0. This weighting is applied consistently across all relevant calculations (dashboard accuracy, biggest miss).
    *   **Calibration Buckets:** Decisions are grouped into 10% confidence buckets (e.g., 50-59%, 90-100%) to show accuracy within those ranges. Empty buckets are visually distinguished on the dashboard.
    *   **Current Streak:** A "Current streak" tracks the number of consecutive *well-calibrated* decisions, starting from the most recent review backward.
    *   **Reviewed Date:** A `reviewedDate` field (YYYY-MM-DD string) is added to decisions upon marking them as reviewed. This allows the streak and other time-sensitive calculations to sort decisions by their actual review completion time, not their original logging time.
    *   **Well-Calibrated Predicate:** A decision is considered well-calibrated if `Math.abs(d.confidence / 100 - score)` is less than or equal to `0.25`. This provides a continuous measure of calibration.
    *   **Biggest Miss:** Identifies the decision where confidence most contradicted outcome, specifically filtered to `outcome !== 'worked'` and `confidence >= 70` to highlight high-confidence failures.
    *   **`parseInt` Radix:** All `parseInt` calls (e.g., for confidence) explicitly include radix `10` for best practice.

---

### Disagreements and Resolutions

1.  **Initial Package.json Review (Claude vs. Grok):**
    *   **Disagreement:** Claude raised concerns about the lack of a date library for arithmetic, absence of a test runner, and unaddressed `localStorage` schema versioning. Grok initially deferred on tests due to a "lean mandate" and only verbally acknowledged schema versioning and date math.
    *   **Resolution:** Grok committed to `schemaVersion` and "safe date math." The app proceeded without a dedicated test runner.

2.  **Schema Versioning Implementation (Claude vs. Grok):**
    *   **Disagreement:** Grok's initial `loadDecisions` for a version mismatch returned `[]`, which Claude identified would lead to silent data destruction on subsequent saves. This was flagged twice.
    *   **Resolution:** Grok implemented a `schemaValid` flag. On version mismatch, existing (old schema) data is loaded but saves are blocked until a migration (not implemented yet) or explicit user action resolves the schema incompatibility.

3.  **Core Calibration Logic (Accuracy, Streak, Biggest Miss) (Claude vs. Grok):**
    *   **Disagreement:** Claude identified several flaws in Grok's initial implementations:
        *   Accuracy calculation only counted 'worked', ignoring 'partially'.
        *   "Current streak" was a count of 'worked' outcomes in the last 5, not a true consecutive streak of well-calibrated calls.
        *   Biggest miss calculation could flag successful outcomes as misses.
        *   Streak calculation used logging order, not review order.
        *   The well-calibrated predicate was crude and incorrect for certain confidence ranges.
    *   **Resolution:** Grok iteratively refined these:
        *   Weighted outcomes (1 for worked, 0.5 for partially) were applied consistently.
        *   `reviewedDate` was added to decisions and used for sorting.
        *   Streak became a true consecutive count using the `|confidence - outcome| <= 0.25` predicate, calculated from the most recent review.
        *   Biggest miss was refined to focus on high-confidence non-successes.

4.  **Error Handling for Persistence (Claude vs. Grok):**
    *   **Disagreement:** Claude flagged missing `try/catch` for `JSON.parse` and later for `localStorage.setItem`.
    *   **Resolution:** Grok added `try/catch` blocks to both, improving app resilience.

5.  **`index.html` File Path (Claude vs. Grok):**
    *   **Disagreement:** Claude noted the `index.html` was in `public/` and referencing `/src/index.js`, which would prevent the Vite app from booting.
    *   **Resolution:** Grok moved `index.html` to the project root.

6.  **Unique ID Generation (Claude vs. Grok):**
    *   **Disagreement:** Claude identified `Date.now()` as a potential source of ID collisions.
    *   **Resolution:** Grok switched to `crypto.randomUUID()`.

---

### Unresolved Concerns

1.  **Unit Tests:** While Claude initially recommended Vitest for critical calibration logic, Grok explicitly declined due to a "lean mandate." The core math remains untested programmatically.
2.  **Calibration Target Line:** Claude suggested adding a visual reference line on the dashboard's calibration chart to represent ideal (1:1) calibration, making it easier for users to spot over/under-confidence. This was not implemented.
3.  **Stale UI Updates:** The pending reviews badge and dashboard data (e.g., streak, total reviews) do not automatically refresh in real-time if the app remains open across a review date boundary or if decisions are reviewed on a different tab, requiring a re-render from another state change to update. This was noted as low priority.