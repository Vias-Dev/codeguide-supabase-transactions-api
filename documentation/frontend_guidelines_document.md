# Frontend Guidelines for codeguide-supabase-transactions-api

This document outlines how the frontend of the `codeguide-supabase-transactions-api` project is built, why we made certain choices, and how to keep the code clean, fast, and easy to maintain. Whether you’re a designer, a new developer, or a non-technical stakeholder, this guide will help you understand how the pieces fit together.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js 14 (App Router)**: Our main framework. It handles routing, server-side rendering (SSR), client components, and API route handlers under `app/api/`.  
- **React 18**: Builds the interactive UIs.  
- **TypeScript**: Enforces type safety across UI components, data fetching, and forms.  
- **Tailwind CSS** + **shadcn/ui**: Utility-first styling and a set of accessible, customizable UI components out of the box.  
- **React Query (TanStack Query)**: Manages data fetching, caching, and synchronization with our Supabase backend.  
- **React Hook Form** + **Zod**: Handles form state and validation with minimal boilerplate and fully typed schemas.  
- **Framer Motion**: Adds smooth, declarative animations.  
- **Sonner**: Displays toast notifications.  
- **OpenAI API**: Provides AI-powered features if needed.  

### Scalability, Maintainability, Performance
- **File-based routing and layouts** let us grow pages in a predictable folder structure.  
- **Component-based design** means each UI element lives in its own file or folder—easy to find, update, and reuse.  
- **TypeScript throughout** reduces runtime errors and makes large-team collaboration safer.  
- **Server and client components** split heavy logic (e.g., database calls) from pure UI rendering, improving load times.  
- **React Query caching** avoids unnecessary network calls, keeping the UI snappy.  

## 2. Design Principles

### Usability
- Keep interactions simple and clear. Landing pages, forms, and dashboards guide users with concise labels and consistent button placements.  
- Error messages and success confirmations appear in context (e.g., next to a form field or as a toast).  

### Accessibility
- Use semantic HTML elements (`<button>`, `<nav>`, `<form>`) and proper ARIA attributes when needed.  
- Rely on **shadcn/ui** components, which follow WAI-ARIA best practices.  
- Ensure color contrast meets WCAG AA standards.  

### Responsiveness
- Mobile-first approach: start styles for small screens, then scale up with Tailwind’s `sm:`, `md:`, `lg:` prefixes.  
- Navigation collapses into a hamburger menu on narrow viewports.  

### Consistency
- Shared theme tokens (colors, spacing, typography) defined in `tailwind.config.js`.  
- Reuse layout components (e.g., `Header`, `Footer`, `Sidebar`) across pages.  

## 3. Styling and Theming

### Styling Approach
- Utility-first with **Tailwind CSS**: write class names like `px-4 py-2 bg-primary hover:bg-primary-dark`.  
- No custom BEM or SMACSS conventions—Tailwind’s utilities cover most needs.  
- Use `clsx` and `tailwind-merge` to conditionally combine classes in React.  

### Theming
- Themes live in `tailwind.config.js` under `theme.extend`: colors, font sizes, border radii.  
- To switch themes (light/dark), we toggle a `className="dark"` on the root `<html>` and define dark variants in Tailwind.  

### Visual Style
- **Modern flat design** with subtle shadows on interactive elements.  
- Use smooth rounded corners (`rounded-md` for most buttons and cards).  
- Minimalistic icons and clear typography.  

### Color Palette
- **Primary**: #2563EB (blue-600)  
- **Primary Dark**: #1E40AF (blue-800)  
- **Secondary**: #10B981 (green-500)  
- **Accent**: #F59E0B (yellow-500)  
- **Neutral (background)**: #F3F4F6 (gray-100)  
- **Neutral (text)**: #111827 (gray-900)  
- **Error**: #EF4444 (red-500)  
- **Success**: #22C55E (green-400)  
- **Warning**: #FBBF24 (yellow-400)  

### Typography
- **Font Family**: Inter, with fallback `system-ui, sans-serif`.  
- **Headings**: `font-semibold`, sizes from `text-xl` to `text-4xl`.  
- **Body**: `font-normal`, `text-base` or `text-sm` for secondary text.  

## 4. Component Structure

### Organization
- `/components`  
  - `/atoms` (buttons, inputs, labels)  
  - `/molecules` (form fields with label + input)  
  - `/organisms` (navigation bars, sidebars, card grids)  
  - `/templates` (page sections or skeletons)  

### Reusability
- Each component is a single `.tsx` file exporting a React function.  
- Props are fully typed; default props and optional props documented with JSDoc.  
- Components avoid side effects; data fetching lives outside in pages or hooks.  

### Benefits of Component-Based Architecture
- Easier to test and maintain—fix one component, all consumers benefit.  
- Encourages consistency—teams share a common library of building blocks.  

## 5. State Management

### Server State: React Query
- **useQuery** for GET requests to Supabase (e.g., fetch balances).  
- **useMutation** for POST/PATCH/DELETE (e.g., pay a user).  
- Configure global query defaults in a `QueryClientProvider` at the root.  
- Automatically refetch or invalidate queries after successful mutations.  

### Local UI State
- **React Hook Form** state lives inside forms.  
- **Context API** only for global UI concerns (e.g., theme, toast notifications).  
- No Redux or MobX—keep complexity low.  

## 6. Routing and Navigation

### File-Based Routing (App Router)
- Each folder under `app/` maps to a route.  
- `app/layout.tsx` wraps pages with global UI (header, footer, providers).  
- `page.tsx` inside a folder renders that route’s main content.  

### API Route Handlers
- Under `app/api/`, each `route.ts` file exports handlers for HTTP methods (e.g., `GET`, `POST`).  
- These handlers run on the server, use the Supabase `admin` client, and return JSON.  

### Navigation
- Use Next.js `<Link>` for client-side transitions.  
- Active link styling via `usePathname()` hook.  

## 7. Performance Optimization

- **Code Splitting**: Next.js automatically splits code by route.  
- **Dynamic Imports** for large, seldom-used components (`next/dynamic`).  
- **Image Optimization** with `next/image`.  
- **CSS Purge**: Tailwind’s JIT removes unused classes in production builds.  
- **Caching**: Leverage React Query caching and HTTP cache headers where possible.  

## 8. Testing and Quality Assurance

### Unit Tests
- **Vitest** (or Jest) + **@testing-library/react** for component and hook testing.  
- Mock external calls (React Query, Supabase clients) to isolate logic.  

### Integration Tests
- Test pages end-to-end within the Next.js testing environment.  
- Verify form flows (fill, submit, toast).  

### End-to-End Tests
- **Cypress** for browser-level tests: login flows, navigation, error states.  

### Linters and Formatters
- **ESLint** with Next.js and TypeScript plugins.  
- **Prettier** for consistent code style.  

### Continuous Integration
- Run lint, type checks, and tests on every pull request.  

## 9. Conclusion and Overall Frontend Summary

Our frontend setup combines Next.js’s powerful App Router with a lean, utility-first styling approach and strong type safety. We prioritize usability, accessibility, and performance at every step. Key differentiators:

- A clear separation between server logic (API route handlers) and UI components.  
- An atomic design-inspired component library with shadcn/ui accelerators.  
- Type-safe data flows from Supabase to React Query to components.  
- Testing coverage from unit to end-to-end.  

Following these guidelines ensures a smooth developer experience, a consistent interface for users, and a reliable foundation for future growth. Welcome aboard!