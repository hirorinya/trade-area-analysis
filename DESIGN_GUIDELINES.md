# Trade Area Analysis Platform – Apple-Style Design Guidelines

## 1. Core Philosophy
Our trade area analysis platform builds on the refined design philosophy of Apple's Human Interface Guidelines while expressing its own identity as a professional analytics tool. Centered on the brand's blue, we pursue cleanliness, clarity, and intuitiveness, delivering a user experience that prioritizes accessibility above all else.

## 2. Color System

### Primary Colors (WCAG-compliant)
- **Main Blue** `blue-500 #3B82F6` – primary actions, selected states  
- **Dark Blue** `blue-600 #2563EB` – hover states, emphasis  
- **Emphasis Blue** `blue-700 #1D4ED8` – high-contrast text  
- **Ultra Emphasis Blue** `blue-800 #1E40AF` – text on white backgrounds, AAA compliant  
- **Light Blue** `blue-50 #EFF6FF` – backgrounds, selection areas (use sparingly)  
- **Mid Blue** `blue-100 #DBEAFE` – icon backgrounds (use sparingly)  

### Grayscale (Accessibility-optimized)
- **Primary Text** `gray-900 #111827` – main text (21 : 1 contrast)  
- **Secondary Text** `gray-700 #374151` – supporting text (12.6 : 1)  
- **Caption Text** `gray-600 #4B5563` – annotations (7 : 1)  
- **Muted Text** `gray-500 #6B7280` – less important text (4.5 : 1)  
- **Border** `gray-300 #D1D5DB` – dividers, card outlines  
- **Thin Border** `gray-200 #E5E7EB` – subtle dividers  
- **Background** `#FFFFFF` – default background (avoid tinted backgrounds)  
- **Section BG** `gray-50 #F9FAFB` – use only when necessary  

### System Colors (Contrast-aware)
- **Success** `green-600 #059669` – 7 : 1 contrast  
- **Warning** `amber-600 #D97706` – 7 : 1 contrast  
- **Error** `red-600 #DC2626` – 7 : 1 contrast  
- **Info** `blue-700 #1D4ED8` – 7 : 1 contrast  

### Color Usage Rules
- On white backgrounds, use `gray-700` or darker for text.  
- On blue backgrounds, text is always pure white `#FFFFFF`.  
- Avoid same-hue combinations (e.g., blue button on blue background).  
- Minimize use of very light backgrounds (`-50`, `-100` tones).  
- UI component borders must maintain at least 3 : 1 contrast.

## 3. Corner Radius System

### Component-specific Radii
| Component          | Class / px eq. |
| ------------------ | -------------- |
| Small Button       | `rounded-lg` ≈ 8 px |
| Standard Button    | `rounded-xl` ≈ 12 px |
| Large Button       | `rounded-2xl` ≈ 16 px |
| Card               | `rounded-2xl` ≈ 16 px |
| Modal              | `rounded-3xl` ≈ 24 px |
| Input Field        | `rounded-lg` ≈ 8 px |
| Icon Button        | `rounded-full` (circle) |

#### Corner Radius Principles
- Use a consistent radius within the same component.  
- Nesting components should graduate radii by hierarchy.  
- Avoid excessively large radii.

## 4. Spacing System

### Base Unit (8 px scale)
| Name        | Value  |
| ----------- | ------ |
| X-small     | 2 px (*0.5 unit*) |
| XX-small    | 4 px (*1 unit*)   |
| Small       | 8 px (*2 units*)  |
| Base        | 16 px (*4 units*) |
| Medium      | 24 px (*6 units*) |
| Large       | 32 px (*8 units*) |
| X-large     | 48 px (*12 units*)|
| XX-large    | 64 px (*16 units*)|

#### Button Padding (44 px min touch target)
| Size  | Padding (x / y) | Height |
| ----- | -------------- | ------ |
| Small | `px-3 py-2.5` (12 / 10 px) | ≥ 44 px |
| Standard | `px-6 py-3` (24 / 12 px) | 48 px |
| Large | `px-8 py-4` (32 / 16 px) | 56 px |
| Icon  | `p-3` (12 px) | 48 × 48 px |

#### Card Padding
- Small `p-4 (16 px)`  
- Standard `p-5 (20 px)`  
- Large `p-6 (24 px)`  
- X-large `p-8 (32 px)`  

#### Vertical Spacing
- Between items: `space-y-2` (8 px)  
- Between components: `space-y-4` (16 px)  
- Within sections: `space-y-6` (24 px)  
- Between sections: `space-y-8` (32 px)  
- Major page sections: `space-y-12` (48 px)  

## 5. Shadow Guidelines

### Standard Shadows
| Element                 | Class / Example value |
| ----------------------- | --------------------- |
| Button default          | `shadow-sm` (0 1 2 / 5 %) |
| Button hover            | `shadow-md` (0 4 6 / 7 %) |
| Primary button default  | `shadow-md` (always) |
| Card default            | `shadow-sm` |
| Card hover              | `shadow-md` |
| Modal                   | `shadow-xl` (0 20 25 / 10 %) |
| Dropdown                | `shadow-lg` (0 10 15 / 10 %) |

#### Shadow Principles
- All interactive elements (buttons, links) must have a shadow.  
- Increase shadow one step on hover for feedback.  
- Keep shadows subtle (`shadow-sm`) for non-interactive items.  
- More important elements get stronger shadows.  
- Limit to three shadow levels per screen.

## 6. Typography

### Font Weights
| Role           | Weight |
| -------------- | ------ |
| Display Title  | `font-bold 700` |
| Heading        | `font-semibold 600` |
| Emphasis       | `600` |
| Button Text    | `600` |
| Body           | `font-normal 400` |
| Caption        | `400` |
| Light Text     | `font-light 300` (sparingly) |

### Type Scale
| Level           | Class / Size | Extras |
| --------------- | ------------ | ------ |
| Display Title   | `text-4xl` 36 px | `leading-tight` |
| H1              | `text-3xl` 30 px | `leading-tight` |
| H2              | `text-2xl` 24 px | `leading-snug` |
| H3              | `text-xl` 20 px | `leading-snug` |
| H4              | `text-lg` 18 px | `leading-normal` |
| Body            | `text-base` 16 px| `leading-relaxed` |
| Small Body      | `text-sm` 14 px | `leading-relaxed` |
| Caption         | `text-xs` 12 px | `leading-normal` |

### Contrast Requirements (WCAG 2.1)
- Normal text: ≥ 4.5 : 1 (use `gray-600` or darker).  
- Large text (≥ 18 px regular or ≥ 14 px bold): ≥ 3 : 1.  
- Blue text on white: use `blue-700` or darker (≥ 7 : 1).  
- White text on blue: always pure white.  
- Critical info: ≥ 7 : 1 (AAA).

### Line & Letter Spacing
- Headings: `leading-tight (1.25)`  
- Body: `leading-relaxed (1.625)`  
- Long passages: `leading-loose (2)`  
- Letter-spacing: `tracking-normal` (adjust only if needed).

## 7. Component Design

### Button Principles
- All buttons include a shadow to indicate clickability.  
- Minimum touch target 44 × 44 px.  
- Font weight ≥ semibold for legibility.  
- Avoid color clashes on the same screen.  
- Disabled state is clearly distinct (`opacity-50`, `cursor-not-allowed`).

#### Primary Button
- BG `bg-blue-500` - Text `text-white` - `font-semibold`  
- Shadow `shadow-md` → hover `bg-blue-600 shadow-lg`  
- Focus `ring-2 ring-blue-500 ring-offset-2`  
- Disabled: `opacity-50 cursor-not-allowed`

#### Secondary Button
- BG `bg-white` - Text `text-blue-700`  
- Border `border-2 border-blue-700`  
- Shadow `shadow-sm` → hover `bg-blue-50 shadow-md`  
- Focus same as primary.

#### Danger Button
- BG `bg-red-600` - Text white - Shadow `shadow-md`  
- Hover `bg-red-700 shadow-lg`

### Card Design
- BG `bg-white`  
- Border `border border-gray-300`  
- Shadow `shadow-sm` → hover `shadow-md border-gray-400`  
- Radius `rounded-2xl`  
- Padding `p-5` or `p-6`

### Input Fields
- BG white - Border `border-gray-300`  
- Focus `border-blue-500 ring-2 ring-blue-500 ring-opacity-20`  
- Error `border-red-500 ring-2 ring-red-500 ring-opacity-20`  
- Placeholder `placeholder-gray-500`  
- Min height `h-12` (48 px)

### Navigation
- Active `bg-blue-700 text-white`  
- Hover `bg-blue-50 text-blue-700`  
- Inactive `text-gray-700`  
- Focus `ring-2 ring-blue-500 ring-inset`

## 8. Layout System

### Container
- Max width `max-w-4xl` (always with `w-full`).  
- Center `mx-auto`.  
- Horizontal padding `px-4 sm:px-6 lg:px-8`.  
- Vertical padding `py-8 sm:py-12 lg:py-16`.

### Grid
- 1 col `grid-cols-1`  
- 2 cols `grid-cols-1 md:grid-cols-2`  
- 3 cols `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`  
- 4 cols `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`  
- Gap `gap-4 sm:gap-6 lg:gap-8`

### Flex
- Horizontal `flex items-center justify-between`  
- Vertical `flex flex-col items-center`  
- Center `flex items-center justify-center`  
- Gaps `space-x-4` / `space-y-4`

## 9. Interaction

### Hover Effects
- **Button:** darker BG + stronger shadow + `scale-105`  
- **Card:** stronger shadow + darker border  
- **Link:** color change + underline  
- **Icon:** color change + slight `rotate-12`

### Focus States (Accessibility)
- **Inputs:** `ring-2 ring-blue-500 ring-opacity-50`  
- **Buttons:** `ring-2 ring-blue-500 ring-offset-2`  
- **Links:** `ring-2 ring-blue-500 ring-offset-1`  
- Contrast ≥ 3 : 1.

### Active States
- **Button:** `scale-95`  
- **Link:** deeper color  
- **Input:** `ring-2 ring-blue-600`

### Transitions
- Standard `transition-all duration-200 ease-in-out`  
- Color-only `transition-colors duration-150`  
- Shadow-only `transition-shadow duration-200`  
- Transform `transition-transform duration-150`

### Loading States
- Spinner `animate-spin`  
- Pulse `animate-pulse`  
- BG `bg-gray-100`  
- Opacity `opacity-50`

## 10. Accessibility

### Keyboard
- Logical tab order.  
- Enter/Space triggers buttons.  
- Esc closes modals.  
- Arrow keys navigate menus.

### Screen Readers
- Appropriate `aria-label`s.  
- Correct heading hierarchy.  
- Labels bound to form controls.  
- Announce state changes with `aria-live`.

### Visual
- Don't rely on color alone.  
- Maintain sufficient contrast.  
- Allow scalable text sizes.  
- Provide controls for video/animation.

### Motion
- Respect `prefers-reduced-motion`.  
- Use minimal animations.  
- Avoid auto-playing media.  
- No flashing/blinking.

## 11. Responsive Design

### Breakpoints
- **sm** ≥ 640 px  
- **md** ≥ 768 px  
- **lg** ≥ 1024 px  
- **xl** ≥ 1280 px  
- **2xl** ≥ 1536 px  

### Responsive Adjustments
- Font size: `text-sm md:text-base lg:text-lg`  
- Padding: `p-4 md:p-6 lg:p-8`  
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`  
- Visibility: `hidden md:block` / `block md:hidden`

## 12. Implementation Checklist

### Required (Accessibility)
- [ ] WCAG contrast ≥ 4.5 : 1  
- [ ] Keyboard navigation fully supported  
- [ ] Proper `aria` attributes  
- [ ] Visible focus indicators (≥ 3 : 1)  
- [ ] Min touch target 44 px  
- [ ] Screen-reader-friendly text

### Required (Design)
- [ ] Proper grayscale usage (true blacks/whites)  
- [ ] 8 px spacing grid  
- [ ] Consistent corner radii (`lg`, `xl`, `2xl`, `3xl`)  
- [ ] Shadows on all interactive elements  
- [ ] Smooth transitions ≤ 200 ms  
- [ ] Button text `font-semibold` or heavier  
- [ ] Blue text on white uses `blue-700` or darker  
- [ ] Clear card borders `border-gray-300`

### Recommended (UX)
- [ ] Unified hover effects (shadow increase)  
- [ ] Clear focus states  
- [ ] Loading states implemented  
- [ ] Friendly error messages  
- [ ] Success feedback  
- [ ] Progressive enhancement  
- [ ] Performance optimization

### Color Usage Caveats
- [ ] Avoid same-hue overlaps  
- [ ] Limit light background use  
- [ ] Correct use of system colors  
- [ ] Clear disabled states  
- [ ] Color-blind support (shapes/text cues)

### QA
- [ ] Test across major browsers  
- [ ] Test on multiple devices  
- [ ] Validate with accessibility tools  
- [ ] Measure performance  
- [ ] Conduct usability testing

## 13. Prohibitions

### Absolutely Avoid
- [ ] Colors with insufficient contrast  
- [ ] Same-hue stacking (blue on blue, etc.)  
- [ ] Excessive light-tone backgrounds  
- [ ] Interactive elements without shadows  
- [ ] Touch targets < 44 px  
- [ ] Elements unreachable by keyboard  
- [ ] Information conveyed by color alone  
- [ ] Auto-playing audio/video  
- [ ] Flashing/blinking effects

### Restricted Use
- [ ] Light-tone backgrounds (`-50`, `-100`) only with clear purpose  
- [ ] Keep animations subtle  
- [ ] Decorative elements to a minimum  
- [ ] Prioritize readability when using custom fonts  
- [ ] No more than three shadow strengths per screen

## 14. Trade Area Analysis Platform Specific Guidelines

### Map Interface Design
- **Map Controls:** Use `bg-white` with `shadow-lg` and `rounded-xl` borders
- **Location Markers:** Blue (#2563EB) for stores, Red (#DC2626) for competitors, Green (#059669) for POIs
- **Map Selection Dropdown:** Clear use case descriptions with icons
- **Legend:** White background with subtle shadow, positioned bottom-right

### Analytics Dashboard
- **Charts:** Use blue color scheme with accessibility-compliant contrast
- **Data Cards:** White background, `border-gray-300`, `shadow-sm` on default, `shadow-md` on hover
- **Metrics:** Large, bold numbers with descriptive labels
- **Status Indicators:** Green for positive, amber for warning, red for critical

### AI Chat Interface
- **Chat Bubbles:** User messages in `bg-blue-500` with white text, AI responses in `bg-gray-50` with dark text
- **Input Field:** Standard design with `rounded-xl` borders
- **Suggestions:** Pill-shaped buttons with `bg-blue-50` and `text-blue-700`

### Project Management
- **Project Cards:** Standard card design with project preview and action buttons
- **Create Project Button:** Primary button design with clear call-to-action
- **Project Status:** Color-coded status indicators following system colors

---

*This design system ensures our trade area analysis platform maintains professional, accessible, and intuitive user experience while expressing our unique identity as a powerful analytics tool.*