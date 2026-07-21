# The IELTS Spells Design System

## 1. Creative north star

The product should feel like a calm, capable IELTS mentor: warm enough for a nervous learner, structured enough for teachers and administrators. Preserve the original pink, soft gray, open-book and magic-wand identity. Avoid childish fantasy styling, generic edtech blue, and decorative effects that compete with form tasks.

Design dials: `DESIGN_VARIANCE 6`, `MOTION_INTENSITY 4`, `VISUAL_DENSITY 4`.

## 2. Color system

Light theme:

- Canvas: `#F7F5F4`
- Surface: `#FFFFFF`
- Soft surface: `#F2ECEE`
- Primary text: `#292528`
- Muted text: `#6F676C`
- Border: `#DED7DA`
- Brand accent: `#C85F78`
- Accent hover: `#AD4C64`
- Accent wash: `#F7E5EA`
- Danger: `#B42335`
- Success: `#247052`

Dark theme:

- Canvas: `#181518`
- Surface: `#221E21`
- Soft surface: `#2D272B`
- Primary text: `#F8F3F5`
- Muted text: `#BDB3B8`
- Border: `#443B40`
- Brand accent: `#E18CA0`
- Accent hover: `#ED9DB0`
- Accent wash: `#3A252C`

Use the brand accent for the primary action, active links, focus rings, and meaningful highlights only. Google and Facebook controls remain neutral so provider identity does not fragment the palette.

## 3. Typography

Use `Outfit`, falling back to `Avenir Next`, `Segoe UI`, and sans-serif. Headings use weight 650 to 700 with tight tracking. Body and form copy use weight 400 to 500. Labels use 600. Keep authentication headings within two lines and supporting text below 70 characters where practical.

## 4. Shape and depth

- Inputs and buttons: 12px radius
- Panels: 22px radius
- Small status notices: 12px radius
- Borders: 1px solid token border
- Shadows: one restrained, diffuse shadow on the form surface only

Do not use full pill controls except compact status indicators. Avoid nested cards.

## 5. Authentication layout

Desktop uses a 42/58 asymmetric split. The brand panel provides context and reassurance; the form panel owns the task. The form column is 440px maximum and remains left aligned inside its region. Mobile collapses to one column, retains a compact wordmark, and removes nonessential brand-panel copy.

Form order is stable:

1. Page title and concise explanation
2. Google and Facebook provider actions
3. Text divider
4. Email form fields
5. Primary action
6. Switch between login and registration

Labels always appear above fields. Errors appear below the field or as a form notice. Never rely on placeholder text as a label.

## 6. Interaction states

- Hover: subtle color change or `translateY(-1px)` only
- Focus: visible 3px accent wash plus 1px accent outline
- Pressed: remove translation and slightly darken
- Loading: preserve button width and replace the leading icon with a spinner
- Disabled: reduce contrast without removing the label
- Error and success: icon, title, and actionable copy inside an `aria-live` notice

Transitions use opacity and transform, 160ms to 240ms. Respect `prefers-reduced-motion` and remove nonessential transforms and animation.

## 7. Accessibility and content

- Minimum interactive target: 44px
- Text and controls meet WCAG AA contrast
- Every field uses an explicit label, autocomplete attribute, and associated error text
- Password reveal control has an accessible state label
- OAuth buttons state the provider clearly
- Use Vietnamese copy that is direct and reassuring
- Do not expose raw Supabase error messages to users

## 8. Component vocabulary

`AuthShell`, `BrandPanel`, `AuthForm`, `SocialAuthButtons`, `FormField`, `PasswordField`, `FormNotice`, `SubmitButton`, and `AuthCallback` are the canonical authentication components. Use Phosphor icons only. Reuse this system for reset password and email verification screens later.

## 9. Anti-patterns

- No generic centered card floating over a gradient
- No glassmorphism or heavy glow
- No fake statistics or fabricated testimonials
- No multiple competing accent colors
- No icon-only provider buttons
- No hidden labels, low-contrast placeholders, or ambiguous errors
- No em dash or en dash in visible interface copy
