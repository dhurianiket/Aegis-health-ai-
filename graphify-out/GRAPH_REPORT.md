# Graph Report - Aegis-Health-Intelligence  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1256 nodes · 3133 edges · 97 communities (62 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cbe8a7d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- firestore.ts
- drugInteractionService.ts
- Settings/IntegrationsPanel.tsx
- AlertsContext.tsx
- abdmService.ts
- gemini.ts
- devDependencies
- ClinicalHandover.tsx
- theme_typography_stress.test.tsx
- ChatCoach.tsx
- biomarkerTrajectoryService.ts
- Dashboard.tsx
- useAuth
- specialistFactory.ts
- PaperclipJulesCoordinator
- App.tsx
- fhir.ts
- functions/package.json
- compilerOptions
- PaperclipJulesCoordinator
- pretext.ts
- medical.ts
- InfoPageLayout.tsx
- auditLogService.ts
- AuthContext.tsx
- fhirService.ts
- PricingModal.tsx
- usageService.ts
- SpecialistLounge.tsx
- measurementProtocolService.ts
- milestone3_empirical_stress.spec.tsx
- compilerOptions
- package.json
- pillar1_abdm_audio_snomed.test.ts
- FoodInteractionMatrix.tsx
- AIErrorBoundary
- scripts
- graphify.ts
- LandingPage.tsx
- RegionalVoiceService
- dependencies
- ProfileManagement.tsx
- config.ts
- manifest.json
- Dashboard/SBARPreview.tsx
- ErrorBoundary.tsx
- SectionErrorBoundary
- AppNav.tsx
- CareMap.tsx
- VoiceService
- react
- jules-sync-staging.sh
- ui.ts
- SharedProfile.tsx
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- PostLoginTransition.tsx
- LoadingSpinner.tsx
- vite.config.ts
- fetch-test.js
- test2.js
- date-fns
- clsx
- dotenv
- express
- express-rate-limit
- @google/genai
- html2canvas
- lucide-react
- motion
- qrcode.react
- react-dom
- react-dropzone
- react-markdown
- react-router-dom
- recharts
- tailwind-merge
- @tailwindcss/typography
- @tailwindcss/vite
- @vis.gl/react-google-maps
- @vitejs/plugin-react
- zod
- replace-colors.ts
- test-req.cjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 74 edges
2. `useProfile()` - 45 edges
3. `parseSafeTimestamp()` - 31 edges
4. `getAI()` - 27 edges
5. `LabResult` - 25 edges
6. `exportToFhirBundle()` - 23 edges
7. `WearableBiometrics` - 22 edges
8. `getDocuments()` - 22 edges
9. `handleFirestoreError()` - 21 edges
10. `db` - 20 edges

## Surprising Connections (you probably didn't know these)
- `ProfileProvider()` --references--> `react`  [EXTRACTED]
  src/context/ProfileContext.tsx → package.json
- `NoteAnalyzer()` --references--> `react`  [EXTRACTED]
  src/components/Upload/NoteAnalyzer.tsx → package.json
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `CorrelationMatrixProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/CorrelationMatrix.tsx → src/types/medical.ts
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (97 total, 35 thin omitted)

### Community 0 - "firestore.ts"
Cohesion: 0.06
Nodes (62): Timeline, fetchData(), ShareReport, ShareReport(), loadData(), fetchDocs(), TYPE_CONFIG, DashboardSkeleton() (+54 more)

### Community 1 - "drugInteractionService.ts"
Cohesion: 0.06
Nodes (51): Medications, HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, InteractionMatrix(), loadOpenFdaData() (+43 more)

### Community 2 - "Settings/IntegrationsPanel.tsx"
Cohesion: 0.11
Nodes (47): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+39 more)

### Community 3 - "AlertsContext.tsx"
Cohesion: 0.07
Nodes (40): NotificationCenter, SmartAlerts, RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps (+32 more)

### Community 4 - "abdmService.ts"
Cohesion: 0.13
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 5 - "gemini.ts"
Cohesion: 0.09
Nodes (39): FamilyHub, FamilyHub(), NoteAnalyzer(), getAI(), streamGenerate(), Type, mockGenerateContent, mockGenerateContentStream (+31 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, vite, devDependencies, autoprefixer, eslint (+32 more)

### Community 7 - "ClinicalHandover.tsx"
Cohesion: 0.12
Nodes (24): jspdf, jspdf, ConsentScreen, ExportModal, DateRange, ExportModal(), ExportModalProps, SBARPreview() (+16 more)

### Community 8 - "theme_typography_stress.test.tsx"
Cohesion: 0.09
Nodes (18): App(), SettingsPage, SettingsPage(), ThemeToggleHarness(), AuthProvider(), applyTheme(), Theme, ThemeContext (+10 more)

### Community 9 - "ChatCoach.tsx"
Cohesion: 0.15
Nodes (22): ChatCoach(), ChatCoachProps, useClinicalContext(), useCoach(), buildCoachPromptAugmentation(), COACH_SYSTEM_INSTRUCTION, CoachResponse, getCoachResponse() (+14 more)

### Community 10 - "biomarkerTrajectoryService.ts"
Cohesion: 0.11
Nodes (24): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, OrganHealthAvatar, OrganHealthAvatar(), OrganHealthAvatarProps, BiomarkerTrajectory (+16 more)

### Community 11 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (18): Dashboard, CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs(), ATTENTION_STATUSES, CorrelationMatrix, CycleTrackingWidget (+10 more)

### Community 12 - "useAuth"
Cohesion: 0.16
Nodes (21): MainApp(), Dashboard(), LabTrendChart, LabTrendChart(), LabTrendChartProps, AppNav(), CycleTrackingSettings(), LabReport (+13 more)

### Community 13 - "specialistFactory.ts"
Cohesion: 0.14
Nodes (14): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+6 more)

### Community 14 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 15 - "App.tsx"
Cohesion: 0.09
Nodes (13): AdminDashboard, ChatCoach, FeedbackWidget, IntegrationsPanel, LabReportsSection, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute() (+5 more)

### Community 16 - "fhir.ts"
Cohesion: 0.10
Nodes (23): FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint (+15 more)

### Community 17 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 18 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 19 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 20 - "pretext.ts"
Cohesion: 0.18
Nodes (16): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea(), AutoSizeTextareaProps (+8 more)

### Community 21 - "medical.ts"
Cohesion: 0.22
Nodes (15): ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), ComparativeAnalysis, ActivityFilter, calculateCompositeReadinessScore(), evaluateBiometricDiagnosticCorrelation(), MetabolicAdaptation (+7 more)

### Community 22 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 23 - "auditLogService.ts"
Cohesion: 0.23
Nodes (16): SecurityAuditViewer(), ZeroKnowledgeVaultModal(), AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent() (+8 more)

### Community 24 - "AuthContext.tsx"
Cohesion: 0.19
Nodes (13): CalendarSync, CalendarEvent, CalendarSync(), SYMPTOMS_LIST, VisitPrepWidget(), AuthContextType, getAccessToken(), googleProvider (+5 more)

### Community 25 - "fhirService.ts"
Cohesion: 0.29
Nodes (15): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY, LoincMapping (+7 more)

### Community 26 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 27 - "usageService.ts"
Cohesion: 0.26
Nodes (12): AdminDashboard(), COLORS, getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackStorageUsage() (+4 more)

### Community 28 - "SpecialistLounge.tsx"
Cohesion: 0.25
Nodes (12): SpecialistLounge(), db, CachedReport, FirestoreErrorInfo, generateSourceHash(), getCachedReport(), handleFirestoreError(), OperationType (+4 more)

### Community 29 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 30 - "milestone3_empirical_stress.spec.tsx"
Cohesion: 0.16
Nodes (8): renderCitationLink(), CLINICAL_GUIDELINES, ClinicalGuideline, MedicalSource, SOURCES, UrgencyInfo, mockAuthContextValue, mockProfileContextValue

### Community 31 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 32 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, name, overrides, esbuild, ip-address, protobufjs, qs (+4 more)

### Community 33 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.27
Nodes (8): RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY, SnomedConcept

### Community 34 - "FoodInteractionMatrix.tsx"
Cohesion: 0.26
Nodes (9): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, DetectedFoodInteraction, evaluateFoodInteractions(), FOOD_RULES, FoodContraindicationRule (+1 more)

### Community 35 - "AIErrorBoundary"
Cohesion: 0.18
Nodes (5): AIErrorBoundary, Props, State, logger, TODO: Send to remote observability platform

### Community 36 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 37 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 38 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 40 - "dependencies"
Cohesion: 0.22
Nodes (9): @chenglou/pretext, firebase, html-to-image, dependencies, @chenglou/pretext, firebase, html-to-image, react-window (+1 more)

### Community 41 - "ProfileManagement.tsx"
Cohesion: 0.31
Nodes (6): ProfileManagement, ProfileManagement(), auth, isRequired(), validateProfileName(), Gender

### Community 42 - "config.ts"
Cohesion: 0.25
Nodes (6): app, firebaseConfig, getDynamicAuthDomain(), sanitizeDomain(), storage, ShareOptions

### Community 43 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 44 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.32
Nodes (6): RegionalAudioPlayer(), SBARPreview(), SBARPreviewProps, exportOpdConsultationPdf(), OpdPdfInputData, SBARSummary

### Community 45 - "ErrorBoundary.tsx"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 46 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 47 - "AppNav.tsx"
Cohesion: 0.33
Nodes (5): ALL_DESKTOP_TABS, AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 48 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 50 - "react"
Cohesion: 0.40
Nodes (4): react, react, SplashScreen(), SplashScreenProps

### Community 51 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 52 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 55 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 56 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **327 isolated node(s):** `SkeletonLoaderProps`, `TrendSummary`, `FileItem`, `ClinicalSummaryRecord`, `FirestoreErrorInfo` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `firestore.ts`, `drugInteractionService.ts`, `Settings/IntegrationsPanel.tsx`, `AlertsContext.tsx`, `abdmService.ts`, `gemini.ts`, `ClinicalHandover.tsx`, `theme_typography_stress.test.tsx`, `ChatCoach.tsx`, `Dashboard.tsx`, `App.tsx`, `InfoPageLayout.tsx`, `AuthContext.tsx`, `PricingModal.tsx`, `usageService.ts`, `SpecialistLounge.tsx`, `LandingPage.tsx`, `AppNav.tsx`, `PostLoginTransition.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `ClinicalHandover.tsx`, `package.json`, `react`, `date-fns`, `clsx`, `dotenv`, `express`, `express-rate-limit`, `@google/genai`, `html2canvas`, `lucide-react`, `motion`, `qrcode.react`, `react-dom`, `react-dropzone`, `react-markdown`, `react-router-dom`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `SkeletonLoaderProps`, `TrendSummary`, `FileItem` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `firestore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.059298245614035086 - nodes in this community are weakly interconnected._
- **Should `drugInteractionService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06259780907668232 - nodes in this community are weakly interconnected._
- **Should `Settings/IntegrationsPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10675990675990676 - nodes in this community are weakly interconnected._