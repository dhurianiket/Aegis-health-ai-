# Graph Report - Aegis-Health-Intelligence  (2026-08-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1265 nodes · 3142 edges · 107 communities (69 shown, 38 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `566a5f21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- medical.ts
- Settings/IntegrationsPanel.tsx
- abdmService.ts
- Dashboard.tsx
- devDependencies
- Timeline.tsx
- useAuth
- firestore.ts
- biomarkerTrajectoryService.ts
- PaperclipJulesCoordinator
- specialistFactory.ts
- ChatCoach.tsx
- gemini.ts
- functions/package.json
- compilerOptions
- App.tsx
- fhirService.ts
- PaperclipJulesCoordinator
- fhir.ts
- typography_contrast.test.tsx
- auditLogService.ts
- InfoPageLayout.tsx
- NoteAnalyzer.tsx
- drugInteractionService.ts
- ClinicalHandover.tsx
- UploadCenter.tsx
- coachService.ts
- PricingModal.tsx
- milestone3_empirical_stress.spec.tsx
- ProfileContext.tsx
- sbar_pdf_druglab_stress.test.ts
- useClinicalContext.ts
- measurementProtocolService.ts
- ErrorBoundary.tsx
- compilerOptions
- package.json
- main.tsx
- pillar1_abdm_audio_snomed.test.ts
- SpecialistLounge.tsx
- Medications.tsx
- FoodInteractionMatrix.tsx
- theme_typography_stress.test.tsx
- usageService.ts
- ExportModal.tsx
- AuthContext.tsx
- scripts
- graphify.ts
- LandingPage.tsx
- RegionalVoiceService
- manifest.json
- ProfileManagement.tsx
- Reports/LabReportsSection.tsx
- SectionErrorBoundary
- dependencies
- Dashboard/SBARPreview.tsx
- CareMap.tsx
- AIErrorBoundary
- VoiceService
- jules-sync-staging.sh
- CalendarSync.tsx
- ui.ts
- SharedProfile.tsx
- MedicalSafetyBanner.tsx
- api.ts
- vite-env.d.ts
- server.ts
- ConditionTile.tsx
- SmartAlertCard.tsx
- SplashScreen.tsx
- LoadingSpinner.tsx
- qrCodeService.ts
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
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `generateDoctorReport()` --references--> `jspdf`  [EXTRACTED]
  src/services/pdfExportService.ts → package.json
- `ComparativeAnalysisProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/ComparativeAnalysis.tsx → src/types/medical.ts
- `CorrelationMatrixProps` --references--> `LabResult`  [EXTRACTED]
  src/components/Dashboard/CorrelationMatrix.tsx → src/types/medical.ts
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (107 total, 38 thin omitted)

### Community 0 - "medical.ts"
Cohesion: 0.06
Nodes (49): NotificationCenter, SmartAlerts, SmartAlerts(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps, NotificationCenterProps, AlertBanner() (+41 more)

### Community 1 - "Settings/IntegrationsPanel.tsx"
Cohesion: 0.11
Nodes (46): WearableCoachWidget(), WearableCoachWidgetProps, HealthConnectModal(), HealthConnectModalProps, IntegrationsPanel(), IntegrationsPanelProps, useWearableTelemetry(), UseWearableTelemetryResult (+38 more)

### Community 2 - "abdmService.ts"
Cohesion: 0.12
Nodes (43): AbdmConnectModal(), AbdmConnectModalProps, AbdmScanShareModal(), AbdmScanShareModalProps, checkAbhaAddressAvailability(), confirmAbdmOtp(), createAbhaAddress(), DEFAULT_CARE_CONTEXTS (+35 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (26): Dashboard, Particle, ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget() (+18 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, @firebase/eslint-plugin-security-rules, jsdom, vite, devDependencies, autoprefixer, eslint (+32 more)

### Community 5 - "Timeline.tsx"
Cohesion: 0.10
Nodes (29): Timeline, RemindersWidget(), RemindersWidgetProps, fetchDocs(), TYPE_CONFIG, DashboardSkeleton(), SkeletonLoader(), SkeletonLoaderProps (+21 more)

### Community 6 - "useAuth"
Cohesion: 0.10
Nodes (24): react, react, MainApp(), SettingsPage, ChatCoach(), LabTrendChart, LabTrendChart(), LabTrendChartProps (+16 more)

### Community 7 - "firestore.ts"
Cohesion: 0.19
Nodes (26): fetchData(), ShareReport(), ClinicalSummaryRecord, FirestoreErrorInfo, getClinicalSummary(), getConversations(), getDocuments(), getFamilyRelations() (+18 more)

### Community 8 - "biomarkerTrajectoryService.ts"
Cohesion: 0.11
Nodes (24): BiomarkerTrajectoryWidget(), BiomarkerTrajectoryWidgetProps, DEFAULT_SAMPLE_DATA, BiomarkerTrajectoryWidget, OrganHealthAvatar, OrganHealthAvatar(), OrganHealthAvatarProps, BiomarkerTrajectory (+16 more)

### Community 9 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 10 - "specialistFactory.ts"
Cohesion: 0.15
Nodes (13): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+5 more)

### Community 11 - "ChatCoach.tsx"
Cohesion: 0.16
Nodes (15): ChatCoach, FamilyHub, ChatCoachProps, FamilyHub(), getAI(), streamGenerate(), Type, mockGenerateContent (+7 more)

### Community 12 - "gemini.ts"
Cohesion: 0.14
Nodes (21): analyzeWithSpecialist(), ExtractedReportResponse, SAFETY_GUARDRAIL(), SPECIALIST_PROMPTS, SpecialistAnalysisResponse, extractLabData(), GeminiInputError, GeminiQuotaError (+13 more)

### Community 13 - "functions/package.json"
Cohesion: 0.09
Nodes (22): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, devDependencies (+14 more)

### Community 14 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 15 - "App.tsx"
Cohesion: 0.10
Nodes (12): AboutUs, ExportModal, FeedbackWidget, IntegrationsPanel, LabReportsSection, PrivacyPolicy, ProtectedRoute(), PublicLandingPageRoute() (+4 more)

### Community 16 - "fhirService.ts"
Cohesion: 0.21
Nodes (19): convertReportToFHIRBundle(), convertToFHIRObservation(), convertToFHIRPatient(), downloadFHIRBundle(), exportToFhirBundle(), FHIRBundle, FHIRResource, LOINC_DICTIONARY (+11 more)

### Community 17 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 18 - "fhir.ts"
Cohesion: 0.11
Nodes (21): FhirAddress, FhirAttachment, FhirBundle, FhirBundleEntry, FhirBundleType, FhirCodeableConcept, FhirContactPoint, FhirDiagnosticReport (+13 more)

### Community 19 - "typography_contrast.test.tsx"
Cohesion: 0.13
Nodes (10): HeroMetric(), HeroMetricProps, ReportComparison(), fetchData(), ReportComparisonProps, MOCK_PROFILE, MOCK_USER, compareReports() (+2 more)

### Community 20 - "auditLogService.ts"
Cohesion: 0.23
Nodes (16): SecurityAuditViewer(), ZeroKnowledgeVaultModal(), AuditActionType, clearAuditLogs(), computeSha256(), getAuditLogs(), getDefaultSampleLogs(), logSecurityEvent() (+8 more)

### Community 21 - "InfoPageLayout.tsx"
Cohesion: 0.13
Nodes (7): BlogCBC, BlogHbA1c, EngineeringPlaybook, HowItWorks, SecurityFirst, InfoPageLayout(), InfoPageLayoutProps

### Community 22 - "NoteAnalyzer.tsx"
Cohesion: 0.20
Nodes (14): LabCardData, MasonryLabCards(), MasonryLabCardsProps, AutoSizeTextarea(), AutoSizeTextareaProps, FixedSizeText(), FixedSizeTextProps, cache (+6 more)

### Community 23 - "drugInteractionService.ts"
Cohesion: 0.17
Nodes (18): loadOpenFdaData(), AdverseEventReaction, BlackBoxWarning, cacheOpenFdaSummary(), cacheRxCuiMatch(), cleanDrugQuery(), ClinicalCitation, CURATED_FDA_KNOWLEDGE_BASE (+10 more)

### Community 24 - "ClinicalHandover.tsx"
Cohesion: 0.22
Nodes (13): ConsentScreen, SBARPreview(), SBARPreviewProps, ConsentScreen(), ConsentScreenProps, steps, ClinicalHandover(), logAuditEvent() (+5 more)

### Community 25 - "UploadCenter.tsx"
Cohesion: 0.20
Nodes (16): UploadCenter, compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64() (+8 more)

### Community 26 - "coachService.ts"
Cohesion: 0.22
Nodes (13): useCoach(), buildCoachPromptAugmentation(), COACH_SYSTEM_INSTRUCTION, CoachResponse, getCoachResponse(), CORE_SYSTEM_PROMPT, FORBIDDEN_PHRASES, MANDATORY_DISCLAIMERS (+5 more)

### Community 27 - "PricingModal.tsx"
Cohesion: 0.20
Nodes (12): PricingModal, PricingModal(), PricingModalProps, CouponData, DEFAULT_LAUNCH_COUPON, redeemCoupon(), RedeemCouponResult, initiateRazorpayPayment() (+4 more)

### Community 28 - "milestone3_empirical_stress.spec.tsx"
Cohesion: 0.14
Nodes (11): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), CLINICAL_GUIDELINES, ClinicalGuideline, MedicalSource, SOURCES (+3 more)

### Community 29 - "ProfileContext.tsx"
Cohesion: 0.14
Nodes (8): EmptyDashboard, AuthContext, Profile, ProfileContext, ProfileContextType, UserProfile, mockAuthContextValue, mockProfileContextValue

### Community 30 - "sbar_pdf_druglab_stress.test.ts"
Cohesion: 0.25
Nodes (13): InteractionMatrix(), InteractionMatrixProps, BioRegimenSafetySummary, buildBioRegimenSafetySummary(), DRUG_CATEGORIES, DrugLabContraindication, evaluateDrugLabContraindications(), isMedInCategory() (+5 more)

### Community 31 - "useClinicalContext.ts"
Cohesion: 0.22
Nodes (10): AdminDashboard, AdminDashboard(), COLORS, SYMPTOMS_LIST, VisitPrepWidget(), FormMetadata, FormResponse, getForm() (+2 more)

### Community 32 - "measurementProtocolService.ts"
Cohesion: 0.25
Nodes (11): GA_API_SECRET, GA_MEASUREMENT_ID, getOrCreateClientId(), MeasurementProtocolEvent, sendMeasurementProtocolEvent(), SendTelemetryOptions, GA_MEASUREMENT_ID, getGtag() (+3 more)

### Community 33 - "ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): ErrorBoundary, Props, State, Props, State, logger, TODO: Send to remote observability platform

### Community 34 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 35 - "package.json"
Cohesion: 0.15
Nodes (12): engines, node, name, overrides, esbuild, ip-address, protobufjs, qs (+4 more)

### Community 36 - "main.tsx"
Cohesion: 0.17
Nodes (8): App(), Toast, ToastContext, ToastContextType, ToastProvider(), ToastType, GlobalErrorBoundary, rootElement

### Community 37 - "pillar1_abdm_audio_snomed.test.ts"
Cohesion: 0.24
Nodes (9): RegionalAudioPlayer(), RegionalAudioPlayerProps, INDIAN_LANGUAGES, IndianLanguageOption, SpeechState, getSnomedCoding(), mapToSnomedCodeableConcepts(), SNOMED_DICTIONARY (+1 more)

### Community 38 - "SpecialistLounge.tsx"
Cohesion: 0.25
Nodes (13): SpecialistLounge(), formatContextForPrompt(), generateSBAR(), CachedReport, FirestoreErrorInfo, generateSourceHash(), getCachedReport(), handleFirestoreError() (+5 more)

### Community 39 - "Medications.tsx"
Cohesion: 0.41
Nodes (10): Medications, Medications(), useClinicalContext(), db, explainInteraction(), checkInteractions(), getActiveMedications(), getInteractions() (+2 more)

### Community 40 - "FoodInteractionMatrix.tsx"
Cohesion: 0.24
Nodes (9): FoodInteractionMatrix, DEFAULT_SAMPLE_MEDS, FoodInteractionMatrix(), FoodInteractionMatrixProps, DetectedFoodInteraction, evaluateFoodInteractions(), FOOD_RULES, FoodContraindicationRule (+1 more)

### Community 41 - "theme_typography_stress.test.tsx"
Cohesion: 0.21
Nodes (6): ThemeToggleHarness(), applyTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider()

### Community 42 - "usageService.ts"
Cohesion: 0.38
Nodes (9): getAllUsersUsage(), getEstCost(), getUserUsageStats(), markUserActive(), SubscriptionPlanId, trackUsage(), updateGlobalStats(), UsageData (+1 more)

### Community 43 - "ExportModal.tsx"
Cohesion: 0.22
Nodes (8): jspdf, jspdf, DateRange, ExportModal(), ExportModalProps, ExportButton(), ExportButtonProps, exportToPDF()

### Community 44 - "AuthContext.tsx"
Cohesion: 0.24
Nodes (9): AuthContextType, AuthProvider(), app, auth, firebaseConfig, getDynamicAuthDomain(), googleProvider, sanitizeDomain() (+1 more)

### Community 45 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, dev, graphify, graphify:full, lint, preview (+2 more)

### Community 46 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 47 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (7): LandingPage, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES, LandingPage(), SPECIALISTS_SHOWCASE, LegalModalProps

### Community 49 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 50 - "ProfileManagement.tsx"
Cohesion: 0.36
Nodes (5): ProfileManagement, ProfileManagement(), isRequired(), validateProfileName(), Gender

### Community 51 - "Reports/LabReportsSection.tsx"
Cohesion: 0.29
Nodes (10): Dashboard(), LabReport, ReportCard(), ReportHistory(), loadData(), Timeline(), getReportHistory(), getSourceForMarker() (+2 more)

### Community 52 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 53 - "dependencies"
Cohesion: 0.29
Nodes (7): @chenglou/pretext, clsx, dependencies, @chenglou/pretext, clsx, react-dom, react-dom

### Community 54 - "Dashboard/SBARPreview.tsx"
Cohesion: 0.43
Nodes (5): SBARPreview(), SBARPreviewProps, escapeHtml(), exportOpdConsultationPdf(), OpdPdfInputData

### Community 55 - "CareMap.tsx"
Cohesion: 0.33
Nodes (4): CareMap, CareMap(), DEFAULT_CENTER, PlaceMarker

### Community 59 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 60 - "CalendarSync.tsx"
Cohesion: 0.50
Nodes (4): CalendarSync, CalendarEvent, CalendarSync(), getAccessToken()

### Community 61 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 64 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 65 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

## Knowledge Gaps
- **331 isolated node(s):** `NotificationCategory`, `NotificationDropdownProps`, `NotificationCenterProps`, `InteractionRule`, `AlertContextType` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `medical.ts`, `Settings/IntegrationsPanel.tsx`, `abdmService.ts`, `Dashboard.tsx`, `Timeline.tsx`, `firestore.ts`, `ChatCoach.tsx`, `App.tsx`, `typography_contrast.test.tsx`, `InfoPageLayout.tsx`, `NoteAnalyzer.tsx`, `ClinicalHandover.tsx`, `UploadCenter.tsx`, `PricingModal.tsx`, `ProfileContext.tsx`, `useClinicalContext.ts`, `SpecialistLounge.tsx`, `Medications.tsx`, `AuthContext.tsx`, `LandingPage.tsx`, `Reports/LabReportsSection.tsx`, `CalendarSync.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `useAuth`, `package.json`, `ExportModal.tsx`, `date-fns`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `@google/genai`, `html2canvas`, `html-to-image`, `lucide-react`, `motion`, `qrcode.react`, `react-dropzone`, `react-markdown`, `react-router-dom`, `react-window`, `recharts`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `NotificationCategory`, `NotificationDropdownProps`, `NotificationCenterProps` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `medical.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06335403726708075 - nodes in this community are weakly interconnected._
- **Should `Settings/IntegrationsPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `abdmService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12336719883889695 - nodes in this community are weakly interconnected._