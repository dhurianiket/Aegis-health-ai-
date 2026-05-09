# Development Guide

## Project Structure

- `src/components/`: React components categorized by feature area.
  - `ui/`: Reusable, atomic UI components (Buttons, Skeletons, Spinners).
  - `Dashboard/`: High-level analytics and visualization components.
- `src/services/`: Business logic and external API integrations.
  - `ai/`: Gemini implementation and prompts.
  - `medicationCheckService.ts`: Interaction detection logic.
- `src/lib/`: Low-level utilities and database/config files.
- `src/context/`: Global state management (Auth, Profile, Alerts).
- `src/types/`: TypeScript interfaces and enums.

## Data Flow

1. **Upload**: User selects a file in `UploadCenter.tsx`.
2. **Extraction**: `extractMedicalReports` (Gemini) returns structured JSON.
3. **Storage**: Data is saved to Firestore under the user's profile.
4. **Processing**: `AlertsContext` runs `getConsolidatedAlerts` whenever data changes.
5. **Visualization**: Components in `Dashboard/` fetch and render the processed telemetry.

## Adding New Alerts

To update biomarker thresholds, edit `src/services/alertService.ts`:
```typescript
const DEFAULT_THRESHOLDS: Record<string, AlertThreshold> = {
  'NewMarker': { biomarker: 'NewMarker', minNormal: 10, maxNormal: 20, criticalMax: 30 },
};
```

To add new drug interactions, update `src/lib/medicationInteractionDB.ts`:
```typescript
{
  drugs: ['drugA', 'drugB'],
  severity: 'high',
  description: 'Interaction details...'
}
```

## Creating New Charts

We use **Recharts**. Ensure any new charts follow the "Glassmorphism" theme:
- Use `strokeWidth={2}` for lines.
- Use `dot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }}` for markers.
- Utilize the `CustomTooltip` component for consistent styling.

## Testing Strategy

- **Unit Tests**: Always located in `__tests__` subdirectories relative to the source.
- **Mocks**: When testing AI services, mock the `GoogleGenAI` constructor to avoid actual API calls.
- **Component Tests**: Use `@testing-library/react` and `jsdom` for UI verification.
