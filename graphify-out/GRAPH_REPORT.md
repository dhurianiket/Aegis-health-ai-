# Graph Report - Aegis-Health-Intelligence  (2026-08-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1298 nodes · 3239 edges · 106 communities (65 shown, 41 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c5a252f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- firestore.ts
- gemini.ts
- Dashboard.tsx
- Settings/IntegrationsPanel.tsx
- SpecialistLounge.tsx
- AlertsContext.tsx
- abdmService.ts
- App.tsx
- HolographicBodyScanner.tsx
- PaperclipJulesCoordinator
- fhir.ts
- compilerOptions
- PaperclipJulesCoordinator
- milestone3_4_empirical_stress.spec.tsx
- health.ts
- AuthContext.tsx
- drugInteractionService.ts
- auditLogService.ts
- useProfile
- ErrorBoundary.tsx
- Reports/LabReportsSection.tsx
- fhirService.ts
- usageService.ts
- ClinicalHandover.tsx
- PricingModal.tsx
- measurementProtocolService.ts
- devDependencies
- compilerOptions
- useAuth
- Medications.tsx
- typography_contrast.test.tsx
- useClinicalContext.ts
- theme_typography_stress.test.tsx
- functions/package.json
- ExportModal.tsx
- pillar1_abdm_audio_snomed.test.ts
- dependencies
- dependencies
- scripts
- graphify.ts
- LandingPage.tsx
- Dashboard/SBARPreview.tsx
- RegionalVoiceService
- overrides
- manifest.json
- ReportComparison.tsx
- SectionErrorBoundary
- package.json
- MainApp
- overrides
- react
- SkeletonLoader.tsx
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
- clsx
- date-fns
- dotenv
- express
- express-rate-limit
- firebase
- eslint
- html2canvas
- html-to-image
- motion
- qrcode.react
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
- @types/express
- @types/node
- @types/react
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
- `SpecialistLounge()` --indirect_call--> `renderCitationLink()`  [INFERRED]
  src/components/Specialists/SpecialistLounge.tsx → src/components/Common/CitationBadge.tsx
- `CycleTrackingSettings()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/Profile/CycleTrackingSettings.tsx → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (106 total, 41 thin omitted)

### Community 0 - "firestore.ts"
Cohesion: 0.05
Nodes (67): Timeline, UploadCenter, ShareReport, ShareReport(), loadDocuments(), fetchDocs(), TYPE_CONFIG, compressImageIfNeeded() (+59 more)

### Community 1 - "gemini.ts"
Cohesion: 0.06
Nodes (60): ChatCoach, ChatCoach(), ChatCoachProps, SpecialistLounge(), NoteAnalyzer(), getAI(), streamGenerate(), Type (+52 more)

### Community 2 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (49): Particle, ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs() (+41 more)

### Community 3 - "Settings/IntegrationsPanel.tsx"
Cohesion: 0.11
Nodes (47): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+39 more)

### Community 4 - "SpecialistLounge.tsx"
Cohesion: 0.06
Nodes (43): SpecialistLounge, ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), LabCardData, MasonryLabCards(), MasonryLabCardsProps (+35 more)

### Community 5 - "AlertsContext.tsx"
Cohesion: 0.06
Nodes (42): App(), NotificationCenter, SmartAlerts, RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCategory, NotificationDropdown() (+34 more)

### Community 6 - "abdmService.ts"
Cohesion: 0.13
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 7 - "App.tsx"
Cohesion: 0.07
Nodes (17): AboutUs, BlogCBC, BlogHbA1c, Dashboard, EngineeringPlaybook, FeedbackWidget, HowItWorks, IntegrationsPanel (+9 more)

### Community 8 - "HolographicBodyScanner.tsx"
Cohesion: 0.09
Nodes (29): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, HolographicBodyScanner, OrganHealthAvatar, HolographicBodyScanner(), HolographicBodyScannerProps (+21 more)

### Community 9 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 10 - "fhir.ts"
Cohesion: 0.10
Nodes (23): FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirCoding, FhirContactPoint (+15 more)

### Community 11 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 12 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 13 - "milestone3_4_empirical_stress.spec.tsx"
Cohesion: 0.13
Nodes (15): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, calculateContrastRatio(), getRelativeLuminance(), hexToRgb(), MOCK_12_MEDICATIONS (+7 more)

### Community 14 - "health.ts"
Cohesion: 0.23
Nodes (15): InteractionMatrix(), InteractionMatrixProps, BioRegimenSafetySummary, buildBioRegimenSafetySummary(), DRUG_CATEGORIES, DrugLabContraindication, evaluateDrugLabContraindications(), isMedInCategory() (+7 more)

### Community 15 - "AuthContext.tsx"
Cohesion: 0.16
Nodes (15): ProfileManagement, CycleTrackingSettings(), ProfileManagement(), AuthContextType, Profile, ProfileContextType, app, auth (+7 more)

### Community 16 - "drugInteractionService.ts"
Cohesion: 0.19
Nodes (18): loadOpenFdaData(), AdverseEventReaction, BlackBoxWarning, cacheOpenFdaSummary(), cacheRxCuiMatch(), cleanDrugQuery(), ClinicalCitation, CURATED_FDA_KNOWLEDGE_BASE (+10 more)

### Community 17 - "auditLogService.ts"
Cohesion: 0.23
Nodes (16): SecurityAuditViewer(), ZeroKnowledgeVaultModal(), AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent() (+8 more)

### Community 18 - "useProfile"
Cohesion: 0.12
Nodes (15): CareMap, FamilyHub, CareMap(), DEFAULT_CENTER, PlaceMarker, ALL_DESKTOP_TABS, AppNav(), AppNavProps (+7 more)

### Community 19 - "ErrorBoundary.tsx"
Cohesion: 0.12
Nodes (8): ErrorBoundary, Props, State, AIErrorBoundary, Props, State, logger, TODO: Send to remote observability platform

### Community 20 - "Reports/LabReportsSection.tsx"
Cohesion: 0.25
Nodes (14): BiomarkerSparkline(), FourZoneRangeBar(), getPlainEnglishSummary(), LabObservationItem, LabReport, PLAIN_ENGLISH_EXPLANATIONS, VisualLabReportCard(), VisualLabReportCardProps (+6 more)

### Community 21 - "fhirService.ts"
Cohesion: 0.23
Nodes (16): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), downloadFHIRBundle(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY (+8 more)

### Community 22 - "usageService.ts"
Cohesion: 0.22
Nodes (12): AdminDashboard, AdminDashboard(), COLORS, AuthProvider(), getAllUsersUsage(), getEstCost(), markUserActive(), SubscriptionPlanId (+4 more)

### Community 23 - "ClinicalHandover.tsx"
Cohesion: 0.21
Nodes (12): ConsentScreen, SBARPreview(), SBARPreviewProps, ConsentScreen(), ConsentScreenProps, steps, ClinicalHandover(), logAuditEvent() (+4 more)

### Community 24 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 25 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 26 - "devDependencies"
Cohesion: 0.15
Nodes (13): autoprefixer, @firebase/eslint-plugin-security-rules, jsdom, devDependencies, autoprefixer, @firebase/eslint-plugin-security-rules, jsdom, @playwright/test (+5 more)

### Community 27 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 28 - "useAuth"
Cohesion: 0.19
Nodes (10): CalendarSync, ProtectedRoute(), PublicLandingPageRoute(), SettingsPage, CalendarEvent, CalendarSync(), PostLoginTransition(), PostLoginTransitionProps (+2 more)

### Community 29 - "Medications.tsx"
Cohesion: 0.32
Nodes (9): Medications, Medications(), db, checkInteractions(), getActiveMedications(), getInteractions(), lookupRxCUI(), saveMedication() (+1 more)

### Community 30 - "typography_contrast.test.tsx"
Cohesion: 0.18
Nodes (4): HeroMetric(), HeroMetricProps, MOCK_PROFILE, MOCK_USER

### Community 31 - "useClinicalContext.ts"
Cohesion: 0.32
Nodes (9): SYMPTOMS_LIST, VisitPrepWidget(), getAccessToken(), useClinicalContext(), FormMetadata, FormResponse, getForm(), getFormResponses() (+1 more)

### Community 32 - "theme_typography_stress.test.tsx"
Cohesion: 0.23
Nodes (7): ThemeToggleHarness(), applyTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme()

### Community 33 - "functions/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, engines, node, main, name, private, scripts (+3 more)

### Community 34 - "ExportModal.tsx"
Cohesion: 0.20
Nodes (9): jspdf, jspdf, ExportModal, DateRange, ExportModal(), ExportModalProps, ExportButton(), ExportButtonProps (+1 more)

### Community 35 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.27
Nodes (8): RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY, SnomedConcept

### Community 36 - "dependencies"
Cohesion: 0.18
Nodes (11): @chenglou/pretext, lucide-react, dependencies, @chenglou/pretext, lucide-react, react-dom, react-dropzone, react-markdown (+3 more)

### Community 37 - "dependencies"
Cohesion: 0.20
Nodes (10): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, @google/genai (+2 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 39 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 40 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 41 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.27
Nodes (8): SBARPreview, RegionalAudioPlayer(), SBARPreview(), SBARPreviewProps, escapeHtml(), exportOpdConsultationPdf(), OpdPdfInputData, SBARSummary

### Community 43 - "overrides"
Cohesion: 0.22
Nodes (9): overrides, dompurify, esbuild, ip-address, js-yaml, nanoid, protobufjs, qs (+1 more)

### Community 44 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 45 - "ReportComparison.tsx"
Cohesion: 0.36
Nodes (6): ReportComparison(), fetchData(), ReportComparisonProps, compareReports(), ComparisonRow, CLINICAL_STABILITY_THRESHOLDS

### Community 46 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 47 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, private, type, version

### Community 48 - "MainApp"
Cohesion: 0.33
Nodes (5): MainApp(), isRequired(), validateProfileName(), checkCanUploadReport(), getUserSubscription()

### Community 49 - "overrides"
Cohesion: 0.33
Nodes (6): overrides, body-parser, protobufjs, qs, uuid, ws

### Community 50 - "react"
Cohesion: 0.33
Nodes (5): react, react, SplashScreen(), SplashScreenProps, ProfileProvider()

### Community 51 - "SkeletonLoader.tsx"
Cohesion: 0.33
Nodes (4): DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps, TimelineSkeleton()

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

### Community 57 - "vite"
Cohesion: 0.67
Nodes (3): vite, vite, vite

## Knowledge Gaps
- **339 isolated node(s):** `Toast`, `ToastContextType`, `ToastType`, `TrendSummary`, `FileItem` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `firestore.ts`, `gemini.ts`, `Dashboard.tsx`, `Settings/IntegrationsPanel.tsx`, `SpecialistLounge.tsx`, `AlertsContext.tsx`, `abdmService.ts`, `App.tsx`, `AuthContext.tsx`, `useProfile`, `Reports/LabReportsSection.tsx`, `usageService.ts`, `ClinicalHandover.tsx`, `PricingModal.tsx`, `Medications.tsx`, `useClinicalContext.ts`, `LandingPage.tsx`, `ReportComparison.tsx`, `MainApp`, `react`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `ExportModal.tsx`, `dependencies`, `package.json`, `react`, `vite`, `clsx`, `date-fns`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `html2canvas`, `html-to-image`, `motion`, `qrcode.react`, `react-router-dom`, `react-window`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `functions/package.json`, `eslint`, `package.json`, `vitest`, `tailwindcss`, `@testing-library/react`, `@types/express`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/react-window`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `vite`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `Toast`, `ToastContextType`, `ToastType` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `firestore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050156739811912224 - nodes in this community are weakly interconnected._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06358024691358025 - nodes in this community are weakly interconnected._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05974124809741248 - nodes in this community are weakly interconnected._