

## Plan: Add "Период оказания услуг" to contract specifications

### Problem
The service period (deadline) field is entered in the UI but never appears in the specification (Приложение №1) of FRDO, NMO, or generic contracts. The user wants the period displayed in the specification section.

### Changes

#### 1. Edit `src/lib/frdo-contract-template.ts`
After the client name line (line 244) and before the services table, add:
```html
<p>Период оказания услуг: <strong>${periodText}</strong></p>
```
The `periodText` variable already exists (line 109).

#### 2. Edit `src/lib/nmo-contract-template.ts`
Same addition after the client name (line 235), before the services table. Extract `periodText` from `data.deadline` similarly to the FRDO template.

#### 3. Edit `src/lib/document-templates.ts`
For the generic contract — there's no separate specification appendix, but the deadline is shown in section 2.2. No change needed here unless we want consistency. If the generic contract has no appendix page, skip.

### Files
- **Edit**: `src/lib/frdo-contract-template.ts` — add period line to specification
- **Edit**: `src/lib/nmo-contract-template.ts` — add period line to specification

