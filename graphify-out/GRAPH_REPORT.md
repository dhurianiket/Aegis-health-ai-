# Graph Report - Aegis-Health-Intelligence  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1220 nodes · 3057 edges · 96 communities (60 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a0f5ab2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- gemini.ts
- Dashboard.tsx
- healthSyncService.ts
- abdmService.ts
- devDependencies
- reminderService.ts
- firestore.ts
- theme_typography_stress.test.tsx
- biomarkerTrajectoryService.ts
- fhirService.ts
- PaperclipJulesCoordinator
- specialistFactory.ts
- functions/package.json
- compilerOptions
- App.tsx
- pretext.ts
- PaperclipJulesCoordinator
- useAuth
- AuthContext.tsx
- InfoPageLayout.tsx
- drugInteractionService.ts
- auth-dash.spec.tsx
- AIErrorBoundary
- Reports/LabReportsSection.tsx
- UploadCenter.tsx
- PostLoginTransition.tsx
- ClinicalHandover.tsx
- express
- LandingPage.tsx
- PricingModal.tsx
- AdminDashboard.tsx
- usageService.ts
- measurementProtocolService.ts
- config.ts
- Timeline.tsx
- compilerOptions
- Dashboard/SBARPreview.tsx
- ErrorBoundary.tsx
- exportToFhirBundle
- getDocuments
- package.json
- graphify.ts
- downloadFhirJson
- RegionalVoiceService
- ProfileManagement.tsx
- manifest.json
- SectionErrorBoundary
- dependencies
- overrides
- CareMap.tsx
- pillar1_abdm_audio_snomed.test.ts
- jules-sync-staging.sh
- ui.ts
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- SplashScreen.tsx
- LoadingSpinner.tsx
- vite.config.ts
- fetch-test.js
- test2.js
- @chenglou/pretext
- date-fns
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
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `UseWearableTelemetryResult` --references--> `WearableBiometrics`  [EXTRACTED]
  src/hooks/useWearableTelemetry.ts → src/types/wearables.ts
- `TrendSparklines()` --calls--> `parseSafeTimestamp()`  [EXTRACTED]
  src/components/Dashboard/TrendSparklines.tsx → src/utils/dateUtils.ts
- `CorrelationMatrix()` --calls--> `parseSafeTimestamp()`  [EXTRACTED]
  src/components/Dashboard/CorrelationMatrix.tsx → src/utils/dateUtils.ts
- `SpecialistLounge()` --indirect_call--> `renderCitationLink()`  [INFERRED]
  src/components/Specialists/SpecialistLounge.tsx → src/components/Common/CitationBadge.tsx

## Import Cycles
- None detected.

## Communities (96 total, 36 thin omitted)

### Community 0 - "gemini.ts"
Cohesion: 0.07
Nodes (56): FamilyHub, ChatCoach(), ChatCoachProps, FamilyHub(), SpecialistLounge(), useClinicalContext(), getAI(), streamGenerate() (+48 more)

### Community 1 - "Dashboard.tsx"
Cohesion: 0.05
Nodes (59): Dashboard, WearableCoachWidget(), WearableCoachWidgetProps, ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps (+51 more)

### Community 2 - "healthSyncService.ts"
Cohesion: 0.12
Nodes (40): HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult, saveWearableTelemetry(), subscribeToLatestTelemetry() (+32 more)

### Community 3 - "abdmService.ts"
Cohesion: 0.12
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, vite, devDependencies, autoprefixer, eslint (+32 more)

### Community 5 - "reminderService.ts"
Cohesion: 0.07
Nodes (36): NotificationCenter, SmartAlerts, RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps (+28 more)

### Community 6 - "firestore.ts"
Cohesion: 0.17
Nodes (24): fetchData(), ShareReport(), AlertsContext, AlertsProvider(), useAlerts(), ClinicalSummaryRecord, FirestoreErrorInfo, getClinicalSummary() (+16 more)

### Community 7 - "theme_typography_stress.test.tsx"
Cohesion: 0.09
Nodes (18): App(), SettingsPage, SettingsPage(), ThemeToggleHarness(), AuthProvider(), applyTheme(), Theme, ThemeContext (+10 more)

### Community 8 - "biomarkerTrajectoryService.ts"
Cohesion: 0.11
Nodes (24): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, OrganHealthAvatar, OrganHealthAvatar(), OrganHealthAvatarProps, BiomarkerTrajectory (+16 more)

### Community 9 - "fhirService.ts"
Cohesion: 0.10
Nodes (27): FHIRBundle, FHIRResource, LoincMapping, FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType (+19 more)

### Community 10 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 11 - "specialistFactory.ts"
Cohesion: 0.15
Nodes (13): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+5 more)

### Community 12 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 14 - "App.tsx"
Cohesion: 0.10
Nodes (11): ChatCoach, FeedbackWidget, IntegrationsPanel, LabReportsSection, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute(), SpecialistLounge (+3 more)

### Community 15 - "pretext.ts"
Cohesion: 0.17
Nodes (17): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea() (+9 more)

### Community 16 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 17 - "useAuth"
Cohesion: 0.14
Nodes (19): react, react, ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps (+11 more)

### Community 18 - "AuthContext.tsx"
Cohesion: 0.21
Nodes (12): CalendarSync, CalendarEvent, CalendarSync(), SYMPTOMS_LIST, VisitPrepWidget(), AuthContextType, getAccessToken(), FormMetadata (+4 more)

### Community 19 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 20 - "drugInteractionService.ts"
Cohesion: 0.07
Nodes (51): Medications, HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, InteractionMatrix(), loadOpenFdaData() (+43 more)

### Community 21 - "auth-dash.spec.tsx"
Cohesion: 0.25
Nodes (4): AuthContext, ProfileContext, mockAuthContextValue, mockProfileContextValue

### Community 23 - "Reports/LabReportsSection.tsx"
Cohesion: 0.17
Nodes (16): Dashboard(), LabReport, LabReportsSection(), ReportCard(), ReportHistory(), loadData(), Timeline(), getReportHistory() (+8 more)

### Community 24 - "UploadCenter.tsx"
Cohesion: 0.24
Nodes (13): compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64(), UploadCenter() (+5 more)

### Community 26 - "ClinicalHandover.tsx"
Cohesion: 0.24
Nodes (12): jspdf, jspdf, SBARPreview(), SBARPreviewProps, ClinicalHandover(), loadDocuments(), exportToPDF(), generateDoctorReport() (+4 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 29 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 30 - "AdminDashboard.tsx"
Cohesion: 0.25
Nodes (6): AdminDashboard, COLORS, DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps, TimelineSkeleton()

### Community 31 - "usageService.ts"
Cohesion: 0.30
Nodes (11): AdminDashboard(), getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackStorageUsage(), trackUsage() (+3 more)

### Community 32 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 33 - "config.ts"
Cohesion: 0.13
Nodes (15): ConsentScreen, SharedProfile, SharedProfileProps, ConsentScreen(), ConsentScreenProps, steps, logAuditEvent(), app (+7 more)

### Community 34 - "Timeline.tsx"
Cohesion: 0.23
Nodes (14): Timeline, TYPE_CONFIG, saveLabResult(), saveReportHistory(), classifyDocument(), createReminder(), generateRemindersFromAlerts(), executeFullUploadPipeline() (+6 more)

### Community 35 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 36 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.21
Nodes (9): SBARPreview, RegionalAudioPlayer(), RegionalAudioPlayerProps, SBARPreview(), SBARPreviewProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState (+1 more)

### Community 37 - "ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): ErrorBoundary, Props, State, Props, State, logger, TODO: Send to remote observability platform

### Community 38 - "exportToFhirBundle"
Cohesion: 0.29
Nodes (11): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), exportToFhirBundle(), LOINC_DICTIONARY, lookupLoincCode(), mapLabToObservation(), mapProfileToPatient() (+3 more)

### Community 39 - "getDocuments"
Cohesion: 0.20
Nodes (8): MainApp(), LabTrendChart, LabTrendChart(), LabTrendChartProps, fetchDocs(), ExportButton(), ExportButtonProps, getDocuments()

### Community 40 - "package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, private, scripts, build, clean, dev (+8 more)

### Community 41 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 42 - "downloadFhirJson"
Cohesion: 0.24
Nodes (7): ExportModal, DateRange, ExportModal(), ExportModalProps, downloadFHIRBundle(), downloadFhirJson(), exportToFHIR()

### Community 44 - "ProfileManagement.tsx"
Cohesion: 0.36
Nodes (5): ProfileManagement, ProfileManagement(), auth, isRequired(), validateProfileName()

### Community 45 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 46 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 47 - "dependencies"
Cohesion: 0.29
Nodes (7): clsx, dotenv, dependencies, clsx, dotenv, react-dom, react-dom

### Community 49 - "overrides"
Cohesion: 0.33
Nodes (6): overrides, esbuild, ip-address, protobufjs, qs, ws

### Community 50 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 51 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.60
Nodes (4): getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY, SnomedConcept

### Community 52 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 53 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 55 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 56 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **321 isolated node(s):** `TrendSparklinesProps`, `ChatCoachProps`, `ExtractedReportResponse`, `SpecialistAnalysisResponse`, `GeminiInputError` (+316 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `gemini.ts`, `Dashboard.tsx`, `healthSyncService.ts`, `abdmService.ts`, `reminderService.ts`, `firestore.ts`, `theme_typography_stress.test.tsx`, `App.tsx`, `AuthContext.tsx`, `InfoPageLayout.tsx`, `drugInteractionService.ts`, `Reports/LabReportsSection.tsx`, `UploadCenter.tsx`, `PostLoginTransition.tsx`, `ClinicalHandover.tsx`, `LandingPage.tsx`, `PricingModal.tsx`, `AdminDashboard.tsx`, `usageService.ts`, `Timeline.tsx`, `getDocuments`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `useAuth`, `ClinicalHandover.tsx`, `express`, `package.json`, `@chenglou/pretext`, `date-fns`, `express-rate-limit`, `firebase`, `@google/genai`, `html2canvas`, `html-to-image`, `lucide-react`, `motion`, `qrcode.react`, `react-dropzone`, `react-markdown`, `react-router-dom`, `react-window`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `TrendSparklinesProps`, `ChatCoachProps`, `ExtractedReportResponse` to the rest of the system?**
  _321 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06660006660006661 - nodes in this community are weakly interconnected._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05355276907001045 - nodes in this community are weakly interconnected._
- **Should `healthSyncService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12188552188552189 - nodes in this community are weakly interconnected._