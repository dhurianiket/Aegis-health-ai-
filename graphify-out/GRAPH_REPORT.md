# Graph Report - /Users/pavanwagh/antigravity/Aegis-Health-Intelligence  (2026-08-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 976 nodes · 2276 edges · 92 communities (51 shown, 41 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f075e773`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- medical.ts
- useClinicalContext.ts
- gemini.ts
- Timeline.tsx
- SpecialistLounge.tsx
- firestore.ts
- InfoPageLayout.tsx
- usageService.ts
- App.tsx
- pdfExportService.ts
- PaperclipJulesCoordinator
- specialistFactory.ts
- compilerOptions
- PaperclipJulesCoordinator
- Dashboard.tsx
- useProfile
- AuthContext.tsx
- config.ts
- compilerOptions
- devDependencies
- useAuth
- dependencies
- dependencies
- graphify.ts
- ThemeContext.tsx
- MainApp
- functions/package.json
- manifest.json
- AppNav.tsx
- SectionErrorBoundary
- ProfileContext.tsx
- IntegrationsPanel.tsx
- overrides
- jules-sync-staging.sh
- ui.ts
- devDependencies
- MedicalSafetyBanner.tsx
- GlobalErrorBoundary
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
- date-fns
- dotenv
- eslint
- express
- express-rate-limit
- firebase
- @firebase/eslint-plugin-security-rules
- html2canvas
- html-to-image
- motion
- qrcode.react
- react-dropzone
- react-router-dom
- react-window
- clsx
- tailwind-merge
- @tailwindcss/typography
- @tailwindcss/vite
- @vis.gl/react-google-maps
- @vitejs/plugin-react
- zod
- @playwright/test
- tailwindcss
- tsx
- @types/express
- @types/react
- @types/react-dom
- @types/react-window
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- replace-colors.ts
- test-req.cjs

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 64 edges
2. `useProfile()` - 45 edges
3. `getAI()` - 29 edges
4. `LabResult` - 27 edges
5. `parseSafeTimestamp()` - 24 edges
6. `WearableBiometrics` - 22 edges
7. `handleFirestoreError()` - 21 edges
8. `db` - 20 edges
9. `UploadCenter()` - 19 edges
10. `getDocuments()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `TrendSparklines()` --references--> `react`  [EXTRACTED]
  src/components/Dashboard/TrendSparklines.tsx → package.json
- `SplashScreen()` --references--> `react`  [EXTRACTED]
  src/components/Onboarding/SplashScreen.tsx → package.json
- `NoteAnalyzer()` --references--> `react`  [EXTRACTED]
  src/components/Upload/NoteAnalyzer.tsx → package.json
- `UploadCenter()` --references--> `react`  [EXTRACTED]
  src/components/Upload/UploadCenter.tsx → package.json
- `exportToPDF()` --references--> `jspdf`  [EXTRACTED]
  src/services/pdfExportService.ts → package.json

## Import Cycles
- None detected.

## Communities (92 total, 41 thin omitted)

### Community 0 - "medical.ts"
Cohesion: 0.08
Nodes (49): WearableCoachWidget(), WearableCoachWidgetProps, ComparativeAnalysis(), ComparativeAnalysisProps, simpleHash(), useWearableTelemetry(), UseWearableTelemetryResult, subscribeToLatestTelemetry() (+41 more)

### Community 1 - "useClinicalContext.ts"
Cohesion: 0.06
Nodes (40): HeroMetric(), HeroMetricProps, ReportComparison(), ReportComparisonProps, SYMPTOMS_LIST, VisitPrepWidget(), DateRange, ExportModal() (+32 more)

### Community 2 - "gemini.ts"
Cohesion: 0.07
Nodes (49): ChatCoach(), ChatCoachProps, NoteAnalyzer(), useCoach(), getAI(), streamGenerate(), Type, buildCoachPromptAugmentation() (+41 more)

### Community 3 - "Timeline.tsx"
Cohesion: 0.07
Nodes (44): RemindersWidget(), RemindersWidgetProps, SmartAlerts(), NotificationCenterProps, TYPE_CONFIG, AlertBanner(), AlertBannerProps, AlertsContextType (+36 more)

### Community 4 - "SpecialistLounge.tsx"
Cohesion: 0.07
Nodes (42): ChatMessage, VirtualizedChatList(), VirtualizedChatListProps, renderCitationLink(), CorrelationMatrix(), CorrelationMatrixProps, CycleTrackingWidget(), aggregateLabs() (+34 more)

### Community 5 - "firestore.ts"
Cohesion: 0.08
Nodes (47): ShareReport(), compressImageIfNeeded(), EXTRACTION_STEPS, FileItem, generateSuggestedTags(), getMimeType(), isSafari, readFileAsSafeBase64() (+39 more)

### Community 6 - "InfoPageLayout.tsx"
Cohesion: 0.06
Nodes (17): ErrorBoundary, Props, State, InfoPageLayout(), InfoPageLayoutProps, BENTO_LABS, CHAOS_TEXT, EXPLORE_PAGES (+9 more)

### Community 7 - "usageService.ts"
Cohesion: 0.08
Nodes (32): engines, node, name, overrides, esbuild, ip-address, protobufjs, qs (+24 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (33): AboutUs, AdminDashboard, BlogCBC, BlogHbA1c, CalendarSync, CareMap, ChatCoach, ConsentScreen (+25 more)

### Community 9 - "pdfExportService.ts"
Cohesion: 0.16
Nodes (19): jspdf, jspdf, SBARPreview(), SBARPreviewProps, SBARPreview(), SBARPreviewProps, ConsentScreen(), ConsentScreenProps (+11 more)

### Community 10 - "PaperclipJulesCoordinator"
Cohesion: 0.12
Nodes (10): app_1, https_1, crypto, firestore_1, https_1, firestore_1, genai_1, getAiClient() (+2 more)

### Community 11 - "specialistFactory.ts"
Cohesion: 0.15
Nodes (13): getCardiologistPrompt(), getDermatologistPrompt(), getEndocrinologistPrompt(), getGastroenterologistPrompt(), getNephrologistPrompt(), getNeurologistPrompt(), getOncologistPrompt(), getOrthopedistPrompt() (+5 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, functions, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+14 more)

### Community 13 - "PaperclipJulesCoordinator"
Cohesion: 0.15
Nodes (7): verifyRecaptcha, handleGitHubWebhook, getAiClient(), getDb(), JulesSessionConfig, PaperclipJulesCoordinator, ValidationResult

### Community 14 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (17): ComparativeAnalysis, CorrelationMatrix, CycleTrackingWidget, EmptyDashboard, HealthRadarChart, LabTrendChart, ShareReport, SmartAlerts (+9 more)

### Community 15 - "useProfile"
Cohesion: 0.19
Nodes (14): CareMap(), DEFAULT_CENTER, PlaceMarker, Dashboard(), LabTrendChart(), LabTrendChartProps, LabReport, LabReportsSection() (+6 more)

### Community 16 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (11): App(), NotificationCategory, NotificationDropdown(), NotificationDropdownProps, AlertsContext, AlertsProvider(), useAlerts(), AuthContextType (+3 more)

### Community 17 - "config.ts"
Cohesion: 0.18
Nodes (11): ProfileManagement(), app, auth, firebaseConfig, getDynamicAuthDomain(), googleProvider, sanitizeDomain(), storage (+3 more)

### Community 18 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compileOnSave, compilerOptions, module, noImplicitReturns, noUnusedLocals, outDir, skipLibCheck, sourceMap (+4 more)

### Community 19 - "devDependencies"
Cohesion: 0.18
Nodes (12): autoprefixer, jsdom, devDependencies, autoprefixer, jsdom, @testing-library/dom, @testing-library/react, @types/node (+4 more)

### Community 20 - "useAuth"
Cohesion: 0.23
Nodes (9): ProtectedRoute(), PublicLandingPageRoute(), CalendarEvent, CalendarSync(), PostLoginTransition(), PostLoginTransitionProps, CycleTrackingSettings(), getAccessToken() (+1 more)

### Community 21 - "dependencies"
Cohesion: 0.18
Nodes (11): @chenglou/pretext, lucide-react, dependencies, @chenglou/pretext, lucide-react, react-dom, react-markdown, recharts (+3 more)

### Community 22 - "dependencies"
Cohesion: 0.20
Nodes (10): firebase-admin, firebase-functions, dependencies, firebase-admin, firebase-functions, @google/genai, uuid, @google/genai (+2 more)

### Community 23 - "graphify.ts"
Cohesion: 0.29
Nodes (9): generateGraphifyMarkdown(), getCategory(), GraphNode, LESSONS_FILE, main(), OUTPUT_FILE, parseFile(), scanDirectory() (+1 more)

### Community 24 - "ThemeContext.tsx"
Cohesion: 0.31
Nodes (7): SettingsPage(), applyTheme(), Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme()

### Community 25 - "MainApp"
Cohesion: 0.22
Nodes (7): react, react, MainApp(), ProfileProvider(), GA_MEASUREMENT_ID, trackPageView(), Window

### Community 26 - "functions/package.json"
Cohesion: 0.25
Nodes (7): engines, node, main, name, private, scripts, build

### Community 27 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 28 - "AppNav.tsx"
Cohesion: 0.29
Nodes (6): ALL_DESKTOP_TABS, AppNav(), AppNavProps, bottomTabs, BottomSheet(), BottomSheetProps

### Community 29 - "SectionErrorBoundary"
Cohesion: 0.25
Nodes (3): Props, SectionErrorBoundary, State

### Community 30 - "ProfileContext.tsx"
Cohesion: 0.48
Nodes (5): FamilyHub(), Profile, ProfileContextType, analyzeSharedRisks(), UserProfile

### Community 31 - "IntegrationsPanel.tsx"
Cohesion: 0.60
Nodes (4): IntegrationsPanel(), IntegrationsPanelProps, exportToCSV(), exportToFHIR()

### Community 32 - "overrides"
Cohesion: 0.40
Nodes (5): overrides, protobufjs, qs, uuid, ws

### Community 33 - "jules-sync-staging.sh"
Cohesion: 0.70
Nodes (4): log_error(), log_info(), log_warn(), jules-sync-staging.sh script

### Community 34 - "ui.ts"
Cohesion: 0.60
Nodes (4): BaseComponentProps, ButtonProps, CardProps, StatusBadgeProps

### Community 35 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, typescript, typescript, typescript

### Community 38 - "api.ts"
Cohesion: 0.50
Nodes (3): AIExtractionResponse, ApiResponse, SpecialistAnalysisResponse

### Community 39 - "vite-env.d.ts"
Cohesion: 0.50
Nodes (3): ImportMeta, ImportMetaEnv, Window

### Community 40 - "vite"
Cohesion: 0.67
Nodes (3): vite, vite, vite

## Knowledge Gaps
- **289 isolated node(s):** `http`, `http`, `https_1`, `app_1`, `https_1` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `usageService.ts`, `pdfExportService.ts`, `dependencies`, `MainApp`, `vite`, `date-fns`, `dotenv`, `express`, `express-rate-limit`, `firebase`, `html2canvas`, `html-to-image`, `motion`, `qrcode.react`, `react-dropzone`, `react-router-dom`, `react-window`, `clsx`, `tailwind-merge`, `@tailwindcss/typography`, `@tailwindcss/vite`, `@vis.gl/react-google-maps`, `@vitejs/plugin-react`, `zod`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `medical.ts`, `useClinicalContext.ts`, `gemini.ts`, `Timeline.tsx`, `SpecialistLounge.tsx`, `firestore.ts`, `InfoPageLayout.tsx`, `usageService.ts`, `App.tsx`, `pdfExportService.ts`, `Dashboard.tsx`, `useProfile`, `AuthContext.tsx`, `ThemeContext.tsx`, `MainApp`, `AppNav.tsx`, `ProfileContext.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `devDependencies`, `@playwright/test`, `tailwindcss`, `usageService.ts`, `tsx`, `@types/express`, `@types/react`, `@types/react-dom`, `@types/react-window`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `vite`, `eslint`, `@firebase/eslint-plugin-security-rules`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `http`, `http`, `https_1` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `medical.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07589781562384303 - nodes in this community are weakly interconnected._
- **Should `useClinicalContext.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06335403726708075 - nodes in this community are weakly interconnected._
- **Should `gemini.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0741745816372682 - nodes in this community are weakly interconnected._