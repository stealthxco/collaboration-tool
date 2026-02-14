# Design System & UI/UX Guidelines
## Mission Control - AI Collaboration Dashboard

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  
**Design Lead**: [To be assigned]

---

## 1. Design Philosophy

### 1.1 Core Principles

**Mission-Critical Interface**:
- Clean, distraction-free environment focused on productivity
- Information hierarchy optimized for quick decision making
- Visual cues that enhance rather than overwhelm
- Consistent patterns that reduce cognitive load

**Human-AI Collaboration Focus**:
- Clear distinction between human and AI contributors
- Visual language that celebrates both human creativity and AI efficiency
- Interface elements that facilitate seamless handoffs
- Status indicators that build trust in AI agent reliability

**Real-time Clarity**:
- Immediate visual feedback for all user actions
- Progressive disclosure to manage information density
- Smooth animations that provide context, not distraction
- Accessibility-first design for inclusive collaboration

---

## 2. Visual Identity

### 2.1 Color Palette

**Primary Colors**:
```css
:root {
  /* Mission Control Blue - Authority and trust */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;
  
  /* Agent Orange - AI activity and highlights */
  --accent-50: #fff7ed;
  --accent-500: #f97316;
  --accent-900: #9a3412;
  
  /* Success Green - Completed tasks */
  --success-500: #10b981;
  
  /* Warning Amber - Attention needed */
  --warning-500: #f59e0b;
  
  /* Error Red - Critical issues */
  --error-500: #ef4444;
}
```

**Semantic Color Usage**:
- **Primary Blue**: Navigation, CTAs, active states
- **Agent Orange**: AI agent indicators, notifications, highlights  
- **Success Green**: Completed missions, positive states
- **Warning Amber**: Pending actions, moderate priority
- **Error Red**: Failed tasks, high priority alerts

**Neutral Palette**:
```css
:root {
  /* Mission Control Grays - Clean and professional */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
}
```

### 2.2 Typography

**Font Stack**:
```css
/* Primary: Inter - Clean, readable, professional */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Code: JetBrains Mono - Technical elements */
font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

**Type Scale**:
```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* Page titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Section headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; } /* Card titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; } /* Subheadings */

/* Body text */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* Large body */
.text-base { font-size: 1rem; line-height: 1.5rem; } /* Default body */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* Small text */
.text-xs { font-size: 0.75rem; line-height: 1rem; } /* Labels, captions */
```

**Font Weights**:
- **300 (Light)**: Subtle labels, secondary information
- **400 (Regular)**: Body text, descriptions
- **500 (Medium)**: Navigation items, buttons
- **600 (Semibold)**: Card titles, section headers
- **700 (Bold)**: Page titles, emphasis
- **800 (Extrabold)**: Marketing headlines only

---

## 3. Component Library

### 3.1 Layout Components

**Agent Panel (Left Sidebar)**:
```typescript
interface AgentPanelProps {
  agents: Agent[];
  selectedAgent?: string;
  onAgentSelect: (agentId: string) => void;
  onAgentFilter: (filter: AgentFilter) => void;
}

// Design specifications:
// - Fixed width: 280px on desktop
// - Collapsible to 64px (icons only)
// - Mobile: overlay with backdrop
// - Scroll behavior: sticky header, scrollable list
```

**Mission Board (Main Content)**:
```typescript
interface MissionBoardProps {
  columns: BoardColumn[];
  missions: Mission[];
  onMissionMove: (missionId: string, newColumn: string) => void;
  onMissionEdit: (mission: Mission) => void;
}

// Design specifications:
// - Fluid width with horizontal scroll if needed
// - Column min-width: 300px
// - Card spacing: 12px vertical, 16px horizontal
// - Drag indicators and drop zones
```

**Status Bar (Top Navigation)**:
```typescript
interface StatusBarProps {
  activeAgents: number;
  totalMissions: number;
  completionRate: number;
  alerts: Alert[];
}

// Design specifications:
// - Fixed height: 64px
// - Glass morphism background effect
// - Live updating metrics with smooth transitions
// - Alert indicators with badge counts
```

### 3.2 Interactive Components

**Mission Card**:
```typescript
interface MissionCardProps {
  mission: Mission;
  assignedAgents: Agent[];
  onEdit: () => void;
  onAssign: (agentId: string) => void;
  isDragging?: boolean;
}

// Visual hierarchy:
// 1. Title (text-lg, semibold)
// 2. Priority indicator (color-coded dot)
// 3. Assigned agents (avatar stack)
// 4. Due date (if within 7 days)
// 5. Progress indicator (if started)
// 6. Tag system (up to 3 visible)
```

**Agent Avatar**:
```typescript
interface AgentAvatarProps {
  agent: Agent;
  size: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'busy' | 'offline';
  showName?: boolean;
}

// Size specifications:
// - xs: 24x24px (for stacks)
// - sm: 32x32px (for lists)  
// - md: 40x40px (for cards)
// - lg: 64x64px (for profiles)

// Status indicators:
// - Online: Green dot (bottom-right)
// - Busy: Amber dot with pulse animation
// - Offline: Gray dot (50% opacity)
```

**Status Indicator**:
```typescript
interface StatusIndicatorProps {
  status: 'idle' | 'active' | 'complete' | 'error' | 'pending';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

// Color coding:
// - idle: Gray (#64748b)
// - active: Blue (#3b82f6) with subtle pulse
// - complete: Green (#10b981)
// - error: Red (#ef4444) with attention animation
// - pending: Amber (#f59e0b)
```

### 3.3 Form Components

**Input Field**:
```css
.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.form-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}
```

**Button Variants**:
```css
/* Primary - Main actions */
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

/* Secondary - Supporting actions */
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 0.75rem 1.5rem;
}

/* Ghost - Subtle actions */
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  padding: 0.75rem 1rem;
}
```

---

## 4. Animation & Interaction

### 4.1 Micro-interactions

**Hover States**:
- **Cards**: Subtle elevation (4px shadow), 150ms ease
- **Buttons**: Background color transition, 100ms ease
- **Avatars**: Scale 1.05x, 200ms ease-out

**Loading States**:
- **Skeleton Loading**: Gray shimmer animation for content
- **Progress Indicators**: Smooth progress bar with easing
- **Spinner**: Subtle rotation for async operations

**State Changes**:
- **Status Updates**: Color transition with 300ms ease
- **Count Changes**: Scale pulse effect for metrics
- **New Items**: Fade-in with slide down, 400ms ease

### 4.2 Drag & Drop Feedback

**Dragging State**:
```css
.mission-card-dragging {
  transform: rotate(5deg) scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}
```

**Drop Zones**:
```css
.drop-zone-active {
  border: 2px dashed var(--primary-500);
  background: rgba(59, 130, 246, 0.05);
}
```

### 4.3 Real-time Visual Feedback

**Live Updates**:
- **New Comments**: Gentle glow effect on card
- **Status Changes**: Smooth color transitions
- **Agent Activity**: Subtle pulse on avatar
- **Notification Badge**: Bounce animation on increment

---

## 5. Responsive Design

### 5.1 Breakpoint Strategy

**Desktop First Approach**:
```css
/* Large Desktop: 1440px+ */
.lg-desktop { /* Full featured layout */ }

/* Desktop: 1024px - 1439px */
.desktop { /* Standard layout */ }

/* Tablet: 768px - 1023px */
.tablet { 
  /* Collapsible sidebar */
  /* Adjusted column widths */
}

/* Mobile: 375px - 767px */
.mobile {
  /* Single column layout */
  /* Full-screen modals */
  /* Simplified navigation */
}
```

### 5.2 Mobile Adaptations

**Navigation**:
- Bottom tab bar for main sections
- Hamburger menu for secondary actions
- Swipe gestures for board navigation

**Mission Cards**:
- Full-width design with vertical stacking
- Expandable cards for details
- Touch-optimized interaction targets (44px minimum)

**Agent Panel**:
- Slide-out drawer overlay
- Quick agent selection bar
- Gesture-based filtering

---

## 6. Accessibility Guidelines

### 6.1 WCAG 2.1 AA Compliance

**Color Contrast**:
- Text: Minimum 4.5:1 contrast ratio
- UI Components: Minimum 3:1 contrast ratio
- Focus indicators: High contrast, visible outlines

**Keyboard Navigation**:
- Tab order follows logical reading flow
- All interactive elements keyboard accessible
- Skip links for main content areas
- Arrow keys for board navigation

**Screen Reader Support**:
- Semantic HTML structure
- ARIA labels for dynamic content
- Live regions for real-time updates
- Alternative text for all visual elements

### 6.2 Inclusive Design Patterns

**Motor Accessibility**:
- Large click targets (44px minimum)
- Generous spacing between interactive elements
- Drag alternatives (context menus)
- Reduced motion option

**Cognitive Accessibility**:
- Clear visual hierarchy
- Consistent interaction patterns
- Progressive disclosure of complex features
- Undo/redo capabilities for destructive actions

---

## 7. Dark Mode Support

### 7.1 Dark Theme Colors

```css
[data-theme="dark"] {
  /* Dark mode primaries */
  --primary-500: #60a5fa;
  --accent-500: #fb923c;
  
  /* Dark backgrounds */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Dark text colors */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
}
```

### 7.2 Dark Mode Adaptations

**Visual Adjustments**:
- Reduced elevation shadows
- Adjusted opacity for overlays
- Modified focus indicators
- Subtle border treatments

---

## 8. Component Documentation

### 8.1 Storybook Integration

Each component includes:
- **Props documentation** with TypeScript interfaces
- **Usage examples** with common scenarios  
- **Accessibility notes** and keyboard shortcuts
- **Design tokens** used in implementation
- **Responsive behavior** demonstrations

### 8.2 Design Token System

```typescript
export const designTokens = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  }
};
```

---

**Design System Owner**: Mission Control Design Team  
**Component Library**: To be implemented with Radix UI + Tailwind CSS  
**Review Cycle**: Bi-weekly design system updates