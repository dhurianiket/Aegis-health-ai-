# Graph Report - Aegis-Health-Intelligence  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1235 nodes · 3081 edges · 98 communities (65 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f25e222a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WearableCoachWidget.tsx
- gemini.ts
- SpecialistLounge.tsx
- drugInteractionService.ts
- abdmService.ts
- devDependencies
- biomarkerTrajectoryService.ts
- AlertsContext.tsx
- Dashboard.tsx
- PaperclipJulesCoordinator
- functions/package.json
- compilerOptions
- App.tsx
- medical.ts
- fhirService.ts
- PaperclipJulesCoordinator
- ProfileContext.tsx
- config.ts
- InfoPageLayout.tsx
- contextService.ts
- firestore.ts
- fhir.ts
- theme_typography_stress.test.tsx
- PricingModal.tsx
- Timeline.tsx
- ClinicalHandover.tsx
- UploadCenter.tsx
- AuthContext.tsx
- usageService.ts
- measurementProtocolService.ts
- ErrorBoundary.tsx
- compilerOptions
- package.json
- pillar1_abdm_audio_snomed.test.ts
- useProfile
- FoodInteractionMatrix.tsx
- scripts
- graphify.ts
- downloadFhirJson
- LandingPage.tsx
- UserProfile
- RegionalVoiceService
- dependencies
- AdminDashboard.tsx
- useAuth
- ProfileManagement.tsx
- manifest.json
- Dashboard/SBARPreview.tsx
- AppNav.tsx
- SectionErrorBoundary
- auth-dash.spec.tsx
- CareMap.tsx
- AIErrorBoundary
- react
- jules-sync-staging.sh
- ui.ts
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- LoadingSpinner.tsx
- vite.config.ts
- fetch-test.js
- test2.js
- clsx
- date-fns
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
- `NoteAnalyzer()` --references--> `react`  [EXTRACTED]
  src/components/Upload/NoteAnalyzer.tsx → package.json
- `ProfileProvider()` --references--> `react`  [EXTRACTED]
  src/context/ProfileContext.tsx → package.json
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `RemindersContextType` --references--> `HealthAlert`  [EXTRACTED]
  src/context/RemindersContext.tsx → src/types/alerts.ts
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (98 total, 33 thin omitted)

### Community 0 - "WearableCoachWidget.tsx"
Cohesion: 0.07
Nodes (61): WearableCoachWidget(), WearableCoachWidgetProps, WearableCoachWidget, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry() (+53 more)

### Community 1 - "gemini.ts"
Cohesion: 0.06
Nodes (61): ChatCoach, FamilyHub, ChatCoach(), ChatCoachProps, RemindersWidget(), RemindersWidgetProps, FamilyHub(), NoteAnalyzer() (+53 more)

### Community 2 - "SpecialistLounge.tsx"
Cohesion: 0.05
Nodes (52): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea() (+44 more)

### Community 3 - "drugInteractionService.ts"
Cohesion: 0.07
Nodes (45): Medications, HeroMetric(), HeroMetricProps, InteractionMatrix(), loadOpenFdaData(), InteractionMatrixProps, Medications(), MOCK_PROFILE (+37 more)

### Community 4 - "abdmService.ts"
Cohesion: 0.12
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, vite, devDependencies, autoprefixer, eslint (+32 more)

### Community 6 - "biomarkerTrajectoryService.ts"
Cohesion: 0.11
Nodes (24): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, OrganHealthAvatar, OrganHealthAvatar(), OrganHealthAvatarProps, BiomarkerTrajectory (+16 more)

### Community 7 - "AlertsContext.tsx"
Cohesion: 0.12
Nodes (19): NotificationCenter, SmartAlerts, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps, NotificationCenterProps, AlertBanner() (+11 more)

### Community 8 - "Dashboard.tsx"
Cohesion: 0.15
Nodes (19): ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs(), ATTENTION_STATUSES (+11 more)

### Community 9 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 10 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 12 - "App.tsx"
Cohesion: 0.10
Nodes (11): Dashboard, FeedbackWidget, IntegrationsPanel, LabReportsSection, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute(), SpecialistLounge (+3 more)

### Community 13 - "medical.ts"
Cohesion: 0.17
Nodes (17): DRUG_INTERACTIONS, InteractionRule, isDuplicateClass(), isMedInCategory(), MED_CATEGORIES, checkLabResultForAlerts(), DEFAULT_THRESHOLDS, getConsolidatedAlerts() (+9 more)

### Community 14 - "fhirService.ts"
Cohesion: 0.23
Nodes (20): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY, LoincMapping (+12 more)

### Community 15 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 16 - "ProfileContext.tsx"
Cohesion: 0.11
Nodes (14): App(), ProfileProvider(), RemindersContext, RemindersContextType, RemindersProvider(), Toast, ToastContext, ToastContextType (+6 more)

### Community 17 - "config.ts"
Cohesion: 0.13
Nodes (15): ConsentScreen, SharedProfile, SharedProfileProps, ConsentScreen(), ConsentScreenProps, steps, logAuditEvent(), app (+7 more)

### Community 18 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 19 - "contextService.ts"
Cohesion: 0.19
Nodes (14): fetchData(), LabTrendChart, ShareReport, LabTrendChart(), LabTrendChartProps, ShareReport(), loadDocuments(), loadData() (+6 more)

### Community 20 - "firestore.ts"
Cohesion: 0.23
Nodes (18): ClinicalSummaryRecord, FirestoreErrorInfo, getConversations(), getFamilyRelations(), getHealthScores(), getReportHistory(), getWearableHistory(), handleFirestoreError() (+10 more)

### Community 21 - "fhir.ts"
Cohesion: 0.11
Nodes (18): FhirAddress, FhirAttachment, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint, FhirDocumentReferenceContent (+10 more)

### Community 22 - "theme_typography_stress.test.tsx"
Cohesion: 0.18
Nodes (10): MainApp(), SettingsPage, SettingsPage(), ThemeToggleHarness(), applyTheme(), Theme, ThemeContext, ThemeContextType (+2 more)

### Community 23 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 24 - "Timeline.tsx"
Cohesion: 0.20
Nodes (11): ReportComparison(), fetchData(), ReportComparisonProps, TYPE_CONFIG, LabObservation, compareReports(), ComparisonRow, CLINICAL_STABILITY_THRESHOLDS (+3 more)

### Community 25 - "ClinicalHandover.tsx"
Cohesion: 0.24
Nodes (11): jspdf, jspdf, SBARPreview(), SBARPreviewProps, ExportButton(), ExportButtonProps, exportToPDF(), generateDoctorReport() (+3 more)

### Community 26 - "UploadCenter.tsx"
Cohesion: 0.22
Nodes (14): UploadCenter, compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64() (+6 more)

### Community 27 - "AuthContext.tsx"
Cohesion: 0.26
Nodes (11): SYMPTOMS_LIST, VisitPrepWidget(), AuthContextType, AuthProvider(), getAccessToken(), useClinicalContext(), FormMetadata, FormResponse (+3 more)

### Community 28 - "usageService.ts"
Cohesion: 0.30
Nodes (11): AdminDashboard(), getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackStorageUsage(), trackUsage() (+3 more)

### Community 29 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 30 - "ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): ErrorBoundary, Props, State, Props, State, logger, TODO: Send to remote observability platform

### Community 31 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 32 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, name, overrides, esbuild, ip-address, protobufjs, qs (+4 more)

### Community 33 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.24
Nodes (9): RegionalAudioPlayer(), RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY (+1 more)

### Community 34 - "useProfile"
Cohesion: 0.31
Nodes (11): Dashboard(), ClinicalHandover(), LabReport, LabReportsSection(), ReportCard(), ReportHistory(), Timeline(), fetchDocs() (+3 more)

### Community 35 - "FoodInteractionMatrix.tsx"
Cohesion: 0.26
Nodes (9): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, DetectedFoodInteraction, evaluateFoodInteractions(), FOOD_RULES, FoodContraindicationRule (+1 more)

### Community 36 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 37 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 38 - "downloadFhirJson"
Cohesion: 0.24
Nodes (7): ExportModal, DateRange, ExportModal(), ExportModalProps, downloadFHIRBundle(), downloadFhirJson(), exportToFHIR()

### Community 39 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 40 - "UserProfile"
Cohesion: 0.20
Nodes (6): EmptyDashboard, Profile, ProfileContextType, PatientContext, SpecialistInsight, UserProfile

### Community 42 - "dependencies"
Cohesion: 0.22
Nodes (9): @chenglou/pretext, firebase, html-to-image, dependencies, @chenglou/pretext, firebase, html-to-image, react-window (+1 more)

### Community 43 - "AdminDashboard.tsx"
Cohesion: 0.25
Nodes (6): AdminDashboard, COLORS, DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps, TimelineSkeleton()

### Community 44 - "useAuth"
Cohesion: 0.28
Nodes (7): CalendarSync, CalendarEvent, CalendarSync(), PostLoginTransition(), PostLoginTransitionProps, CycleTrackingSettings(), useAuth()

### Community 45 - "ProfileManagement.tsx"
Cohesion: 0.31
Nodes (6): ProfileManagement, ProfileManagement(), auth, isRequired(), validateProfileName(), Gender

### Community 46 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 47 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.32
Nodes (6): SBARPreview, SBARPreview(), SBARPreviewProps, exportOpdConsultationPdf(), OpdPdfInputData, SBARSummary

### Community 48 - "AppNav.tsx"
Cohesion: 0.29
Nodes (6): ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 49 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 50 - "auth-dash.spec.tsx"
Cohesion: 0.25
Nodes (4): AuthContext, ProfileContext, mockAuthContextValue, mockProfileContextValue

### Community 51 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 53 - "react"
Cohesion: 0.40
Nodes (4): react, react, SplashScreen(), SplashScreenProps

### Community 54 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 55 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 57 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 58 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **326 isolated node(s):** `WearableCoachWidgetProps`, `CoachResponse`, `BiometricDiagnosticInsight`, `BiometricPoint`, `DailyWearableSummary` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `WearableCoachWidget.tsx`, `gemini.ts`, `SpecialistLounge.tsx`, `drugInteractionService.ts`, `abdmService.ts`, `AlertsContext.tsx`, `Dashboard.tsx`, `App.tsx`, `ProfileContext.tsx`, `InfoPageLayout.tsx`, `contextService.ts`, `theme_typography_stress.test.tsx`, `PricingModal.tsx`, `Timeline.tsx`, `ClinicalHandover.tsx`, `UploadCenter.tsx`, `AuthContext.tsx`, `usageService.ts`, `useProfile`, `LandingPage.tsx`, `UserProfile`, `AdminDashboard.tsx`, `AppNav.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `ClinicalHandover.tsx`, `package.json`, `react`, `clsx`, `date-fns`, `dotenv`, `express`, `express-rate-limit`, `@google/genai`, `html2canvas`, `lucide-react`, `motion`, `qrcode.react`, `react-dom`, `react-dropzone`, `react-markdown`, `react-router-dom`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `WearableCoachWidgetProps`, `CoachResponse`, `BiometricDiagnosticInsight` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WearableCoachWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07440699126092384 - nodes in this community are weakly interconnected._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05553923009109609 - nodes in this community are weakly interconnected._
- **Should `SpecialistLounge.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05228105228105228 - nodes in this community are weakly interconnected._