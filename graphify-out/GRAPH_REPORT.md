# Graph Report - Aegis-Health-Intelligence  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1191 nodes · 3008 edges · 91 communities (58 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41759fe9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- gemini.ts
- medical.ts
- AlertsContext.tsx
- SpecialistLounge.tsx
- abdmService.ts
- devDependencies
- Reports/LabReportsSection.tsx
- Dashboard.tsx
- App.tsx
- usageService.ts
- useAuth
- PaperclipJulesCoordinator
- functions/package.json
- compilerOptions
- fhirService.ts
- PaperclipJulesCoordinator
- InfoPageLayout.tsx
- config.ts
- typography_contrast.test.tsx
- drugInteractionService.ts
- fhir.ts
- LandingPage.tsx
- firestore.ts
- package.json
- useProfile
- sbar_pdf_druglab_stress.test.ts
- Timeline.tsx
- UploadCenter.tsx
- measurementProtocolService.ts
- main.tsx
- compilerOptions
- pillar1_abdm_audio_snomed.test.ts
- theme_typography_stress.test.tsx
- AIErrorBoundary
- ProfileContext.tsx
- graphify.ts
- Medications.tsx
- RegionalVoiceService
- ProfileManagement.tsx
- manifest.json
- AppNav.tsx
- SectionErrorBoundary
- auth-dash.spec.tsx
- dependencies
- overrides
- CareMap.tsx
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
- date-fns
- dotenv
- express
- express-rate-limit
- firebase
- @google/genai
- html2canvas
- html-to-image
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
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `ComparativeAnalysisProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/ComparativeAnalysis.tsx → src/types/medical.ts
- `CorrelationMatrixProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/CorrelationMatrix.tsx → src/types/medical.ts
- `SpecialistLounge()` --indirect_call--> `renderCitationLink()`  [INFERRED]
  src/components/Specialists/SpecialistLounge.tsx → src/components/Common/CitationBadge.tsx

## Import Cycles
- None detected.

## Communities (91 total, 33 thin omitted)

### Community 0 - "gemini.ts"
Cohesion: 0.05
Nodes (66): ChatCoach, FamilyHub, ChatCoach(), ChatCoachProps, FamilyHub(), SpecialistLounge(), NoteAnalyzer(), useCoach() (+58 more)

### Community 1 - "medical.ts"
Cohesion: 0.08
Nodes (61): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+53 more)

### Community 2 - "AlertsContext.tsx"
Cohesion: 0.05
Nodes (58): NotificationCenter, SmartAlerts, RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps (+50 more)

### Community 3 - "SpecialistLounge.tsx"
Cohesion: 0.06
Nodes (42): SpecialistLounge, ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), LabCardData, MasonryLabCards(), MasonryLabCardsProps (+34 more)

### Community 4 - "abdmService.ts"
Cohesion: 0.12
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, vite, devDependencies, autoprefixer, eslint (+32 more)

### Community 6 - "Reports/LabReportsSection.tsx"
Cohesion: 0.12
Nodes (22): jspdf, jspdf, SBARPreview(), SBARPreviewProps, DateRange, ExportModal(), ExportModalProps, SBARPreview() (+14 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.10
Nodes (22): ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs(), ATTENTION_STATUSES (+14 more)

### Community 8 - "App.tsx"
Cohesion: 0.08
Nodes (17): AdminDashboard, CalendarSync, Dashboard, ExportModal, FeedbackWidget, IntegrationsPanel, LabReportsSection, PrivacyPolicy (+9 more)

### Community 9 - "usageService.ts"
Cohesion: 0.13
Nodes (22): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+14 more)

### Community 10 - "useAuth"
Cohesion: 0.16
Nodes (18): AdminDashboard(), COLORS, CalendarEvent, CalendarSync(), SYMPTOMS_LIST, VisitPrepWidget(), PostLoginTransition(), PostLoginTransitionProps (+10 more)

### Community 11 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 12 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 14 - "fhirService.ts"
Cohesion: 0.23
Nodes (20): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY, LoincMapping (+12 more)

### Community 15 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 16 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 17 - "config.ts"
Cohesion: 0.14
Nodes (15): ConsentScreen, SettingsPage, ConsentScreen(), ConsentScreenProps, steps, SettingsPage(), logAuditEvent(), app (+7 more)

### Community 18 - "typography_contrast.test.tsx"
Cohesion: 0.14
Nodes (9): HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, MOCK_PROFILE, MOCK_USER, compareReports() (+1 more)

### Community 19 - "drugInteractionService.ts"
Cohesion: 0.17
Nodes (18): loadOpenFdaData(), AdverseEventReaction, BlackBoxWarning, cacheOpenFdaSummary(), cacheRxCuiMatch(), cleanDrugQuery(), ClinicalCitation, CURATED_FDA_KNOWLEDGE_BASE (+10 more)

### Community 20 - "fhir.ts"
Cohesion: 0.11
Nodes (18): FhirAddress, FhirAttachment, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint, FhirDocumentReferenceContent (+10 more)

### Community 21 - "LandingPage.tsx"
Cohesion: 0.12
Nodes (10): LandingPage, ErrorBoundary, Props, State, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage() (+2 more)

### Community 22 - "firestore.ts"
Cohesion: 0.24
Nodes (17): ClinicalSummaryRecord, FirestoreErrorInfo, getConversations(), getFamilyRelations(), getHealthScores(), getWearableHistory(), handleFirestoreError(), OperationType (+9 more)

### Community 23 - "package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, private, scripts, build, clean, dev (+8 more)

### Community 24 - "useProfile"
Cohesion: 0.19
Nodes (14): MainApp(), fetchData(), LabTrendChart, ShareReport, LabTrendChart(), LabTrendChartProps, ShareReport(), loadDocuments() (+6 more)

### Community 25 - "sbar_pdf_druglab_stress.test.ts"
Cohesion: 0.27
Nodes (12): InteractionMatrix(), InteractionMatrixProps, BioRegimenSafetySummary, buildBioRegimenSafetySummary(), DRUG_CATEGORIES, DrugLabContraindication, evaluateDrugLabContraindications(), isMedInCategory() (+4 more)

### Community 26 - "Timeline.tsx"
Cohesion: 0.18
Nodes (13): ReportHistory(), loadData(), Timeline(), TYPE_CONFIG, DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps, TimelineSkeleton() (+5 more)

### Community 27 - "UploadCenter.tsx"
Cohesion: 0.24
Nodes (13): compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64(), UploadCenter() (+5 more)

### Community 28 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 29 - "main.tsx"
Cohesion: 0.15
Nodes (9): App(), AuthProvider(), Toast, ToastContext, ToastContextType, ToastProvider(), ToastType, GlobalErrorBoundary (+1 more)

### Community 30 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 31 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.24
Nodes (9): RegionalAudioPlayer(), RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY (+1 more)

### Community 32 - "theme_typography_stress.test.tsx"
Cohesion: 0.23
Nodes (7): ThemeToggleHarness(), applyTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme()

### Community 33 - "AIErrorBoundary"
Cohesion: 0.18
Nodes (5): AIErrorBoundary, Props, State, logger, TODO: Send to remote observability platform

### Community 34 - "ProfileContext.tsx"
Cohesion: 0.22
Nodes (8): react, react, SplashScreen(), SplashScreenProps, Profile, ProfileContextType, ProfileProvider(), UserProfile

### Community 35 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 36 - "Medications.tsx"
Cohesion: 0.49
Nodes (8): Medications, Medications(), explainInteraction(), checkInteractions(), getActiveMedications(), getInteractions(), lookupRxCUI(), saveMedication()

### Community 38 - "ProfileManagement.tsx"
Cohesion: 0.31
Nodes (6): ProfileManagement, ProfileManagement(), auth, isRequired(), validateProfileName(), Gender

### Community 39 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 40 - "AppNav.tsx"
Cohesion: 0.29
Nodes (6): ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 41 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 42 - "auth-dash.spec.tsx"
Cohesion: 0.25
Nodes (4): AuthContext, ProfileContext, mockAuthContextValue, mockProfileContextValue

### Community 43 - "dependencies"
Cohesion: 0.29
Nodes (7): @chenglou/pretext, clsx, dependencies, @chenglou/pretext, clsx, react-dom, react-dom

### Community 44 - "overrides"
Cohesion: 0.33
Nodes (6): overrides, esbuild, ip-address, protobufjs, qs, ws

### Community 45 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 46 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 47 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 49 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 50 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **315 isolated node(s):** `CachedReport`, `FirestoreErrorInfo`, `OperationType`, `CoachResponse`, `GeminiInputError` (+310 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `gemini.ts`, `medical.ts`, `AlertsContext.tsx`, `SpecialistLounge.tsx`, `abdmService.ts`, `Reports/LabReportsSection.tsx`, `Dashboard.tsx`, `App.tsx`, `usageService.ts`, `InfoPageLayout.tsx`, `config.ts`, `typography_contrast.test.tsx`, `LandingPage.tsx`, `useProfile`, `Timeline.tsx`, `UploadCenter.tsx`, `ProfileContext.tsx`, `Medications.tsx`, `AppNav.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `Reports/LabReportsSection.tsx`, `package.json`, `ProfileContext.tsx`, `date-fns`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `@google/genai`, `html2canvas`, `html-to-image`, `lucide-react`, `motion`, `qrcode.react`, `react-dropzone`, `react-markdown`, `react-router-dom`, `react-window`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `CachedReport`, `FirestoreErrorInfo`, `OperationType` to the rest of the system?**
  _315 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051935081148564294 - nodes in this community are weakly interconnected._
- **Should `medical.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07565543071161049 - nodes in this community are weakly interconnected._
- **Should `AlertsContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05221518987341772 - nodes in this community are weakly interconnected._