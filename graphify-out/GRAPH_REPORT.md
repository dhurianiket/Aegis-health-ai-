# Graph Report - .  (2026-09-26)

## Corpus Check
- 308 files · ~282,433 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1465 nodes · 3853 edges · 89 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 947 · contains: 886 · imports_from: 672 · MODIFIES: 527 · PARENT_OF: 309 · ON_BRANCH: 264 · calls: 191 · method: 37 · inherits: 12 · re_exports: 8


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 308 · Candidates: 336
- Excluded: 0 untracked · 49256 ignored · 4 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `e473dfb`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 37 edges
2. `handleFirestoreError()` - 27 edges
3. `useProfile()` - 23 edges
4. `LabResult` - 22 edges
5. `WearableBiometrics` - 21 edges
6. `UserProfile` - 18 edges
7. `parseSafeTimestamp()` - 18 edges
8. `db` - 17 edges
9. `exportToFhirBundle()` - 16 edges
10. `getDocuments()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 0 → community 1_
- `025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges` --PARENT_OF--> `f622d7c docs: record Snapshot XLIV — 3D glassmorphic health sync redesign with permission toggles, drag-drop, enhanced parsing`  [EXTRACTED]
  git → git  _Bridges community 0 → community 49_
- `03511c4 fix(security): bump vitest to 4.1.11 resolving CVE-2026-84373 path traversal` --PARENT_OF--> `1497fcb fix(security): harden firestore rules, storage limits, csp headers, and url sanitization`  [EXTRACTED]
  git → git  _Bridges community 1 → community 75_
- `0531e0c 🎨 Palette: [Accessibility improvements]` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 53 → community 1_
- `05d41a9 feat(graphify): update knowledge graph with Pillar 3 nodes (1,235 nodes, 3,081 edges, 98 communities)` --PARENT_OF--> `a87820d feat(pillar-4): implement WebCrypto Zero-Knowledge Vault & Immutable SHA-256 Security Audit Trail`  [EXTRACTED]
  git → git  _Bridges community 1 → community 19_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (66): buildCoachPromptAugmentation(), CoachResponse, getCoachResponse(), WearableCoachWidgetProps, 025a577 feat(health-sync): 3D glassmorphic redesign, permission toggles, drag-drop file import, enhanced XML/JSON parsing, sleep architecture inputs, live connection badges, 0cf9961 fix(health-sync): resolve Apple & Google Health sync state persistence and fix Apple Health banner styling, 0e21ec0 fix(ui-ux): enhance text readability, accessibility contrast (WCAG AA), and remove mock demo telemetry buttons, 2f420cb feat(integrations): implement Apple Health (HealthKit) and Google Health Connect live synchronization engine and file importers (+58 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (45): main, 03511c4 fix(security): bump vitest to 4.1.11 resolving CVE-2026-84373 path traversal, 05d41a9 feat(graphify): update knowledge graph with Pillar 3 nodes (1,235 nodes, 3,081 edges, 98 communities), 08633f7 ⚡ Bolt: [performance improvement] Optimize global stats aggregation, 09898fa feat(landing): showcase India pricing plans & AEGIS100 1-month free trial promo banner, 0b5c375 docs: finalize Victory Audit verification handoff (57 test suites, 565 tests passing, 100% clean build), 0f3d105 docs: update CURRENT_STATE.md with Snapshot XXVII Aura AI Chat contrast fix, 1529b26 fix(security): add Google Analytics GA4 & GTM domains to Content-Security-Policy to unblock analytics data collection (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (31): AboutUs, AdminDashboard, BlogCBC, BlogHbA1c, CalendarSync, CareMap, ChatCoach, ConsentScreen (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (22): ALLOWED_ORIGINS, ALLOWED_TURNSTILE_HOSTNAMES, base64UrlToUint8Array(), Env, fetch(), getCorsHeaders(), getGooglePublicKeys(), parseJwtParts() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (29): ClinicalSummaryRecord, deleteDocumentRecord(), FirestoreErrorInfo, getActiveReferrals(), getAllSpecialistChats(), getClinicalSummary(), getCoachChat(), getConversations() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (26): BEDROCK_MODELS, BedrockConverseParams, BedrockConverseResponse, BedrockError, BedrockInferenceConfig, BedrockMessage, BedrockMessageContent, BedrockModelKey (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (23): AbdmConnectModalProps, 319410f feat(clinical-standards): complete FHIR R4 JSON Exporters, RxNav/OpenFDA Pharmacology Matrix, ABDM ABHA Gateway Hub, and 3D Glassmorphic UI polish, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), disconnectAbdm(), discoverCareContexts(), formatAbhaNumber() (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (25): 194726a docs: record Snapshot XLV release for FHIR R4 & ABDM ABHA Gateway, 235fb43 feat(fhir-abdm): implement FHIR R4 bundle exporter, ABDM ABHA Gateway simulator, and 3D glassmorphic card refinements, convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), downloadFHIRBundle(), downloadFhirJson(), exportToFhirBundle() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (23): 54af24c fix(security): enforce custom-claims-only admin rules, remove X-Aegis-Shared-Bearer leak, and eliminate window.__aegisAuth, 5cf780b fix: prefer edge shared bearer so Aura auth matches Worker (#253), 610cf9f fix(security): resolve external security audit findings and improve specialist lounge, AegisAI, buildEdgeBody(), callEdgeGenerate(), callEdgeWithPoPRetry(), EdgeChatCreateParams (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (25): 57ae70e feat(abdm): add Data Provenance Receipt card and DPDP Act 2023 Paediatric Privacy mode, DEFAULT_CARE_CONTEXTS, DEFAULT_CONSENT_REQUESTS, downloadProvenanceReceiptJson(), generateDataProvenanceReceipt(), revokeAndWipeCareContext(), mockCreateProfile, mockDeleteProfile (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (26): 0cccfb6 Merge pull request #214 from dhurianiket/bolt-optimize-date-parsing-2095263978117173248, 119bbec Merge remote-tracking branch 'origin/bolt-optimize-historical-values-sort-8610816908347628216', 1387585 Merge PR 223: 🎨 Palette: Add keyboard focus indicators to lab report buttons, 14a61c2 Merge PR 216: ⚡ Bolt: [performance improvement] Optimize date parsing sort in VisualLabReportCard, 27cb726 Merge remote-tracking branch 'origin/bolt/optimize-visual-lab-report-card-history-16106325536300056041', 2945c4b Merge PR 225: 🎨 Palette: [UX improvement] Add aria-labels to SecurityAuditViewer buttons, 2c62e81 chore(graphify): refresh knowledge graph and test environment configurations, 3604be1 perf: apply schwartzian transform to history sorting (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (21): becbaba style(apple-design): enhance dark mode surface contrast, typography legibility, and Recharts tick visibility per Apple HIG, ATTENTION_STATUSES, BiomarkerTrajectoryWidget, Canvas3DMesh, ComparativeAnalysis, CorrelationMatrix, CycleTrackingWidget, EmptyDashboard (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (17): SharedProfileProps, app, db, firebaseConfig, getDynamicAuthDomain(), googleProvider, sanitizeDomain(), storage (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (19): 815948a perf: memoize redundant lab values count reduction in UploadCenter, 9159ad4 Merge pull request #209 from dhurianiket/bolt/memoize-upload-reduce-286324318131671775, Toast, ToastContext, ToastContextType, ToastProvider(), ToastType, useToast() (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (24): analyzeWithSpecialist(), ExtractedReportResponse, extractMedicalReports(), generateClinicalSummary(), SAFETY_GUARDRAIL(), SPECIALIST_PROMPTS, SpecialistAnalysisResponse, classifyDocument() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (14): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (15): analyzeSharedRisks(), GeneticRiskAnalysis, 3af7cb6 Merge pull request #181 from dhurianiket/palette/a11y-profile-management-15703925130740763613, 3e8fa9a 🎨 Palette: [UX improvement] Improve accessibility of Profile Management buttons, calculateAge(), createPaediatricConsent(), getPaediatricSafetyNotice(), isMinor() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (11): INDIAN_LANGUAGES, IndianLanguageOption, RegionalVoiceService, SpeechState, c7830ba feat(pillar-1): implement ABDM OPD Scan & Share, 10+ Regional Language Audio & SNOMED CT Mapper, RegionalAudioPlayer(), RegionalAudioPlayerProps, getSnomedCoding() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (18): DEFAULT_CENTER, getStoredMapsKey(), GOOGLE_MAPS_LIBRARIES, PlaceMarker, 0c43c0c fix(a11y, caremap): add aria-labels to search inputs and pre-declare Google Maps libraries, 123f7b1 fix(caremap): resolve map container height collapse and set default anchor to Mumbai, 2d1d461 sec(caremap, auth): eliminate client API key inputs, purge localStorage, and enforce ephemeral token isolation, 55513e6 fix(accessibility): resolve WCAG AA contrast for light-mode warning tokens, amber badges, and status delta indicators (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (17): a87820d feat(pillar-4): implement WebCrypto Zero-Knowledge Vault & Immutable SHA-256 Security Audit Trail, AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent(), SecurityAuditRecord (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (14): COLORS, 0d693bd feat(admin): enable live CMS telemetry, real-time sync, auth backfill, and deploy firestore rules, eb133af docs: document Snapshot LXXIV in CURRENT_STATE.md, getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (15): formatContextForPrompt(), getPatientContext(), 0cb5158 feat(ai): establish cross-agent clinical context bus and inter-agent referral protocol, f075e77 feat(ai): integrate live wearable telemetry into clinical AI patient context service, getMedications(), ChatMessage, ChatRole, ClinicalReferral (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (15): ChatCoachProps, 18ac6c1 fix(ai): normalize systemInstruction schema and enhance empathetic edge error handling, a021fb8 fix(auth): purge SPA shared bearer, rotate edge secret, deploy claims-only rules, b10ff84 docs: update CURRENT_STATE.md with Snapshot LXV for PR #248, #249, #250 harmonization, b2ec26d fix(specialists): resolve Anycast PoP location restrictions with smart placement and auto-retry, c3f9988 fix(ai): migrate gemini 2.5 fallbacks to gemini 3 series ahead of retirement deadline, d7c260c feat: route SPA Gemini through Cloudflare edge proxy (#250), faabdd4 fix: harden edge Gemini client and safety guardrail (#252) (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (16): 17aaaf5 fix: harden secrets hygiene and deploy supply chain (#249), 2b0eef5 fix(analytics): resolve Google Analytics GA4 & GTM tracking for Single Page Application (SPA) routes and events, 32246c5 feat(analytics): integrate GA4 Measurement Protocol API secret aegisanalytic (7_vWiTUqR8yMwi7YZ-NglA) for backend telemetry, d4a9f84 fix(analytics): enable standard GA4 data collection on initial page load to resolve stream inactive status, db80099 security(analytics): sanitize Measurement Protocol secret loading to environment variables and prevent bundling secrets in frontend JavaScript, getGaApiSecret(), getOrCreateClientId(), MeasurementProtocolEvent (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (7): fb34bcf feat(teamwork): complete comprehensive clinical AI features, 3D glassmorphic styling, and empirical stress test suite, HeroMetric(), HeroMetricProps, DateRange, ExportModalProps, MOCK_PROFILE, MOCK_USER

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (14): RemindersContext, RemindersContextType, RemindersProvider(), RemindersWidgetProps, checkAppointmentsForReminders(), createReminder(), generateRemindersFromAlerts(), getUpcomingReminders() (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (17): AdverseEventReaction, BlackBoxWarning, cacheOpenFdaSummary(), cacheRxCuiMatch(), cleanDrugQuery(), ClinicalCitation, CURATED_FDA_KNOWLEDGE_BASE, CURATED_RXCUI_REGISTRY (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (13): PricingModalProps, 1a238e0 feat(monetization): implement B2C & B2B Razorpay pricing plans, usage limit enforcement, and interactive checkout modal, 6248211 docs: update CURRENT_STATE.md with Snapshot XXXVIII Apple and Google Health sync engine, 8dc18e5 docs: update CURRENT_STATE.md with Snapshot XXXIX monetization release, e5cb548 feat(admin-access): grant dhurianiket@gmail.com master access & add AEGIS100 100-user 1-month launch coupon, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (8): 1a6172b feat(ui-ux): add global ThemeContext light/dark mode sync & fix text readability contrast (WCAG AA), 9027bf2 feat(ui-ux): site-wide light/dark mode theme sync & WCAG AA contrast polish across all components, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), rootElement

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (14): 330d3cf ⚡ Bolt: [performance improvement] Hoist static map out of sort comparator (#244), 4aecec9 feat(ui): improve mobile and desktop experience with modern web standards and apple design tokens, 8a96d1b perf: extract trends sorting to useMemo in Timeline, a0a1456 Merge pull request #191 from dhurianiket/bolt-timeline-memoize-6929532212876387996, SEVERITY_MAP, TYPE_CONFIG, LabObservation, compareReports() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): FhirAddress, FhirAttachment, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint, FhirDocumentReferenceContent (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (9): Component, ErrorBoundary, Props, State, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, SPECIALISTS_SHOWCASE (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (10): LabCardData, MasonryLabCardsProps, AutoSizeTextareaProps, cache, measureHeight(), measureLines(), measureWidth(), prepareText() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (11): 0b02af7 ⚡ Bolt: Optimize date parsing in sort comparators, 109a2d8 Merge pull request #207 from dhurianiket/bolt/short-circuit-array-filtering-13179201463970398894, 1f4d278 perf: short-circuit array filtering in ReportHistory and LabReportsSection, 33c2695 fix(wearable-sync): update existing test mocks with subscribeToLatestTelemetry, 5fdde1b perf(reporthistory): replace redundant sort with reverse, 724215a Merge pull request #196 from dhurianiket/bolt-date-parsing-optimization-5165813967283112652, cc83c13 perf(reports): optimize array filtering in useMemo loops, d97e7a9 Merge pull request #183 from dhurianiket/bolt/optimize-redundant-sort-6088375815037320292 (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (12): 443b45e Merge pull request #182 from dhurianiket/bolt/single-forward-pass-9005716069439111533, 847dc13 perf: optimize date parsing loops in form and context processing, 9955381 merge: PR #242 ⚡ Bolt: Optimize date parsing across form response processors, a064be0 refactor: Replace .sort()[0] with single forward pass, a2dae84 chore(graphify): update AST knowledge graph after PR #242 merge, SYMPTOMS_LIST, useClinicalContext(), FormMetadata (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (12): 45bd982 merge main into pr-242, 8a7f11c feat: Add keyboard navigation focus styles to AppNav buttons, b65d2ca fix(deploy): resolve cloud functions buildpack pnpm issue and apply apple design polish, b8d1f41 Merge pull request #208 from dhurianiket/palette/appnav-focus-rings-14606812323672119005, ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (10): CalendarEvent, 218454d fix(test): update App smoke test text matcher for 100% test suite pass, 41759fe docs: record Snapshot LI in CURRENT_STATE.md, 9debfe4 Merge pull request #185 from dhurianiket/jules-phi-leakage-fix-16042077112561976483, bff1ad4 fix: wrap sensitive console logs with environment checks, eb2fca5 feat(graphify): update codebase knowledge graph with Pillar 1 AST nodes (1,191 nodes, 3,008 edges, 91 communities), AuthContextType, AuthProvider() (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (12): 30e36d8 fix(security): resolve root and functions vulnerabilities, synchronize package-lock.json files, update graphify AST, 6f498d3 feat(3d-hologram-model): overhaul 3D Holographic Body Scanner with high-fidelity translucent anatomical model & spatial hologram platform, 7847ab4 fix(tests): update title in HolographicBodyScanner.tsx to match test regex, 800c537 Merge pull request #203 from dhurianiket/bolt-correlation-matrix-optimization-9970654191168527559, 8c5a252 feat(ui): complete overhaul of 3D Holographic Body Scanner with multi-layer SVG anatomy, physiological animations, rotating base rings, and cyber HUD biometrics, dd6a99f ⚡ Bolt: Optimize array math aggregations in calculateCorrelation, eb411b6 fix(tests): align heartRate text node in HolographicBodyScanner.tsx for 100% test compatibility, CorrelationMatrixProps (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.23
Nodes (8): SBARPreviewProps, exportToPDF(), generateDoctorReport(), generateTrendNarrative(), LabObservation, SBAROutput, TrendSummary, ExportButtonProps

### Community 39 - "Community 39"
Cohesion: 0.21
Nodes (12): InteractionMatrixProps, OpenFdaAdverseEventSummary, BioRegimenSafetySummary, buildBioRegimenSafetySummary(), DRUG_CATEGORIES, DrugLabContraindication, evaluateDrugLabContraindications(), isMedInCategory() (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (10): 272ec47 feat(pillar-2): implement 30-60-90 Day Risk Trajectory Engine & 3D Interactive Organ Health Avatar, 57fefa6 feat(graphify): update knowledge graph & CURRENT_STATE.md with Pillar 2 nodes (1,220 nodes, 3,057 edges, 96 communities), 6a0f5ab docs: record Snapshot LII in CURRENT_STATE.md, OrganHealthAvatarProps, calculateOrganSystemScores(), LabObservationItem, OrganHealthOverview, OrganHealthStatus (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (11): BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectory, computeBiomarkerTrajectory(), evaluateRiskLevel(), fitLinearRegression(), ForecastWindow, HistoricalPoint (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (1): InfoPageLayoutProps

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (10): checkLabResultForAlerts(), DEFAULT_THRESHOLDS, getConsolidatedAlerts(), AlertContextType, AlertSeverity, AlertThreshold, AlertType, HealthAlert (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (6): ChatMessage, VirtualizedChatListProps, renderCitationLink(), HighlightMatch(), MOCK_PROFILE, MOCK_USER

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (10): 0cc07d9 Add keyboard focus states to BottomSheet nav items, 1725d0f Merge pull request #192 from dhurianiket/palette/appnav-focus-states-14077769143390987877, 24e3f65 ⚡ Bolt: Optimize labHistory sorting with Schwartzian transform, 57cabea Merge pull request #194 from dhurianiket/bolt-optimize-timeline-sort-16433978497707150647, 8dcd75e Merge pull request #193 from dhurianiket/bolt-gemini-sort-optimization-5427309086640202675, 8e65a94 Merge pull request #195 from dhurianiket/palette-focus-visible-dashboard-2416701932977582511, be18306 Replace focus with focus-visible on dashboard cards, ffdba29 perf(timeline): extract severity map from sort comparator (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (6): AuthContext, ProfileContext, mockAuthContextValue, mockProfileContextValue, mockAuthContextValue, mockProfileContextValue

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (8): useAuth(), Profile, ProfileContextType, ProfileProvider(), useProfile(), UserProfile, LabTrendChartProps, getDocuments()

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (13): 07a7557 feat(landing): elevate Landing Page with ultra-premium 3D glassmorphism, glowing typography gradients, and state-of-the-art visual design, 0b8e7af feat(landing): redesign How It Works page with interactive 4-step workflow showcase, Apple-inspired 3D glassmorphism, and crisp typography, 0f97ca4 docs: update CURRENT_STATE.md with Snapshot XXXII How It Works redesign, 2fa6cba docs: update CURRENT_STATE.md with Snapshot XXX mobile optimization, 43ed290 docs: update CURRENT_STATE.md with Snapshot XXIX, 49ae0b4 fix(ci): update Node.js actions to v4, add FORCE_JAVASCRIPT_ACTIONS_TO_NODE20, and increase smoke test timeouts, 49ce22f fix(aura-ai): enforce pitch dark slate bubbles with crisp white text in ChatCoach to eliminate white-on-white text, 788ce96 refactor: memoize expensive array mapping in Dashboard (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.21
Nodes (7): 33a2694 Merge pull request #187 from dhurianiket/palette-focus-rings-9512996096297832596, 93fd7d4 Add keyboard focus styles to icon-only close buttons, f622d7c docs: record Snapshot XLIV — 3D glassmorphic health sync redesign with permission toggles, drag-drop, enhanced parsing, ReportComparisonProps, SBARPreviewProps, NotificationCenterProps, SBARSummary

### Community 50 - "Community 50"
Cohesion: 0.24
Nodes (9): e38e912 feat(pillar-3): implement Food-Drug Contraindication Matrix & 1-Page Printable Doctor OPD Consultation PDF, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, DetectedFoodInteraction, evaluateFoodInteractions(), FOOD_RULES, FoodContraindicationRule (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.35
Nodes (9): d04a621 feat(3d-hologram-visual-reports): implement 3D Holographic Body Scanner & Visual Biomarker Safety Meters, BiomarkerSparkline(), FourZoneRangeBar(), getPlainEnglishSummary(), LabObservationItem, LabReport, PLAIN_ENGLISH_EXPLANATIONS, VisualLabReportCard() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (9): auth, CachedReport, FirestoreErrorInfo, generateSourceHash(), getCachedReport(), handleFirestoreError(), OperationType, saveCachedReport() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (8): 0531e0c 🎨 Palette: [Accessibility improvements], 1a79d8c Merge pull request #198 from dhurianiket/palette-ux-improvements-14009109037605028381, bdd1404 Merge pull request #205 from dhurianiket/palette/disabled-tooltips-3132111819375758759, c3aac85 🎨 Palette: Add hover titles to disabled buttons, d3b5918 Merge pull request #199 from dhurianiket/bolt-optimize-filter-sets-9452934895080612040, d88c046 feat(ui): add aria-labels and focus states to dashboard buttons, df57864 Merge pull request #197 from dhurianiket/palette-a11y-dashboard-buttons-17849235882835041170, fa8603d perf(dashboard): extract static arrays to Sets for O(1) filtering

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (11): 12e0344 fix(ci): align dompurify override so npm ci succeeds (#263), 266030d ⚡ Bolt: Optimize ExportModal inline sorting using Schwartzian transform (#255), 2963026 chore(graphify): update knowledge graph (1,455 nodes, 3,826 edges, 92 communities), 3784dd9 perf: short-circuit SpecialistLounge search filtering (#261), 53794cd fix(security): redact exposed Cloudflare Turnstile secret key in CURRENT_STATE.md, 625c121 fix(security): sanitize OPD PDF HTML with DOMPurify (#260), 926e08b 🎨 Palette: [UX improvement] Enhance focus visible states in Chat Coach and Specialist Lounge (#257), d8fd472 ⚡ Bolt: Clinical Handover selectedDocIds Set lookups (#259) (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (10): 2d614dd Merge pull request #201 from dhurianiket/bolt/optimize-upload-filter-896614611142847168, 792000d 🛡️ Sentinel: [HIGH] Fix XSS vulnerability in PDF Generation, a4991f2 Merge pull request #202 from dhurianiket/sentinel-fix-pdf-xss-11065736594836799695, a995a45 fix(ui-responsive): fix Dashboard layout grid compression and refine mobile-responsive 3D glassmorphism, c01bbba feat(graphify): update knowledge graph with Pillar 4 nodes (1,256 nodes, 3,133 edges, 97 communities), cbe8a7d docs: record Snapshot LIV in CURRENT_STATE.md, de2386e refactor: short-circuit array filter logic for UploadCenter search, escapeHtml() (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.24
Nodes (9): 259681e chore(agents): make GRAPHIFY.md auto-read mandatory every session — no user prompt needed, 2f5b70c Merge pull request #200 from dhurianiket/sentinel-fix-stack-trace-6159085393350306254, 39c2534 fix: remove stack trace from error response in logger, 3d61a4a docs: record Snapshot L in CURRENT_STATE.md, 77c840d feat(landing): add ABHA/ABDM India Health Stack section & FHIR R4 badges, 7ffcab1 fix(abdm): surface ABHA Gateway & IntegrationsPanel in Settings page, 81b0bc9 docs: record Snapshot XLVIII — CSP fix for GA4 data collection, 97d9c27 feat(graphify): install & run official Graphify-Labs/graphify knowledge graph (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): 7d1c74e feat(security): integrate Cloudflare Turnstile bot defense on edge and frontend, useTurnstile(), UseTurnstileOptions, UseTurnstileReturn, Window, TurnstileWidgetProps

### Community 58 - "Community 58"
Cohesion: 0.20
Nodes (5): logger, AIErrorBoundary, Component, Props, State

### Community 59 - "Community 59"
Cohesion: 0.31
Nodes (7): DRUG_INTERACTIONS, InteractionRule, isDuplicateClass(), isMedInCategory(), MED_CATEGORIES, checkMedicationInteractions(), MedicationStatus

### Community 60 - "Community 60"
Cohesion: 0.27
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (6): calculateContrastRatio(), getRelativeLuminance(), hexToRgb(), MOCK_12_MEDICATIONS, MOCK_DRUG_INTERACTIONS, MOCK_STRESS_BIOMARKERS

### Community 62 - "Community 62"
Cohesion: 0.28
Nodes (5): extractClinicalEntities(), ExtractedClinicalEntities, getAI(), getEdgeBearer(), isEdgeConfigured()

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (7): 02b8b11 docs: update CURRENT_STATE.md with Snapshot XXXIV teamwork feature and test suite completion, 06a2db1 docs: update CURRENT_STATE.md with Snapshot XXXVI, 3e697af docs: confirm final victory audit and full test suite passing in CURRENT_STATE.md, 5d23629 fix(ci): target direct Firebase Hosting endpoint to bypass Cloudflare bot challenge on headless CI runners, 6d39262 fix(ci): add CDN propagation delay and filter third-party network noise in Playwright smoke test, 748659f docs: update CURRENT_STATE.md with Snapshot XXXV GitHub Actions workflow fix, 783855a fix(ci): trigger smoke test workflow after deployment completes to eliminate race condition check failures

### Community 64 - "Community 64"
Cohesion: 0.28
Nodes (3): ComparativeAnalysisProps, TrendSparklinesProps, parseSafeTimestamp()

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (8): buildGuidelinePromptAugmentation(), CLINICAL_GUIDELINES, ClinicalGuideline, getSourceForMarker(), lookupRelevantGuidelines(), MedicalSource, SOURCES, UrgencyInfo

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (7): AbdmScanShareModal(), AbdmScanShareModalProps, 0863013 Merge PR 215: 🎨 Palette: Add aria-labels to icon-only buttons, 37a06ea Add aria-label to icon-only close buttons in modals, 3b0df16 Merge PR 220: Fix insecure randomness in ABDM service, f97bcaf Fix insecure randomness in ABDM service, generateScanAndShareQrPayload()

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (5): FORBIDDEN_PHRASES, MANDATORY_DISCLAIMERS, runSafetyCheck(), SafetyCheckOptions, SafetyCheckResult

### Community 68 - "Community 68"
Cohesion: 0.36
Nodes (8): 2939618 🛡️ Sentinel: Fix insecure randomness in auditLogService, 5572b6f Merge pull request #211 from dhurianiket/sentinel-fix-audit-log-id-8306300698070896645, 8465af8 ⚡ Bolt: Optimize date parsing in sort comparator using Schwartzian transform, a68e2e5 Merge pull request #212 from dhurianiket/palette/focus-visible-settings-14773763513275308991, b2329a3 🛡️ Sentinel: [CRITICAL] Fix privilege escalation in firestore rules, b859df5 Merge pull request #213 from dhurianiket/sentinel/fix-firestore-privilege-escalation-15940020795618893858, df9ac7f Add keyboard focus visibility to settings buttons, fa09cb6 Merge pull request #210 from dhurianiket/bolt-optimize-array-filter-12301290249497449695

### Community 69 - "Community 69"
Cohesion: 0.36
Nodes (4): AlertsContext, AlertsContextType, AlertsProvider(), useAlerts()

### Community 70 - "Community 70"
Cohesion: 0.25
Nodes (4): Component, Props, SectionErrorBoundary, State

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (3): 7ff7d21 feat(ui-ux-3d): implement Apple-inspired 3D glassmorphic design system overhaul & canvas particle mesh, Particle, Hero3DHealthGaugeProps

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (2): VoiceService, VoiceServiceOptions

### Community 73 - "Community 73"
Cohesion: 0.47
Nodes (4): 04542bb feat(a11y): add aria-label and focus states to CycleTrackingWidget Settings button, 2eff559 docs: update CURRENT_STATE.md with Snapshot XXXVII, 690b2af Merge pull request #186 from dhurianiket/palette/a11y-cycle-tracking-widget-5743654541532804775, CycleLog

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (6): 12f827e Merge pull request #190 from dhurianiket/sentinel/fix-math-random-id-2172922096459184170, 3676bdd Merge pull request #189 from dhurianiket/palette-a11y-healthconnect-close-16586726464144134397, 3a89129 🎨 Palette: Add ARIA label and focus styles to Health Connect modal close button, 5f86e69 perf: optimize search filter loop in LabReportsSection, a44f581 Fix insecure random number generation for unique IDs in wearableService, bb297c7 Merge pull request #188 from dhurianiket/bolt/optimize-lab-reports-search-14797524277834754908

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (3): 1497fcb fix(security): harden firestore rules, storage limits, csp headers, and url sanitization, isSafeUrl(), sanitizeHref()

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): executeFullUploadPipeline(), logAuditEvent(), UploadPipelineFailure, UploadPipelineResult, UploadPipelineSuccess

### Community 77 - "Community 77"
Cohesion: 0.33
Nodes (3): DashboardSkeleton(), SkeletonLoaderProps, TimelineSkeleton()

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (2): Component, GlobalErrorBoundary

### Community 79 - "Community 79"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 80 - "Community 80"
Cohesion: 0.67
Nodes (2): isRequired(), validateProfileName()

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (2): MedicalSafetyBannerProps, SafetyLevel

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (3): 2791756 chore(graphify): synchronize codebase knowledge graph and update full script, 878cb29 fix(edge): resolve Anycast location restrictions with Singapore placement and immediate network failover, 945282b chore(graphify): synchronize knowledge graph and exclude hidden AppleDouble files

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (1): SplashScreenProps

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (1): LoadingSpinnerProps

### Community 87 - "Community 87"
Cohesion: 1.00
Nodes (1): http

### Community 88 - "Community 88"
Cohesion: 1.00
Nodes (1): http

### Community 91 - "Community 91"
Cohesion: 1.00
Nodes (1): content

## Knowledge Gaps
- **315 isolated node(s):** `http`, `http`, `RecaptchaSiteVerifyResponse`, `VerifyRecaptchaRequestData`, `verifyRecaptcha` (+310 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 42`** (1 nodes): `InfoPageLayoutProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `VoiceService`, `VoiceServiceOptions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `Component`, `GlobalErrorBoundary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `isRequired()`, `validateProfileName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `MedicalSafetyBannerProps`, `SafetyLevel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `SplashScreenProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `LoadingSpinnerProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `http`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `content`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 47` to `Community 6`, `Community 20`, `Community 22`, `Community 0`, `Community 27`, `Community 36`, `Community 69`, `Community 25`, `Community 73`, `Community 11`, `Community 49`, `Community 34`, `Community 38`, `Community 4`, `Community 35`, `Community 42`, `Community 31`, `Community 12`, `Community 16`, `Community 33`, `Community 28`, `Community 44`, `Community 2`, `Community 29`, `Community 62`, `Community 13`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `http`, `http`, `RecaptchaSiteVerifyResponse` to the rest of the system?**
  _315 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06954930221917181 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07676767676767676 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13911290322580644 - nodes in this community are weakly interconnected._