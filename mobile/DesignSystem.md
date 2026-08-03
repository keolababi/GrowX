# GrowX Design System — Phase 1

Foundation for the app-wide UI redesign (7 phases total, this is phase 1). Establishes
design tokens and reusable primitives so every later phase builds on the same base.

## Tokens

Source of truth for brand values lives in two places that must stay in sync:

- `mobile/design/*.ts` — plain TS objects (`colors`, `typography`, `spacing`, `radii`, `shadows`),
  consumed via `useTheme()` for cases NativeWind can't reach (icon `color` props, `ActivityIndicator`,
  inline `style` on things like `Avatar` size).
- `mobile/tailwind.config.js` — the same color/spacing/radius values, extended into Tailwind's
  theme so components can use `className` (e.g. `bg-brand-primary`, `text-text-muted`, `p-m`,
  `rounded-card`).

Current brand (dark theme, lime accent — matches the existing app, not a rebrand):

| Token                                  | Value                             |
| -------------------------------------- | --------------------------------- |
| `background.app`                       | `#020B0D`                         |
| `background.paper`                     | `#0D1517`                         |
| `border`                               | `#263033`                         |
| `brand.primary`                        | `#9AF000`                         |
| `text.primary` / `secondary` / `muted` | `#FFFFFF` / `#D6DBDC` / `#A7AEB0` |

If the brand palette changes, update both files — there's no build step that generates one from
the other.

## Primitives (`mobile/components/ui/`)

- **Button** — `variant`: `primary` \| `secondary` \| `ghost`, `size`: `md` \| `sm`, plus `loading`.
- **TextInput** — thin wrapper over RN's `TextInput` with token styling; passes through standard
  RN text input props (`secureTextEntry`, `keyboardType`, etc).
- **Card** — bordered container, accepts `className` to extend/override.
- **Avatar** — falls back to a placeholder icon when no `source` is given.
- **Icon** — thin wrapper over `@expo/vector-icons` `Ionicons`.
- **BottomSheet** — real modal (`visible`/`onClose` props) using RN's `Modal`, not a static overlay.
- **Tabs** — controlled `activeIndex`/`onChange`.

## Usage

```tsx
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';

<Card>
  <TextInput placeholder="What are you building?" />
  <Button title="Post" onPress={() => {}} />
</Card>;
```

For values not expressible via `className` (e.g. an icon's `color`, or a size computed in JS):

```tsx
import { useTheme } from '@/design/ThemeProvider';

const { colors, spacing } = useTheme();
```

## What's not in Phase 1

Existing screens (`app/**`) are untouched — this phase only lays down tokens and primitives.
Migrating screens to use them is later-phase work.
