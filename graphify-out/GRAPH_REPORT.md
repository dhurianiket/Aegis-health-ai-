# Graph Report - Aegis-Health-Intelligence  (2026-08-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1294 nodes · 3233 edges · 114 communities (72 shown, 42 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7847ab44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SpecialistLounge.tsx
- drugInteractionService.ts
- Settings/IntegrationsPanel.tsx
- AlertsContext.tsx
- abdmService.ts
- HolographicBodyScanner.tsx
- App.tsx
- Dashboard.tsx
- gemini.ts
- parseSafeTimestamp
- PaperclipJulesCoordinator
- fhir.ts
- functions/package.json
- compilerOptions
- AuthContext.tsx
- medical.ts
- PaperclipJulesCoordinator
- getAI
- InfoPageLayout.tsx
- auditLogService.ts
- typography_contrast.test.tsx
- Dashboard/SBARPreview.tsx
- useProfile
- fhirService.ts
- LandingPage.tsx
- firestore.ts
- devDependencies
- PricingModal.tsx
- Timeline.tsx
- useAuth
- RegionalVoiceService
- theme_typography_stress.test.tsx
- alertService.ts
- UploadCenter.tsx
- measurementProtocolService.ts
- contextService.ts
- milestone3_empirical_stress.spec.tsx
- compilerOptions
- ProfileContext.tsx
- config.ts
- coachService.ts
- AIErrorBoundary
- usageService.ts
- VisualLabReportCard.tsx
- scripts
- graphify.ts
- Reports/LabReportsSection.tsx
- dependencies
- ReportHistory.tsx
- ai.ts
- manifest.json
- AppNav.tsx
- SectionErrorBoundary
- package.json
- react
- overrides
- CareMap.tsx
- VoiceService
- pillar1_abdm_audio_snomed.test.ts
- jules-sync-staging.sh
- ui.ts
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- vite
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- LoadingSpinner.tsx
- vite.config.ts
- fetch-test.js
- test2.js
- @chenglou/pretext
- date-fns
- dotenv
- express
- react-dom
- @firebase/eslint-plugin-security-rules
- @google/genai
- html2canvas
- jsdom
- lucide-react
- motion
- qrcode.react
- react-dropzone
- react-markdown
- react-router-dom
- react-window
- recharts
- tailwind-merge
- @tailwindcss/typography
- @tailwindcss/vite
- @vis.gl/react-google-maps
- @vitejs/plugin-react
- zod
- tailwindcss
- @testing-library/react
- tsx
- @types/react-dom
- @types/react-window
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- vitest
- replace-colors.ts
- test-req.cjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 74 edges
2. `useProfile()` - 45 edges
3. `parseSafeTimestamp()` - 33 edges
4. `getAI()` - 27 edges
5. `exportToFhirBundle()` - 26 edges
6. `LabResult` - 25 edges
7. `WearableBiometrics` - 23 edges
8. `getDocuments()` - 22 edges
9. `handleFirestoreError()` - 21 edges
10. `downloadFhirJson()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `NoteAnalyzer()` --references--> `react`  [EXTRACTED]
  src/components/Upload/NoteAnalyzer.tsx → package.json
- `generateDoctorReport()` --references--> `jspdf`  [EXTRACTED]
  src/services/pdfExportService.ts → package.json
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `ComparativeAnalysisProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/ComparativeAnalysis.tsx → src/types/medical.ts
- `CorrelationMatrixProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/CorrelationMatrix.tsx → src/types/medical.ts

## Import Cycles
- None detected.

## Communities (114 total, 42 thin omitted)

### Community 0 - "SpecialistLounge.tsx"
Cohesion: 0.06
Nodes (48): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea() (+40 more)

### Community 1 - "drugInteractionService.ts"
Cohesion: 0.07
Nodes (48): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, InteractionMatrix(), loadOpenFdaData(), InteractionMatrixProps, calculateContrastRatio() (+40 more)

### Community 2 - "Settings/IntegrationsPanel.tsx"
Cohesion: 0.11
Nodes (45): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+37 more)

### Community 3 - "AlertsContext.tsx"
Cohesion: 0.06
Nodes (37): App(), NotificationCenter, SmartAlerts, RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCategory, NotificationDropdown() (+29 more)

### Community 4 - "abdmService.ts"
Cohesion: 0.13
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 5 - "HolographicBodyScanner.tsx"
Cohesion: 0.09
Nodes (29): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, HolographicBodyScanner, OrganHealthAvatar, HolographicBodyScanner(), HolographicBodyScannerProps (+21 more)

### Community 6 - "App.tsx"
Cohesion: 0.08
Nodes (15): AdminDashboard, ChatCoach, FeedbackWidget, IntegrationsPanel, Medications, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute() (+7 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (16): Dashboard, Particle, ATTENTION_STATUSES, Canvas3DMesh, EmptyDashboard, HealthRadarChart, Hero3DHealthGauge, TRACKED_NAMES (+8 more)

### Community 8 - "gemini.ts"
Cohesion: 0.14
Nodes (24): auth, analyzeWithSpecialist(), ExtractedReportResponse, extractMedicalReports(), SAFETY_GUARDRAIL(), SPECIALIST_PROMPTS, SpecialistAnalysisResponse, extractLabData() (+16 more)

### Community 9 - "parseSafeTimestamp"
Cohesion: 0.11
Nodes (19): ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs(), ComparativeAnalysis (+11 more)

### Community 10 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 11 - "fhir.ts"
Cohesion: 0.10
Nodes (23): FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint (+15 more)

### Community 12 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 14 - "AuthContext.tsx"
Cohesion: 0.15
Nodes (16): CalendarSync, AdminDashboard(), COLORS, CalendarEvent, CalendarSync(), SYMPTOMS_LIST, VisitPrepWidget(), PostLoginTransition() (+8 more)

### Community 15 - "medical.ts"
Cohesion: 0.23
Nodes (15): COACH_SYSTEM_INSTRUCTION, ActivityFilter, BiometricDiagnosticCorrelation, calculateCompositeReadinessScore(), evaluateBiometricDiagnosticCorrelation(), MetabolicAdaptation, normalizeImagingTexts(), RecoveryOverride (+7 more)

### Community 16 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 17 - "getAI"
Cohesion: 0.17
Nodes (14): FamilyHub, FamilyHub(), NoteAnalyzer(), getAI(), streamGenerate(), Type, mockGenerateContent, mockGenerateContentStream (+6 more)

### Community 18 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 19 - "auditLogService.ts"
Cohesion: 0.23
Nodes (16): SecurityAuditViewer(), ZeroKnowledgeVaultModal(), AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent() (+8 more)

### Community 20 - "typography_contrast.test.tsx"
Cohesion: 0.14
Nodes (9): HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, MOCK_PROFILE, MOCK_USER, compareReports() (+1 more)

### Community 21 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.14
Nodes (14): jspdf, jspdf, ExportModal, SBARPreview(), SBARPreviewProps, DateRange, ExportModal(), ExportModalProps (+6 more)

### Community 22 - "useProfile"
Cohesion: 0.22
Nodes (13): ConsentScreen, SBARPreview(), SBARPreviewProps, ConsentScreen(), ConsentScreenProps, steps, ClinicalHandover(), useProfile() (+5 more)

### Community 23 - "fhirService.ts"
Cohesion: 0.29
Nodes (15): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY, LoincMapping (+7 more)

### Community 24 - "LandingPage.tsx"
Cohesion: 0.12
Nodes (10): LandingPage, ErrorBoundary, Props, State, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage() (+2 more)

### Community 25 - "firestore.ts"
Cohesion: 0.24
Nodes (17): ClinicalSummaryRecord, FirestoreErrorInfo, getConversations(), getFamilyRelations(), getHealthScores(), getWearableHistory(), handleFirestoreError(), OperationType (+9 more)

### Community 26 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, eslint, devDependencies, autoprefixer, eslint, @playwright/test, @testing-library/dom, @types/express (+9 more)

### Community 27 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 28 - "Timeline.tsx"
Cohesion: 0.21
Nodes (14): Timeline, fetchDocs(), TYPE_CONFIG, classifyDocument(), createReminder(), generateRemindersFromAlerts(), executeFullUploadPipeline(), logAuditEvent() (+6 more)

### Community 29 - "useAuth"
Cohesion: 0.34
Nodes (12): ChatCoach(), ChatCoachProps, Medications(), useAuth(), useClinicalContext(), explainInteraction(), checkInteractions(), getActiveMedications() (+4 more)

### Community 30 - "RegionalVoiceService"
Cohesion: 0.17
Nodes (6): RegionalAudioPlayer(), RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, RegionalVoiceService, SpeechState

### Community 31 - "theme_typography_stress.test.tsx"
Cohesion: 0.19
Nodes (9): SettingsPage, SettingsPage(), ThemeToggleHarness(), applyTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider() (+1 more)

### Community 32 - "alertService.ts"
Cohesion: 0.24
Nodes (11): DRUG_INTERACTIONS, InteractionRule, isDuplicateClass(), isMedInCategory(), MED_CATEGORIES, checkLabResultForAlerts(), DEFAULT_THRESHOLDS, getConsolidatedAlerts() (+3 more)

### Community 33 - "UploadCenter.tsx"
Cohesion: 0.23
Nodes (13): UploadCenter, compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64() (+5 more)

### Community 34 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 35 - "contextService.ts"
Cohesion: 0.33
Nodes (11): MainApp(), fetchData(), ShareReport, ShareReport(), getClinicalSummary(), getDocuments(), getLabHistory(), getLatestInsights() (+3 more)

### Community 36 - "milestone3_empirical_stress.spec.tsx"
Cohesion: 0.15
Nodes (6): AuthContext, ProfileContext, mockAuthContextValue, mockProfileContextValue, mockAuthContextValue, mockProfileContextValue

### Community 37 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 38 - "ProfileContext.tsx"
Cohesion: 0.24
Nodes (8): ProfileManagement, ProfileManagement(), Profile, ProfileContextType, isRequired(), validateProfileName(), Gender, UserProfile

### Community 39 - "config.ts"
Cohesion: 0.18
Nodes (9): CycleTrackingSettings(), app, db, firebaseConfig, getDynamicAuthDomain(), googleProvider, sanitizeDomain(), storage (+1 more)

### Community 40 - "coachService.ts"
Cohesion: 0.32
Nodes (9): useCoach(), buildCoachPromptAugmentation(), CoachResponse, getCoachResponse(), FORBIDDEN_PHRASES, MANDATORY_DISCLAIMERS, runSafetyCheck(), SafetyCheckResult (+1 more)

### Community 41 - "AIErrorBoundary"
Cohesion: 0.18
Nodes (5): AIErrorBoundary, Props, State, logger, TODO: Send to remote observability platform

### Community 42 - "usageService.ts"
Cohesion: 0.39
Nodes (9): getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackStorageUsage(), trackUsage(), updateGlobalStats() (+1 more)

### Community 43 - "VisualLabReportCard.tsx"
Cohesion: 0.40
Nodes (8): BiomarkerSparkline(), FourZoneRangeBar(), getPlainEnglishSummary(), LabObservationItem, LabReport, PLAIN_ENGLISH_EXPLANATIONS, VisualLabReportCard(), VisualLabReportCardProps

### Community 44 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 45 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 46 - "Reports/LabReportsSection.tsx"
Cohesion: 0.24
Nodes (7): LabReportsSection, LabReport, LabReportsSection(), ReportCard(), downloadFHIRBundle(), downloadFhirJson(), exportToFHIR()

### Community 47 - "dependencies"
Cohesion: 0.22
Nodes (9): clsx, express-rate-limit, firebase, html-to-image, dependencies, clsx, express-rate-limit, firebase (+1 more)

### Community 48 - "ReportHistory.tsx"
Cohesion: 0.39
Nodes (8): Dashboard(), ReportHistory(), loadData(), Timeline(), getReportHistory(), getSourceForMarker(), getUrgencyAndNextStep(), ReportHistoryEntry

### Community 49 - "ai.ts"
Cohesion: 0.28
Nodes (8): ChatMessage, ChatRole, Conversation, PatientContext, SpecialistId, SpecialistProfile, Medication, SpecialistInsight

### Community 50 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 51 - "AppNav.tsx"
Cohesion: 0.29
Nodes (6): ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 52 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 53 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, private, type, version

### Community 54 - "react"
Cohesion: 0.33
Nodes (5): react, react, SplashScreen(), SplashScreenProps, ProfileProvider()

### Community 55 - "overrides"
Cohesion: 0.33
Nodes (6): overrides, esbuild, ip-address, protobufjs, qs, ws

### Community 56 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 58 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.60
Nodes (4): getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY, SnomedConcept

### Community 59 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 60 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 62 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 63 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

### Community 64 - "vite"
Cohesion: 0.67
Nodes (3): vite, vite, vite

## Knowledge Gaps
- **339 isolated node(s):** `VirtualizedChatListProps`, `LabCardData`, `MasonryLabCardsProps`, `AutoSizeTextareaProps`, `FixedSizeTextProps` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `SpecialistLounge.tsx`, `Settings/IntegrationsPanel.tsx`, `AlertsContext.tsx`, `abdmService.ts`, `App.tsx`, `Dashboard.tsx`, `parseSafeTimestamp`, `AuthContext.tsx`, `getAI`, `InfoPageLayout.tsx`, `typography_contrast.test.tsx`, `useProfile`, `LandingPage.tsx`, `PricingModal.tsx`, `Timeline.tsx`, `theme_typography_stress.test.tsx`, `UploadCenter.tsx`, `contextService.ts`, `ProfileContext.tsx`, `config.ts`, `Reports/LabReportsSection.tsx`, `ReportHistory.tsx`, `AppNav.tsx`, `react`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `Dashboard/SBARPreview.tsx`, `package.json`, `react`, `vite`, `@chenglou/pretext`, `date-fns`, `dotenv`, `express`, `react-dom`, `@google/genai`, `html2canvas`, `lucide-react`, `motion`, `qrcode.react`, `react-dropzone`, `react-markdown`, `react-router-dom`, `react-window`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `tailwindcss`, `@testing-library/react`, `tsx`, `@types/react-dom`, `@types/react-window`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `vite`, `vitest`, `@firebase/eslint-plugin-security-rules`, `jsdom`, `package.json`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `VirtualizedChatListProps`, `LabCardData`, `MasonryLabCardsProps` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SpecialistLounge.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0563165905631659 - nodes in this community are weakly interconnected._
- **Should `drugInteractionService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0679563492063492 - nodes in this community are weakly interconnected._
- **Should `Settings/IntegrationsPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1115811739820201 - nodes in this community are weakly interconnected._