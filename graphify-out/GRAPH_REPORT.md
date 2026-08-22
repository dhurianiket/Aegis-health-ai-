# Graph Report - Aegis-Health-Intelligence  (2026-08-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1283 nodes · 3197 edges · 83 communities (62 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d975a148`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- medical.ts
- gemini.ts
- Settings/IntegrationsPanel.tsx
- SpecialistLounge.tsx
- abdmService.ts
- drugInteractionService.ts
- main.tsx
- Dashboard.tsx
- devDependencies
- HolographicBodyScanner.tsx
- Timeline.tsx
- dependencies
- App.tsx
- firestore.ts
- PaperclipJulesCoordinator
- Reports/LabReportsSection.tsx
- fhir.ts
- functions/package.json
- compilerOptions
- useProfile
- RegionalVoiceService
- InfoPageLayout.tsx
- typography_contrast.test.tsx
- auditLogService.ts
- AuthContext.tsx
- fhirService.ts
- usageService.ts
- ProfileContext.tsx
- PricingModal.tsx
- useAuth
- MainApp
- UploadCenter.tsx
- ErrorBoundary.tsx
- compilerOptions
- package.json
- getDocuments
- SettingsPage.tsx
- scripts
- graphify.ts
- LandingPage.tsx
- Dashboard/SBARPreview.tsx
- ProfileManagement.tsx
- config.ts
- manifest.json
- AppNav.tsx
- SectionErrorBoundary
- CareMap.tsx
- AIErrorBoundary
- VoiceService
- jules-sync-staging.sh
- ui.ts
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- vite
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- SplashScreen.tsx
- LoadingSpinner.tsx
- vite.config.ts
- fetch-test.js
- test2.js
- @chenglou/pretext
- html2canvas
- lucide-react
- motion
- qrcode.react
- react-dom
- react-dropzone
- tailwind-merge
- replace-colors.ts
- test-req.cjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 74 edges
2. `useProfile()` - 45 edges
3. `parseSafeTimestamp()` - 33 edges
4. `getAI()` - 27 edges
5. `LabResult` - 25 edges
6. `exportToFhirBundle()` - 25 edges
7. `WearableBiometrics` - 23 edges
8. `getDocuments()` - 22 edges
9. `handleFirestoreError()` - 21 edges
10. `db` - 20 edges

## Surprising Connections (you probably didn't know these)
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `Profile` --inherits--> `UserProfile`  [EXTRACTED]
  src/context/ProfileContext.tsx → src/types/medical.ts
- `ProfileContextType` --references--> `UserProfile`  [EXTRACTED]
  src/context/ProfileContext.tsx → src/types/medical.ts
- `UseWearableTelemetryResult` --references--> `WearableBiometrics`  [EXTRACTED]
  src/hooks/useWearableTelemetry.ts → src/types/wearables.ts
- `ComparativeAnalysisProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/ComparativeAnalysis.tsx → src/types/medical.ts

## Import Cycles
- None detected.

## Communities (83 total, 21 thin omitted)

### Community 0 - "medical.ts"
Cohesion: 0.05
Nodes (67): NotificationCenter, SmartAlerts, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps, NotificationCenterProps, CycleTrackingSettings() (+59 more)

### Community 1 - "gemini.ts"
Cohesion: 0.06
Nodes (55): react, react, FamilyHub, LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea(), AutoSizeTextareaProps (+47 more)

### Community 2 - "Settings/IntegrationsPanel.tsx"
Cohesion: 0.11
Nodes (43): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+35 more)

### Community 3 - "SpecialistLounge.tsx"
Cohesion: 0.07
Nodes (39): SpecialistLounge, ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), SpecialistLounge(), formatContextForPrompt(), getPatientContext() (+31 more)

### Community 4 - "abdmService.ts"
Cohesion: 0.13
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 5 - "drugInteractionService.ts"
Cohesion: 0.09
Nodes (39): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, InteractionMatrix(), loadOpenFdaData(), InteractionMatrixProps, AdverseEventReaction (+31 more)

### Community 6 - "main.tsx"
Cohesion: 0.07
Nodes (21): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult, App() (+13 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (23): Particle, ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), ATTENTION_STATUSES (+15 more)

### Community 8 - "devDependencies"
Cohesion: 0.05
Nodes (37): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, devDependencies, autoprefixer, eslint, @firebase/eslint-plugin-security-rules (+29 more)

### Community 9 - "HolographicBodyScanner.tsx"
Cohesion: 0.09
Nodes (29): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, HolographicBodyScanner, OrganHealthAvatar, HolographicBodyScanner(), HolographicBodyScannerProps (+21 more)

### Community 10 - "Timeline.tsx"
Cohesion: 0.11
Nodes (26): RemindersWidget(), RemindersWidgetProps, TYPE_CONFIG, DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps, TimelineSkeleton(), RemindersContext (+18 more)

### Community 11 - "dependencies"
Cohesion: 0.06
Nodes (35): clsx, date-fns, dotenv, express, express-rate-limit, firebase, @google/genai, html-to-image (+27 more)

### Community 12 - "App.tsx"
Cohesion: 0.09
Nodes (13): ChatCoach, Dashboard, FeedbackWidget, IntegrationsPanel, Medications, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute() (+5 more)

### Community 13 - "firestore.ts"
Cohesion: 0.18
Nodes (23): ShareReport(), ClinicalSummaryRecord, deleteDocumentRecord(), FirestoreErrorInfo, getClinicalSummary(), getConversations(), getFamilyRelations(), getHealthScores() (+15 more)

### Community 14 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 15 - "Reports/LabReportsSection.tsx"
Cohesion: 0.15
Nodes (20): LabReportsSection, Dashboard(), BiomarkerSparkline(), FourZoneRangeBar(), getPlainEnglishSummary(), LabObservationItem, LabReport, PLAIN_ENGLISH_EXPLANATIONS (+12 more)

### Community 16 - "fhir.ts"
Cohesion: 0.10
Nodes (24): FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint (+16 more)

### Community 17 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 18 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 19 - "useProfile"
Cohesion: 0.19
Nodes (16): jspdf, jspdf, ExportModal, DateRange, ExportModal(), ExportModalProps, SBARPreview(), SBARPreviewProps (+8 more)

### Community 20 - "RegionalVoiceService"
Cohesion: 0.15
Nodes (9): RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, RegionalVoiceService, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY (+1 more)

### Community 21 - "InfoPageLayout.tsx"
Cohesion: 0.12
Nodes (8): AboutUs, BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 22 - "typography_contrast.test.tsx"
Cohesion: 0.13
Nodes (10): HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, MOCK_PROFILE, MOCK_USER, compareReports() (+2 more)

### Community 23 - "auditLogService.ts"
Cohesion: 0.23
Nodes (16): SecurityAuditViewer(), ZeroKnowledgeVaultModal(), AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent() (+8 more)

### Community 24 - "AuthContext.tsx"
Cohesion: 0.19
Nodes (13): CalendarSync, CalendarEvent, CalendarSync(), SYMPTOMS_LIST, VisitPrepWidget(), AuthContextType, getAccessToken(), googleProvider (+5 more)

### Community 25 - "fhirService.ts"
Cohesion: 0.29
Nodes (15): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), downloadFHIRBundle(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY (+7 more)

### Community 26 - "usageService.ts"
Cohesion: 0.24
Nodes (13): AdminDashboard, AdminDashboard(), COLORS, getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId (+5 more)

### Community 27 - "ProfileContext.tsx"
Cohesion: 0.13
Nodes (8): AuthContext, Profile, ProfileContext, ProfileContextType, mockAuthContextValue, mockProfileContextValue, mockAuthContextValue, mockProfileContextValue

### Community 28 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 29 - "useAuth"
Cohesion: 0.29
Nodes (13): ChatCoach(), ChatCoachProps, Medications(), PostLoginTransition(), PostLoginTransitionProps, useAuth(), useClinicalContext(), db (+5 more)

### Community 30 - "MainApp"
Cohesion: 0.23
Nodes (12): MainApp(), GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID (+4 more)

### Community 31 - "UploadCenter.tsx"
Cohesion: 0.22
Nodes (14): UploadCenter, compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64() (+6 more)

### Community 32 - "ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): ErrorBoundary, Props, State, Props, State, logger, TODO: Send to remote observability platform

### Community 33 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 34 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, name, overrides, esbuild, ip-address, protobufjs, qs (+4 more)

### Community 35 - "getDocuments"
Cohesion: 0.18
Nodes (10): aggregateLabs(), fetchData(), LabTrendChart, LabTrendChart(), LabTrendChartProps, loadDocuments(), fetchDocs(), ExportButton() (+2 more)

### Community 36 - "SettingsPage.tsx"
Cohesion: 0.24
Nodes (9): ConsentScreen, SettingsPage, ConsentScreen(), ConsentScreenProps, steps, SettingsPage(), ThemeToggleHarness(), useTheme() (+1 more)

### Community 37 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 38 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 39 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 40 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.27
Nodes (8): SBARPreview, RegionalAudioPlayer(), SBARPreview(), SBARPreviewProps, escapeHtml(), exportOpdConsultationPdf(), OpdPdfInputData, SBARSummary

### Community 41 - "ProfileManagement.tsx"
Cohesion: 0.31
Nodes (6): ProfileManagement, ProfileManagement(), auth, isRequired(), validateProfileName(), Gender

### Community 42 - "config.ts"
Cohesion: 0.25
Nodes (6): app, firebaseConfig, getDynamicAuthDomain(), sanitizeDomain(), storage, ShareOptions

### Community 43 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 44 - "AppNav.tsx"
Cohesion: 0.29
Nodes (6): ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 45 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 46 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 49 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 50 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 53 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 54 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

### Community 55 - "vite"
Cohesion: 0.67
Nodes (3): vite, vite, vite

## Knowledge Gaps
- **337 isolated node(s):** `BiometricDiagnosticInsight`, `BiometricPoint`, `DailyWearableSummary`, `CoachResponse`, `SafetyCheckResult` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `medical.ts`, `gemini.ts`, `Settings/IntegrationsPanel.tsx`, `SpecialistLounge.tsx`, `abdmService.ts`, `Dashboard.tsx`, `Timeline.tsx`, `App.tsx`, `firestore.ts`, `Reports/LabReportsSection.tsx`, `useProfile`, `InfoPageLayout.tsx`, `typography_contrast.test.tsx`, `AuthContext.tsx`, `usageService.ts`, `ProfileContext.tsx`, `PricingModal.tsx`, `MainApp`, `UploadCenter.tsx`, `getDocuments`, `SettingsPage.tsx`, `LandingPage.tsx`, `AppNav.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@chenglou/pretext`, `package.json`, `lucide-react`, `html2canvas`, `motion`, `qrcode.react`, `gemini.ts`, `react-dom`, `react-dropzone`, `tailwind-merge`, `useProfile`, `vite`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`, `vite`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `BiometricDiagnosticInsight`, `BiometricPoint`, `DailyWearableSummary` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `medical.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05240549828178694 - nodes in this community are weakly interconnected._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060641627543035995 - nodes in this community are weakly interconnected._
- **Should `Settings/IntegrationsPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11412429378531073 - nodes in this community are weakly interconnected._