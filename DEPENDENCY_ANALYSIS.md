# Dependency Analysis Report

**Date**: 2026-02-01  
**Issue**: [Auto-QA] Potentially unused npm dependencies  
**Status**: ✅ All dependencies verified as IN USE

## Summary

The Auto-QA workflow flagged three npm dependencies as potentially unused. After thorough investigation, **all three packages are confirmed to be in active use** and should NOT be removed.

## Findings

### 1. `sucrase` (v3.35.1) - ✅ IN USE

**Direct Usage:**
- File: `web/src/lib/dynamic-cards/compiler.ts` (line 13)
- Usage: Dynamically imported to compile TSX code at runtime
- Purpose: Compiles user-provided dynamic card components

**Indirect Usage:**
- Required by `tailwindcss` as a transitive dependency
- Confirmed via: `npm ls sucrase`

```typescript
// Direct usage in compiler.ts
const { transform } = await import('sucrase')
const result = transform(tsx, {
  transforms: ['typescript', 'jsx'],
  jsxRuntime: 'classic',
  jsxPragma: 'React.createElement',
  jsxFragmentPragma: 'React.Fragment',
  production: true,
})
```

### 2. `@netlify/blobs` (v10.5.0) - ✅ IN USE

**Direct Usage:**
- File: `web/netlify/functions/presence.mts` (line 1)
- Usage: Netlify Edge Function for tracking active user sessions
- Purpose: Stores session data in Netlify Blob storage

**Integration:**
- Configured in `netlify.toml` as an API endpoint
- Endpoint: `/api/active-users` → `/.netlify/functions/presence`
- Referenced in: `web/src/hooks/useActiveUsers.ts` (line 45, 147)

```typescript
// Direct usage in presence.mts
import { getStore } from "@netlify/blobs";
const store = getStore(STORE_NAME);
```

**Why Auto-QA Missed It:**
- The package is used in `netlify/functions/` directory
- Auto-QA only scanned `src/` directory

### 3. `react-is` (v19.2.3) - ✅ IN USE

**Peer Dependency Usage:**
- Required by `recharts` (charting library)
- Required by `prop-types` (via `@react-three/drei` → `react-composer`)
- Confirmed via: `npm ls react-is`

**Dependency Tree:**
```
├─┬ @react-three/drei@9.122.0
│ └─┬ react-composer@5.0.3
│   └─┬ prop-types@15.8.1
│     └── react-is@16.13.1
├── react-is@19.2.3
└─┬ recharts@3.6.0
  └── react-is@19.2.3 deduped
```

**Why Auto-QA Missed It:**
- No direct import statements in application code
- Used as a peer dependency by installed packages

## Verification

### Build Status: ✅ PASSED
```bash
cd web && npm run build
# Result: Successful build (27.65s)
```

### Lint Status: ⚠️ Pre-existing Issues
The lint command shows pre-existing warnings/errors unrelated to these dependencies.

## Conclusion

**NO ACTION REQUIRED** - All three dependencies are actively used:
- `sucrase`: Used for runtime TSX compilation + Tailwind dependency
- `@netlify/blobs`: Used in Netlify Edge Functions
- `react-is`: Used as peer dependency by charting/3D libraries

## Recommendation for Auto-QA Improvement

The Auto-QA scan should be enhanced to:
1. Check all subdirectories (not just `src/`)
2. Detect dynamic imports (`import()` syntax)
3. Check for peer dependencies (`npm ls <package>`)
4. Scan Netlify/Edge function directories
5. Check build tool dependencies (e.g., Tailwind plugins)
