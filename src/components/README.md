# Components

This directory contains all React components for the Collaboration Tool.

## Structure

```
components/
├── common/          # Shared, reusable components
├── features/        # Feature-specific components
├── layout/          # Layout and navigation components
└── ui/              # Base UI components (buttons, inputs, etc.)
```

## Component Guidelines

### Naming Convention
- Use PascalCase for component files: `Button.tsx`
- Use kebab-case for directories: `user-profile/`

### Component Structure
```typescript
interface ComponentProps {
  // Define prop types here
}

export const Component: React.FC<ComponentProps> = ({ 
  // destructure props here 
}) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### Best Practices
- Keep components small and focused
- Use TypeScript interfaces for props
- Export both named and default exports
- Include JSDoc comments for complex components
- Write tests for all components