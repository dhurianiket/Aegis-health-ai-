# Graph Report - .  (2026-09-15)

## Corpus Check
- 293 files · ~277,535 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1294 nodes · 3339 edges · 74 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 867 · contains: 784 · imports_from: 636 · MODIFIES: 379 · PARENT_OF: 245 · ON_BRANCH: 202 · calls: 161 · method: 45 · inherits: 12 · re_exports: 8


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 293 · Candidates: 319
- Excluded: 0 untracked · 55790 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `50e2262`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 37 edges
2. `useProfile()` - 23 edges
3. `LabResult` - 22 edges
4. `handleFirestoreError()` - 21 edges
5. `WearableBiometrics` - 21 edges
6. `parseSafeTimestamp()` - 18 edges
7. `db` - 17 edges
8. `exportToFhirBundle()` - 16 edges
9. `UserProfile` - 15 edges
10. `getDocuments()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 0 → community 4_
- `025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges` --PARENT_OF--> `f622d7c docs: record Snapshot XLIV — 3D glassmorphic health sync redesign with permission toggles, drag-drop, enhanced parsing`  [EXTRACTED]
  git → git  _Bridges community 0 → community 32_
- `04542bb feat(a11y): add aria-label and focus states to CycleTrackingWidget Settings button` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 23 → community 4_
- `0531e0c 🎨 Palette: [Accessibility improvements]` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 47 → community 4_
- `05d41a9 feat(graphify): update knowledge graph with Pillar 3 nodes (1,235 nodes, 3,081 edges, 98 communities)` --PARENT_OF--> `a87820d feat(pillar-4): implement WebCrypto Zero-Knowledge Vault & Immutable SHA-256 Security Audit Trail`  [EXTRACTED]
  git → git  _Bridges community 4 → community 19_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (48): 025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges, 0cf9961 fix(health-sync): resolve Apple & Google Health sync state persistence and fix Apple Health banner styling, 2f420cb feat(integrations): implement Apple Health (HealthKit) and Google Health Connect live synchronization engine and file importers, 3676bdd Merge pull request #189 from dhurianiket/palette-a11y-healthconnect-close-16586726464144134397, 392a8d4 feat(wearable-sync): persist and live-sync wearable telemetry via Firestore, 3a89129 🎨 Palette: Add ARIA label and focus styles to Health Connect modal close button, 42a74a1 docs: update CURRENT_STATE.md with Snapshot XLII release, 5531d62 fix(wearable-plan): close implementation plan gaps (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (44): SBARPreviewProps, FoodInteractionMatrix(), InteractionMatrixProps, AdverseEventReaction, BlackBoxWarning, cacheOpenFdaSummary(), cacheRxCuiMatch(), cleanDrugQuery() (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (29): COLORS, 2c62e81 chore(graphify): refresh knowledge graph and test environment configurations, 443b45e Merge pull request #182 from dhurianiket/bolt/single-forward-pass-9005716069439111533, 50e2262 fix(security): resolve DoS body limit, secure ID generation with crypto.randomUUID, update dependencies and harden configs, a064be0 refactor: Replace .sort()[0] with single forward pass, SYMPTOMS_LIST, SharedProfileProps, app (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (31): AboutUs, AdminDashboard, BlogCBC, BlogHbA1c, CalendarSync, CareMap, ChatCoach, ConsentScreen (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (41): main, 02b8b11 docs: update CURRENT_STATE.md with Snapshot XXXIV teamwork feature and test suite completion, 05d41a9 feat(graphify): update knowledge graph with Pillar 3 nodes (1,235 nodes, 3,081 edges, 98 communities), 08633f7 ⚡ Bolt: [performance improvement] Optimize global stats aggregation, 09898fa feat(landing): showcase India pricing plans & AEGIS100 1-month free trial promo banner, 0f3d105 docs: update CURRENT_STATE.md with Snapshot XXVII Aura AI Chat contrast fix, 1529b26 fix(security): add Google Analytics GA4 & GTM domains to Content-Security-Policy to unblock analytics data collection, 21b3761 Merge pull request #206 from dhurianiket/palette-accessible-focus-states-9254562616176228183 (+33 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (37): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), FHIRResource, LOINC_DICTIONARY, LoincMapping, lookupLoincCode() (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (24): RemindersContext, RemindersContextType, RemindersProvider(), RemindersWidgetProps, checkAppointmentsForReminders(), createReminder(), generateRemindersFromAlerts(), getUpcomingReminders() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (20): buildCoachPromptAugmentation(), CoachResponse, getCoachResponse(), WearableCoachWidgetProps, 0e21ec0 fix(ui-ux): enhance text readability, accessibility contrast (WCAG AA), and remove mock demo telemetry buttons, e2ef66b feat(wearable-fusion): add AI Health Coach wearable telemetry engine, ActivityFilter, BiometricDiagnosticCorrelation (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (25): ClinicalSummaryRecord, deleteDocumentRecord(), FirestoreErrorInfo, getClinicalSummary(), getConversations(), getDocuments(), getFamilyRelations(), getHealthScores() (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (24): AbdmConnectModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS, DEFAULT_CONSENT_REQUESTS, disconnectAbdm(), discoverCareContexts() (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (21): becbaba style(apple-design): enhance dark mode surface contrast, typography legibility, and Recharts tick visibility per Apple HIG, ATTENTION_STATUSES, BiomarkerTrajectoryWidget, Canvas3DMesh, ComparativeAnalysis, CorrelationMatrix, CycleTrackingWidget, EmptyDashboard (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (25): analyzeWithSpecialist(), ExtractedReportResponse, extractMedicalReports(), generateClinicalSummary(), SAFETY_GUARDRAIL(), SPECIALIST_PROMPTS, SpecialistAnalysisResponse, classifyDocument() (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (14): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (13): 0b02af7 ⚡ Bolt: Optimize date parsing in sort comparators, 33c2695 fix(wearable-sync): update existing test mocks with subscribeToLatestTelemetry, 5fdde1b perf(reporthistory): replace redundant sort with reverse, 724215a Merge pull request #196 from dhurianiket/bolt-date-parsing-optimization-5165813967283112652, d97e7a9 Merge pull request #183 from dhurianiket/bolt/optimize-redundant-sort-6088375815037320292, e69b18b docs: update CURRENT_STATE.md for wearable Firestore sync milestone (XIX), useProfile(), LabTrendChartProps (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (11): extractClinicalEntities(), ExtractedClinicalEntities, VoiceService, VoiceServiceOptions, ChatCoachProps, getAI(), streamGenerate(), Type (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (21): 0863013 Merge PR 215: 🎨 Palette: Add aria-labels to icon-only buttons, 0cccfb6 Merge pull request #214 from dhurianiket/bolt-optimize-date-parsing-2095263978117173248, 1387585 Merge PR 223: 🎨 Palette: Add keyboard focus indicators to lab report buttons, 14a61c2 Merge PR 216: ⚡ Bolt: [performance improvement] Optimize date parsing sort in VisualLabReportCard, 2945c4b Merge PR 225: 🎨 Palette: [UX improvement] Add aria-labels to SecurityAuditViewer buttons, 37a06ea Add aria-label to icon-only close buttons in modals, 4faea42 Merge remote-tracking branch 'origin/sentinel/add-input-validation-server-16290129917808450155', 56069d7 Merge PR 217: 🛡️ Sentinel: [MEDIUM] Fix missing input validation on user data (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (15): AbdmScanShareModal(), AbdmScanShareModalProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, c7830ba feat(pillar-1): implement ABDM OPD Scan & Share, 10+ Regional Language Audio & SNOMED CT Mapper, RegionalAudioPlayer(), RegionalAudioPlayerProps (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (12): getPatientContext(), analyzeSharedRisks(), GeneticRiskAnalysis, f075e77 feat(ai): integrate live wearable telemetry into clinical AI patient context service, ChatMessage, ChatRole, Conversation, PatientContext (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (17): a87820d feat(pillar-4): implement WebCrypto Zero-Knowledge Vault & Immutable SHA-256 Security Audit Trail, AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent(), SecurityAuditRecord (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (15): Toast, ToastContext, ToastContextType, ToastProvider(), ToastType, useToast(), checkCanUploadReport(), getUserSubscription() (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (13): PricingModalProps, 1a238e0 feat(monetization): implement B2C & B2B Razorpay pricing plans, usage limit enforcement, and interactive checkout modal, 6248211 docs: update CURRENT_STATE.md with Snapshot XXXVIII Apple and Google Health sync engine, 8dc18e5 docs: update CURRENT_STATE.md with Snapshot XXXIX monetization release, e5cb548 feat(admin-access): grant dhurianiket@gmail.com master access & add AEGIS100 100-user 1-month launch coupon, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon() (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): CalendarEvent, 04542bb feat(a11y): add aria-label and focus states to CycleTrackingWidget Settings button, 2eff559 docs: update CURRENT_STATE.md with Snapshot XXXVII, 690b2af Merge pull request #186 from dhurianiket/palette/a11y-cycle-tracking-widget-5743654541532804775, 9debfe4 Merge pull request #185 from dhurianiket/jules-phi-leakage-fix-16042077112561976483, bff1ad4 fix: wrap sensitive console logs with environment checks, AuthContextType, AuthProvider() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (15): 07a7557 feat(landing): elevate Landing Page with ultra-premium 3D glassmorphism, glowing typography gradients, and state-of-the-art visual design, 0f97ca4 docs: update CURRENT_STATE.md with Snapshot XXXII How It Works redesign, 329b9ad test: align theme typography stress test assertion with high contrast textarea styles, 788ce96 refactor: memoize expensive array mapping in Dashboard, 8519880 docs: update CURRENT_STATE.md with Snapshot XXXIII Landing Page 3D glassmorphic redesign, 9612e17 release: bump application version to v2.0.0 and enforce graphify context rule, ac7c613 chore: ignore graphify-out knowledge graph build artifacts, e4408a3 Merge pull request #184 from dhurianiket/bolt-dashboard-optimization-11590176005061791133 (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (15): 0b5c375 docs: finalize Victory Audit verification handoff (57 test suites, 565 tests passing, 100% clean build), 30e36d8 fix(security): resolve root and functions vulnerabilities, synchronize package-lock.json files, update graphify AST, 66458d2 fix(tests): use getAllByText in InteractionMatrix.test.tsx for element matching, 6f498d3 feat(3d-hologram-model): overhaul 3D Holographic Body Scanner with high-fidelity translucent anatomical model & spatial hologram platform, 7183464 docs: update CURRENT_STATE.md with Snapshot LVI multi-agent verification summary, 7847ab4 fix(tests): update title in HolographicBodyScanner.tsx to match test regex, 800c537 Merge pull request #203 from dhurianiket/bolt-correlation-matrix-optimization-9970654191168527559, 8c5a252 feat(ui): complete overhaul of 3D Holographic Body Scanner with multi-layer SVG anatomy, physiological animations, rotating base rings, and cyber HUD biometrics (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (8): 1a6172b feat(ui-ux): add global ThemeContext light/dark mode sync & fix text readability contrast (WCAG AA), 9027bf2 feat(ui-ux): site-wide light/dark mode theme sync & WCAG AA contrast polish across all components, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), rootElement

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (17): 3b0df16 Merge PR 220: Fix insecure randomness in ABDM service, f97bcaf Fix insecure randomness in ABDM service, AbdmAuthMode, AbdmAuthResponse, AbhaProfile, AccessMode, CareContext, CareContextType (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (10): AuthContext, Profile, ProfileContext, ProfileContextType, ProfileProvider(), UserProfile, mockAuthContextValue, mockProfileContextValue (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (10): LabCardData, MasonryLabCardsProps, AutoSizeTextareaProps, cache, measureHeight(), measureLines(), measureWidth(), prepareText() (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (11): ChatMessage, VirtualizedChatListProps, renderCitationLink(), buildGuidelinePromptAugmentation(), CLINICAL_GUIDELINES, ClinicalGuideline, lookupRelevantGuidelines(), MedicalSource (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (13): 0cc07d9 Add keyboard focus states to BottomSheet nav items, 12f827e Merge pull request #190 from dhurianiket/sentinel/fix-math-random-id-2172922096459184170, 1725d0f Merge pull request #192 from dhurianiket/palette/appnav-focus-states-14077769143390987877, 24e3f65 ⚡ Bolt: Optimize labHistory sorting with Schwartzian transform, 57cabea Merge pull request #194 from dhurianiket/bolt-optimize-timeline-sort-16433978497707150647, 8a96d1b perf: extract trends sorting to useMemo in Timeline, 8dcd75e Merge pull request #193 from dhurianiket/bolt-gemini-sort-optimization-5427309086640202675, 8e65a94 Merge pull request #195 from dhurianiket/palette-focus-visible-dashboard-2416701932977582511 (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): 33a2694 Merge pull request #187 from dhurianiket/palette-focus-rings-9512996096297832596, 5f86e69 perf: optimize search filter loop in LabReportsSection, 93fd7d4 Add keyboard focus styles to icon-only close buttons, bb297c7 Merge pull request #188 from dhurianiket/bolt/optimize-lab-reports-search-14797524277834754908, f622d7c docs: record Snapshot XLIV — 3D glassmorphic health sync redesign with permission toggles, drag-drop, enhanced parsing, ReportComparisonProps, BottomSheetProps, NotificationCenterProps (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (7): fb34bcf feat(teamwork): complete comprehensive clinical AI features, 3D glassmorphic styling, and empirical stress test suite, HeroMetric(), HeroMetricProps, mockGenerateContent, mockGenerateContentStream, MOCK_PROFILE, MOCK_USER

### Community 34 - "Community 34"
Cohesion: 0.24
Nodes (13): 119bbec Merge remote-tracking branch 'origin/bolt-optimize-historical-values-sort-8610816908347628216', 27cb726 Merge remote-tracking branch 'origin/bolt/optimize-visual-lab-report-card-history-16106325536300056041', 3604be1 perf: apply schwartzian transform to history sorting, a438e61 refactor(performance): optimize historical lab report lookup with useMemo map, d04a621 feat(3d-hologram-visual-reports): implement 3D Holographic Body Scanner & Visual Biomarker Safety Meters, BiomarkerSparkline(), FourZoneRangeBar(), getPlainEnglishSummary() (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (9): 194726a docs: record Snapshot XLV release for FHIR R4 & ABDM ABHA Gateway, 235fb43 feat(fhir-abdm): implement FHIR R4 bundle exporter, ABDM ABHA Gateway simulator, and 3D glassmorphic card refinements, 319410f feat(clinical-standards): complete FHIR R4 JSON Exporters, RxNav/OpenFDA Pharmacology Matrix, ABDM ABHA Gateway Hub, and 3D Glassmorphic UI polish, DateRange, ExportModalProps, downloadFHIRBundle(), downloadFhirJson(), exportToCSV() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.24
Nodes (12): 2b0eef5 fix(analytics): resolve Google Analytics GA4 & GTM tracking for Single Page Application (SPA) routes and events, 32246c5 feat(analytics): integrate GA4 Measurement Protocol API secret aegisanalytic (7_vWiTUqR8yMwi7YZ-NglA) for backend telemetry, d4a9f84 fix(analytics): enable standard GA4 data collection on initial page load to resolve stream inactive status, db80099 security(analytics): sanitize Measurement Protocol secret loading to environment variables and prevent bundling secrets in frontend JavaScript, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (11): BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectory, computeBiomarkerTrajectory(), evaluateRiskLevel(), fitLinearRegression(), ForecastWindow, HistoricalPoint (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (10): checkLabResultForAlerts(), DEFAULT_THRESHOLDS, getConsolidatedAlerts(), AlertContextType, AlertSeverity, AlertThreshold, AlertType, HealthAlert (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (12): 109a2d8 Merge pull request #207 from dhurianiket/bolt/short-circuit-array-filtering-13179201463970398894, 1f4d278 perf: short-circuit array filtering in ReportHistory and LabReportsSection, 815948a perf: memoize redundant lab values count reduction in UploadCenter, 8a7f11c feat: Add keyboard navigation focus styles to AppNav buttons, 9159ad4 Merge pull request #209 from dhurianiket/bolt/memoize-upload-reduce-286324318131671775, b8d1f41 Merge pull request #208 from dhurianiket/palette/appnav-focus-rings-14606812323672119005, cc83c13 perf(reports): optimize array filtering in useMemo loops, ALL_DESKTOP_TABS (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.26
Nodes (8): 272ec47 feat(pillar-2): implement 30-60-90 Day Risk Trajectory Engine & 3D Interactive Organ Health Avatar, OrganHealthAvatarProps, calculateOrganSystemScores(), LabObservationItem, OrganHealthOverview, OrganHealthStatus, OrganSystemKey, OrganSystemScore

### Community 41 - "Community 41"
Cohesion: 0.23
Nodes (10): 57fefa6 feat(graphify): update knowledge graph & CURRENT_STATE.md with Pillar 2 nodes (1,220 nodes, 3,057 edges, 96 communities), 6a0f5ab docs: record Snapshot LII in CURRENT_STATE.md, e38e912 feat(pillar-3): implement Food-Drug Contraindication Matrix & 1-Page Printable Doctor OPD Consultation PDF, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrixProps, DetectedFoodInteraction, evaluateFoodInteractions(), FOOD_RULES (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (6): AlertsContext, AlertsContextType, AlertsProvider(), useAlerts(), NotificationCategory, NotificationDropdownProps

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (1): InfoPageLayoutProps

### Community 44 - "Community 44"
Cohesion: 0.35
Nodes (10): getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackStorageUsage(), trackUsage(), updateGlobalStats() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.26
Nodes (9): formatContextForPrompt(), CachedReport, FirestoreErrorInfo, generateSourceHash(), getCachedReport(), handleFirestoreError(), OperationType, saveCachedReport() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (6): DEFAULT_CENTER, PlaceMarker, 376c82d docs: update CURRENT_STATE.md with Snapshot XXVI 13-tab accessibility audit, 55513e6 fix(accessibility): resolve WCAG AA contrast for light-mode warning tokens, amber badges, and status delta indicators, 5fe6da2 fix(contrast): resolve all remaining low contrast text classes across CareMap, CalendarSync, MasonryLabCards, TrendSparklines, ProfileManagement, and Timeline, TrendSparklinesProps

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (8): 0531e0c 🎨 Palette: [Accessibility improvements], 1a79d8c Merge pull request #198 from dhurianiket/palette-ux-improvements-14009109037605028381, bdd1404 Merge pull request #205 from dhurianiket/palette/disabled-tooltips-3132111819375758759, c3aac85 🎨 Palette: Add hover titles to disabled buttons, d3b5918 Merge pull request #199 from dhurianiket/bolt-optimize-filter-sets-9452934895080612040, d88c046 feat(ui): add aria-labels and focus states to dashboard buttons, df57864 Merge pull request #197 from dhurianiket/palette-a11y-dashboard-buttons-17849235882835041170, fa8603d perf(dashboard): extract static arrays to Sets for O(1) filtering

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (7): 06a2db1 docs: update CURRENT_STATE.md with Snapshot XXXVI, 0b8e7af feat(landing): redesign How It Works page with interactive 4-step workflow showcase, Apple-inspired 3D glassmorphism, and crisp typography, 49ae0b4 fix(ci): update Node.js actions to v4, add FORCE_JAVASCRIPT_ACTIONS_TO_NODE20, and increase smoke test timeouts, 5d23629 fix(ci): target direct Firebase Hosting endpoint to bypass Cloudflare bot challenge on headless CI runners, 6d39262 fix(ci): add CDN propagation delay and filter third-party network noise in Playwright smoke test, 985a8cc docs: update CURRENT_STATE.md with Snapshot XXXI, fdaa95d fix(theme): configure Tailwind v4 custom dark variant and force high-contrast text rules in dark mode

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (1): RegionalVoiceService

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (6): 3af7cb6 Merge pull request #181 from dhurianiket/palette/a11y-profile-management-15703925130740763613, 3e8fa9a 🎨 Palette: [UX improvement] Improve accessibility of Profile Management buttons, auth, isRequired(), validateProfileName(), Gender

### Community 51 - "Community 51"
Cohesion: 0.31
Nodes (7): DRUG_INTERACTIONS, InteractionRule, isDuplicateClass(), isMedInCategory(), MED_CATEGORIES, checkMedicationInteractions(), MedicationStatus

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (8): 2d614dd Merge pull request #201 from dhurianiket/bolt/optimize-upload-filter-896614611142847168, 792000d 🛡️ Sentinel: [HIGH] Fix XSS vulnerability in PDF Generation, a4991f2 Merge pull request #202 from dhurianiket/sentinel-fix-pdf-xss-11065736594836799695, a995a45 fix(ui-responsive): fix Dashboard layout grid compression and refine mobile-responsive 3D glassmorphism, de2386e refactor: short-circuit array filter logic for UploadCenter search, escapeHtml(), exportOpdConsultationPdf(), OpdPdfInputData

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (4): Component, ErrorBoundary, Props, State

### Community 55 - "Community 55"
Cohesion: 0.36
Nodes (8): 2939618 🛡️ Sentinel: Fix insecure randomness in auditLogService, 5572b6f Merge pull request #211 from dhurianiket/sentinel-fix-audit-log-id-8306300698070896645, 8465af8 ⚡ Bolt: Optimize date parsing in sort comparator using Schwartzian transform, a68e2e5 Merge pull request #212 from dhurianiket/palette/focus-visible-settings-14773763513275308991, b2329a3 🛡️ Sentinel: [CRITICAL] Fix privilege escalation in firestore rules, b859df5 Merge pull request #213 from dhurianiket/sentinel/fix-firestore-privilege-escalation-15940020795618893858, df9ac7f Add keyboard focus visibility to settings buttons, fa09cb6 Merge pull request #210 from dhurianiket/bolt-optimize-array-filter-12301290249497449695

### Community 56 - "Community 56"
Cohesion: 0.36
Nodes (6): 2f5b70c Merge pull request #200 from dhurianiket/sentinel-fix-stack-trace-6159085393350306254, 39c2534 fix: remove stack trace from error response in logger, 81b0bc9 docs: record Snapshot XLVIII — CSP fix for GA4 data collection, logger, Props, State

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (4): Component, Props, SectionErrorBoundary, State

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (3): 7ff7d21 feat(ui-ux-3d): implement Apple-inspired 3D glassmorphic design system overhaul & canvas particle mesh, Particle, Hero3DHealthGaugeProps

### Community 59 - "Community 59"
Cohesion: 0.40
Nodes (4): FORBIDDEN_PHRASES, MANDATORY_DISCLAIMERS, runSafetyCheck(), SafetyCheckResult

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (2): AIErrorBoundary, Component

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (2): ComparativeAnalysisProps, LabStatus

### Community 62 - "Community 62"
Cohesion: 0.40
Nodes (2): Component, GlobalErrorBoundary

### Community 63 - "Community 63"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (3): 218454d fix(test): update App smoke test text matcher for 100% test suite pass, 41759fe docs: record Snapshot LI in CURRENT_STATE.md, eb2fca5 feat(graphify): update codebase knowledge graph with Pillar 1 AST nodes (1,191 nodes, 3,008 edges, 91 communities)

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (2): MedicalSafetyBannerProps, SafetyLevel

### Community 69 - "Community 69"
Cohesion: 0.67
Nodes (1): SplashScreenProps

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (1): LoadingSpinnerProps

### Community 71 - "Community 71"
Cohesion: 0.67
Nodes (2): __dirname, __filename

### Community 72 - "Community 72"
Cohesion: 1.00
Nodes (1): http

### Community 73 - "Community 73"
Cohesion: 1.00
Nodes (1): http

### Community 76 - "Community 76"
Cohesion: 1.00
Nodes (1): content

## Knowledge Gaps
- **280 isolated node(s):** `http`, `http`, `https_1`, `app_1`, `https_1` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 43`** (1 nodes): `InfoPageLayoutProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `RegionalVoiceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `AIErrorBoundary`, `Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `ComparativeAnalysisProps`, `LabStatus`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `Component`, `GlobalErrorBoundary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `MedicalSafetyBannerProps`, `SafetyLevel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `SplashScreenProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `LoadingSpinnerProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `__dirname`, `__filename`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 23` to `Community 9`, `Community 2`, `Community 15`, `Community 7`, `Community 22`, `Community 42`, `Community 28`, `Community 6`, `Community 10`, `Community 13`, `Community 32`, `Community 1`, `Community 8`, `Community 39`, `Community 0`, `Community 43`, `Community 24`, `Community 18`, `Community 26`, `Community 30`, `Community 3`, `Community 21`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `RegionalVoiceService` connect `Community 49` to `Community 17`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `http`, `http`, `https_1` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08605769230769231 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._