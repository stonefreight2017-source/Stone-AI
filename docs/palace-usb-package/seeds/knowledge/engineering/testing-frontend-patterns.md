# Testing Frontend Patterns — Deep Knowledge Seed

> Stone AI Engineering Knowledge Base
> Scope: Vitest, React Testing Library, Playwright, MSW, CI integration
> Stack: Next.js 16, TypeScript, shadcn/ui, Clerk, React Hook Form

---

## Table of Contents

1. [Vitest Setup for Next.js 16](#vitest-setup-for-nextjs-16)
2. [React Testing Library Fundamentals](#react-testing-library-fundamentals)
3. [Testing shadcn/ui Components](#testing-shadcnui-components)
4. [Testing Hooks with renderHook](#testing-hooks-with-renderhook)
5. [Testing Forms with React Hook Form](#testing-forms-with-react-hook-form)
6. [Mocking Strategies](#mocking-strategies)
7. [Integration Tests](#integration-tests)
8. [Snapshot Testing](#snapshot-testing)
9. [Playwright E2E Testing](#playwright-e2e-testing)
10. [Test Organization](#test-organization)
11. [CI Integration](#ci-integration)
12. [Real-World Test Examples](#real-world-test-examples)

---

## Vitest Setup for Next.js 16

### Why Vitest Over Jest

Vitest runs on Vite's transform pipeline, giving native ESM support, faster HMR-like re-runs, and first-class TypeScript handling without babel transforms. For Next.js 16 with its heavy use of server components and the App Router, Vitest's compatibility layer handles the RSC boundary better than Jest's aging transform stack.

### Installation

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

### Configuration: vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for full browser API simulation
    // Use happy-dom for faster tests that don't need full DOM
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'e2e/**',  // Playwright handles E2E
      '.next/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',  // barrel exports
        'src/app/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Pool configuration for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 2,
        maxForks: 8,
      },
    },
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup File: vitest.setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (required for many shadcn/ui components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by virtual scrolling, lazy loading)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver (used by many UI components)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock scrollTo (used by chat scroll behavior)
window.scrollTo = vi.fn() as any;
Element.prototype.scrollTo = vi.fn() as any;
Element.prototype.scrollIntoView = vi.fn() as any;

// Suppress console.error in tests unless debugging
const originalError = console.error;
console.error = (...args: any[]) => {
  // Still show React act() warnings — they indicate real problems
  if (typeof args[0] === 'string' && args[0].includes('act(')) {
    originalError(...args);
    return;
  }
  // Suppress expected hydration warnings in test environment
  if (typeof args[0] === 'string' && args[0].includes('Hydration')) {
    return;
  }
  originalError(...args);
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run --coverage && playwright test"
  }
}
```

### Environment-Specific Configuration

```typescript
// vitest.config.ts — handling Next.js specific transforms
export default defineConfig({
  test: {
    // Server component tests need a different environment
    environmentMatchGlobs: [
      // Components use jsdom
      ['src/components/**', 'jsdom'],
      ['src/app/**/page.test.tsx', 'jsdom'],
      // Server-side utilities use node
      ['src/lib/**', 'node'],
      ['src/app/api/**', 'node'],
    ],
  },
});
```

---

## React Testing Library Fundamentals

### Core Philosophy

React Testing Library enforces testing from the user's perspective. You query the DOM the way a user would: by visible text, labels, roles, and placeholders — not by component internals, class names, or test IDs (which are a last resort).

### Query Priority (Use in This Order)

```typescript
// 1. getByRole — BEST: accessible to everyone
screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 2 });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('dialog');
screen.getByRole('navigation');

// 2. getByLabelText — for form elements
screen.getByLabelText(/email address/i);

// 3. getByPlaceholderText — when no label exists
screen.getByPlaceholderText(/search agents/i);

// 4. getByText — for non-interactive elements
screen.getByText(/welcome back/i);

// 5. getByDisplayValue — for filled form elements
screen.getByDisplayValue('current-setting-value');

// 6. getByAltText — for images
screen.getByAltText(/user avatar/i);

// 7. getByTitle — tooltip or title attribute
screen.getByTitle(/close/i);

// 8. getByTestId — LAST RESORT
screen.getByTestId('complex-widget');
```

### Query Variants

```typescript
// getBy* — throws if not found (synchronous, for elements that SHOULD exist)
const button = screen.getByRole('button', { name: /save/i });

// queryBy* — returns null if not found (for asserting absence)
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

// findBy* — returns Promise, waits for element (for async renders)
const message = await screen.findByText(/message sent/i);

// getAllBy* — returns array, throws if empty
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(5);

// queryAllBy* — returns array, empty if none found
const errors = screen.queryAllByRole('alert');
expect(errors).toHaveLength(0);

// findAllBy* — async version of getAllBy*
const rows = await screen.findAllByRole('row');
```

### Render Function Patterns

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Basic render
it('renders a heading', () => {
  render(<MyComponent />);
  expect(screen.getByRole('heading')).toHaveTextContent('Welcome');
});

// Render with providers (common pattern for Stone AI)
function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    initialState?: Partial<AppState>;
    queryClient?: QueryClient;
  }
) {
  const queryClient = options?.queryClient ?? new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  };
}
```

### User Event Patterns

```typescript
import userEvent from '@testing-library/user-event';

describe('UserEvent patterns', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('handles typing', async () => {
    const user = userEvent.setup();

    render(<SearchInput onSearch={vi.fn()} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'hello world');
    expect(input).toHaveValue('hello world');
  });

  it('handles clearing and retyping', async () => {
    const user = userEvent.setup();

    render(<Input defaultValue="old value" />);
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'new value');
    expect(input).toHaveValue('new value');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();

    render(<DropdownMenu />);
    await user.tab(); // Focus first item
    await user.keyboard('{Enter}'); // Open menu
    await user.keyboard('{ArrowDown}'); // Navigate
    await user.keyboard('{Enter}'); // Select

    expect(screen.getByText('Selected: Option 1')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    const user = userEvent.setup();
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });

    render(<AvatarUpload />);
    const input = screen.getByLabelText(/upload avatar/i);

    await user.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files![0].name).toBe('avatar.png');
  });

  it('handles hover interactions', async () => {
    const user = userEvent.setup();

    render(<Tooltip text="Help info"><HelpIcon /></Tooltip>);
    await user.hover(screen.getByRole('img'));

    expect(await screen.findByText('Help info')).toBeInTheDocument();

    await user.unhover(screen.getByRole('img'));
    expect(screen.queryByText('Help info')).not.toBeInTheDocument();
  });

  it('handles selection in dropdowns', async () => {
    const user = userEvent.setup();

    render(
      <select aria-label="tier">
        <option value="free">Free</option>
        <option value="starter">Starter</option>
        <option value="plus">Plus</option>
      </select>
    );

    await user.selectOptions(screen.getByRole('combobox'), 'starter');
    expect(screen.getByRole('combobox')).toHaveValue('starter');
  });
});
```

### Async Patterns and waitFor

```typescript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react';

it('waits for loading to complete', async () => {
  render(<AgentList />);

  // Assert loading state appears
  expect(screen.getByText(/loading agents/i)).toBeInTheDocument();

  // Wait for loading to disappear
  await waitForElementToBeRemoved(() =>
    screen.queryByText(/loading agents/i)
  );

  // Assert loaded state
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
});

it('waits for async updates', async () => {
  render(<ChatComponent />);

  await waitFor(() => {
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  }, {
    timeout: 3000,
    interval: 100,
  });
});

// ANTI-PATTERN: Don't use waitFor for things findBy* can handle
// BAD:
await waitFor(() => {
  expect(screen.getByText('loaded')).toBeInTheDocument();
});
// GOOD:
expect(await screen.findByText('loaded')).toBeInTheDocument();
```

---

## Testing shadcn/ui Components

### Common Patterns for shadcn/ui

shadcn/ui components are built on Radix UI primitives. They use portals, focus traps, and ARIA patterns that require specific testing approaches.

```typescript
// Testing Dialog component
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('opens and closes correctly', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Settings</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your account settings</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button>Save changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Dialog content not visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open dialog
    await user.click(screen.getByRole('button', { name: /open settings/i }));

    // Dialog is now visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Close via close button (Radix renders an X button)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Wait for animation to complete
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });
});

// Testing Select component
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

describe('Select', () => {
  it('allows selecting an option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="starter">Starter ($19.99/mo)</SelectItem>
          <SelectItem value="plus">Plus ($49.99/mo)</SelectItem>
          <SelectItem value="smart">Smart ($99.99/mo)</SelectItem>
          <SelectItem value="pro">Pro ($200/mo)</SelectItem>
        </SelectContent>
      </Select>
    );

    // Open the select
    await user.click(screen.getByRole('combobox'));

    // Select an option
    await user.click(screen.getByRole('option', { name: /starter/i }));

    expect(onValueChange).toHaveBeenCalledWith('starter');
  });
});

// Testing Toast notifications
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

function ToastTestComponent() {
  const { toast } = useToast();
  return (
    <>
      <button onClick={() => toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })}>
        Show Toast
      </button>
      <Toaster />
    </>
  );
}

describe('Toast', () => {
  it('shows and auto-dismisses', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(<ToastTestComponent />);
    await user.click(screen.getByRole('button', { name: /show toast/i }));

    expect(await screen.findByText('Settings saved successfully')).toBeInTheDocument();

    // Advance timers to auto-dismiss
    vi.advanceTimersByTime(5000);

    await waitForElementToBeRemoved(() =>
      screen.queryByText('Settings saved successfully')
    );

    vi.useRealTimers();
  });
});

// Testing Command (search/command palette)
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

describe('Command', () => {
  it('filters results as user types', async () => {
    const user = userEvent.setup();

    render(
      <Command>
        <CommandInput placeholder="Search agents..." />
        <CommandList>
          <CommandEmpty>No agents found.</CommandEmpty>
          <CommandGroup heading="Agents">
            <CommandItem>Stone (Strategy)</CommandItem>
            <CommandItem>Cardinal (Intelligence)</CommandItem>
            <CommandItem>Chaos (Infrastructure)</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    const input = screen.getByPlaceholderText('Search agents...');
    await user.type(input, 'card');

    // Only Cardinal should be visible
    expect(screen.getByText('Cardinal (Intelligence)')).toBeInTheDocument();
    expect(screen.queryByText('Stone (Strategy)')).not.toBeInTheDocument();
    expect(screen.queryByText('Chaos (Infrastructure)')).not.toBeInTheDocument();
  });
});

// Testing Sheet (mobile sidebar pattern)
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

describe('Sheet', () => {
  it('opens mobile navigation', async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger asChild>
          <button aria-label="Open menu">Menu</button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav>
            <a href="/chat">Chat</a>
            <a href="/agents">Agents</a>
            <a href="/settings">Settings</a>
          </nav>
        </SheetContent>
      </Sheet>
    );

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('link', { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /agents/i })).toBeInTheDocument();
  });
});
```

---

## Testing Hooks with renderHook

### Basic Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Testing a simple toggle hook
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse };
}

describe('useToggle', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current.value).toBe(false);
  });

  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(false);
  });

  it('accepts custom initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });
});

// Testing a debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('debounces value changes', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    // Update value
    rerender({ value: 'world', delay: 500 });

    // Not yet updated
    expect(result.current).toBe('hello');

    // Advance time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world');
    vi.useRealTimers();
  });
});

// Testing hooks that need providers
function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fetch('/api/user').then(r => r.json()),
  });
  return { user: data, isLoading };
}

describe('useCurrentUser', () => {
  it('fetches current user', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({ id: '1', name: 'Test User' });
  });
});

// Testing a local storage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when nothing stored', () => {
    const { result } = renderHook(() =>
      useLocalStorage('theme', 'dark')
    );
    expect(result.current[0]).toBe('dark');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('theme', 'dark')
    );

    act(() => {
      result.current[1]('light');
    });

    expect(result.current[0]).toBe('light');
    expect(localStorage.getItem('theme')).toBe('"light"');
  });

  it('reads existing localStorage value', () => {
    localStorage.setItem('theme', '"light"');

    const { result } = renderHook(() =>
      useLocalStorage('theme', 'dark')
    );

    expect(result.current[0]).toBe('light');
  });
});
```

---

## Testing Forms with React Hook Form

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- Schema definition ---
const settingsSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  tier: z.enum(['free', 'starter', 'plus', 'smart', 'pro']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// --- Component ---
function SettingsForm({ onSubmit }: { onSubmit: (data: SettingsFormData) => Promise<void> }) {
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: '',
      email: '',
      tier: 'free',
      notifications: { email: true, push: false, sms: false },
      bio: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label>
        Display Name
        <input {...form.register('displayName')} />
      </label>
      {form.formState.errors.displayName && (
        <span role="alert">{form.formState.errors.displayName.message}</span>
      )}

      <label>
        Email
        <input type="email" {...form.register('email')} />
      </label>
      {form.formState.errors.email && (
        <span role="alert">{form.formState.errors.email.message}</span>
      )}

      <label>
        <input type="checkbox" {...form.register('notifications.email')} />
        Email Notifications
      </label>

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}

// --- Tests ---
describe('SettingsForm', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockReset();
  });

  it('submits valid data', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);

    render(<SettingsForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/display name/i), 'Stone AI User');
    await user.type(screen.getByLabelText(/email/i), 'user@stone-ai.net');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Stone AI User',
          email: 'user@stone-ai.net',
        }),
        expect.anything() // react-hook-form event
      );
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();

    render(<SettingsForm onSubmit={mockSubmit} />);

    // Submit without filling anything
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for short name', async () => {
    const user = userEvent.setup();

    render(<SettingsForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/display name/i), 'A');
    await user.type(screen.getByLabelText(/email/i), 'valid@email.com');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
  });

  it('shows submitting state', async () => {
    const user = userEvent.setup();
    // Make submit hang to test loading state
    mockSubmit.mockImplementation(() => new Promise(() => {}));

    render(<SettingsForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/display name/i), 'Valid Name');
    await user.type(screen.getByLabelText(/email/i), 'valid@email.com');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('handles checkbox toggles', async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue(undefined);

    render(<SettingsForm onSubmit={mockSubmit} />);

    const emailCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
    expect(emailCheckbox).toBeChecked(); // default is true

    await user.click(emailCheckbox);
    expect(emailCheckbox).not.toBeChecked();

    // Fill required fields and submit
    await user.type(screen.getByLabelText(/display name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.objectContaining({ email: false }),
        }),
        expect.anything()
      );
    });
  });
});

// --- Testing multi-step forms ---
describe('Multi-step form', () => {
  it('navigates between steps', async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    // Step 1: Personal info
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/name/i), 'New User');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Preferences
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Confirmation
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByText('New User')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('preserves data across steps', async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    await user.type(screen.getByLabelText(/name/i), 'New User');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByLabelText(/name/i)).toHaveValue('New User');
  });
});
```

---

## Mocking Strategies

### MSW (Mock Service Worker) for API Mocking

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

// Types for mock data
interface Agent {
  id: string;
  name: string;
  description: string;
  tier: string;
  number: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Mock data
const mockAgents: Agent[] = [
  { id: '1', name: 'Researcher', description: 'Deep research agent', tier: 'free', number: 1 },
  { id: '2', name: 'Writer', description: 'Content writing agent', tier: 'free', number: 2 },
  { id: '3', name: 'Analyst', description: 'Data analysis agent', tier: 'starter', number: 5 },
];

export const handlers = [
  // GET /api/agents
  http.get('/api/agents', async ({ request }) => {
    const url = new URL(request.url);
    const tier = url.searchParams.get('tier');

    await delay(100); // Simulate network latency

    const filtered = tier
      ? mockAgents.filter(a => a.tier === tier)
      : mockAgents;

    return HttpResponse.json({ agents: filtered, total: filtered.length });
  }),

  // POST /api/chat
  http.post('/api/chat', async ({ request }) => {
    const body = await request.json() as { message: string; agentId: string };

    await delay(200);

    return HttpResponse.json({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Response to: ${body.message}`,
      createdAt: new Date().toISOString(),
    });
  }),

  // Streaming endpoint (SSE)
  http.post('/api/chat/stream', async ({ request }) => {
    const body = await request.json() as { message: string };
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const words = ['Hello', ' ', 'from', ' ', 'the', ' ', 'AI', ' ', 'agent.'];
        for (const word of words) {
          await new Promise(r => setTimeout(r, 50));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: word })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),

  // Error scenario handlers
  http.get('/api/agents/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // Rate limit scenario
  http.post('/api/chat/rate-limited', () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429 }
    );
  }),

  // Stripe billing endpoints
  http.post('/api/billing/create-checkout', async ({ request }) => {
    const body = await request.json() as { priceId: string };
    await delay(300);
    return HttpResponse.json({
      url: `https://checkout.stripe.com/test_session_${body.priceId}`,
    });
  }),

  http.get('/api/billing/subscription', () => {
    return HttpResponse.json({
      status: 'active',
      tier: 'starter',
      currentPeriodEnd: '2026-04-09T00:00:00Z',
      cancelAtPeriodEnd: false,
    });
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// vitest.setup.ts — add MSW setup
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mocking Next.js Router

```typescript
// src/test-utils/mock-router.ts
import { vi } from 'vitest';

// Mock next/navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/chat',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// When you need to assert router calls:
import { useRouter } from 'next/navigation';

describe('Navigation', () => {
  it('navigates to agent page on click', async () => {
    const user = userEvent.setup();
    const mockPush = vi.fn();

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    render(<AgentCard agent={mockAgent} />);
    await user.click(screen.getByRole('link', { name: /researcher/i }));

    expect(mockPush).toHaveBeenCalledWith('/agents/1');
  });
});

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
```

### Mocking Clerk Authentication

```typescript
// src/test-utils/mock-clerk.ts
import { vi } from 'vitest';

// Basic Clerk mock
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({
    userId: 'user_test123',
    sessionId: 'sess_test123',
    orgId: null,
  }),
  currentUser: () => ({
    id: 'user_test123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@stone-ai.net' }],
    imageUrl: 'https://example.com/avatar.png',
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_test123',
    sessionId: 'sess_test123',
    signOut: vi.fn(),
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@stone-ai.net' }],
      imageUrl: 'https://example.com/avatar.png',
      publicMetadata: { tier: 'starter' },
    },
  }),
  useClerk: () => ({
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => null,
  UserButton: () => <button>User Menu</button>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Testing signed-out state
describe('when user is signed out', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      signOut: vi.fn(),
      getToken: vi.fn(),
    } as any);

    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    } as any);
  });

  it('shows sign-in prompt', () => {
    render(<ProtectedPage />);
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
  });
});

// Testing different tiers
describe('tier-based access', () => {
  it('shows premium agents for SMART tier', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: 'user_smart',
        publicMetadata: { tier: 'smart' },
      },
    } as any);

    render(<AgentList />);
    expect(screen.getAllByRole('listitem')).toHaveLength(39); // SMART = 39 agents
  });

  it('shows limited agents for FREE tier', () => {
    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: 'user_free',
        publicMetadata: { tier: 'free' },
      },
    } as any);

    render(<AgentList />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4); // FREE = 4 agents
  });
});
```

### Mocking Environment Variables

```typescript
// In individual tests
describe('feature flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('enables premium features in production', async () => {
    process.env.NEXT_PUBLIC_ENABLE_PREMIUM = 'true';

    const { PremiumBadge } = await import('@/components/premium-badge');
    render(<PremiumBadge />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('hides premium features when disabled', async () => {
    process.env.NEXT_PUBLIC_ENABLE_PREMIUM = 'false';

    const { PremiumBadge } = await import('@/components/premium-badge');
    render(<PremiumBadge />);

    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });
});
```

---

## Integration Tests

### Full Page Render Tests

```typescript
// __tests__/integration/chat-page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Import the actual page component
import ChatPage from '@/app/chat/page';

describe('Chat Page Integration', () => {
  it('renders the full chat interface', async () => {
    render(
      <TestProviders>
        <ChatPage />
      </TestProviders>
    );

    // Wait for initial data load
    expect(await screen.findByRole('textbox', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByText(/select an agent/i)).toBeInTheDocument();
  });

  it('sends a message and receives a response', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <ChatPage />
      </TestProviders>
    );

    // Wait for page to load
    const input = await screen.findByRole('textbox', { name: /message/i });

    // Type and send message
    await user.type(input, 'Hello, what can you do?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // User message appears
    expect(screen.getByText('Hello, what can you do?')).toBeInTheDocument();

    // Wait for AI response
    expect(await screen.findByText(/Response to:/)).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();

    // Override handler to simulate error
    server.use(
      http.post('/api/chat', () => {
        return HttpResponse.json(
          { error: 'Service unavailable' },
          { status: 503 }
        );
      })
    );

    render(
      <TestProviders>
        <ChatPage />
      </TestProviders>
    );

    const input = await screen.findByRole('textbox', { name: /message/i });
    await user.type(input, 'test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Error message should appear
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });

  it('handles empty message submission', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <ChatPage />
      </TestProviders>
    );

    const sendButton = await screen.findByRole('button', { name: /send/i });

    // Button should be disabled with empty input
    expect(sendButton).toBeDisabled();
  });
});

// Full user flow test
describe('User Onboarding Flow', () => {
  it('completes the full onboarding process', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <OnboardingPage />
      </TestProviders>
    );

    // Step 1: Welcome
    expect(screen.getByText(/welcome to stone ai/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /get started/i }));

    // Step 2: Choose theme
    await user.click(screen.getByRole('button', { name: /dark/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Select initial agent
    await user.click(screen.getByText(/researcher/i));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Step 4: Optional bestie setup
    await user.click(screen.getByRole('button', { name: /skip for now/i }));

    // Completion
    expect(await screen.findByText(/you're all set/i)).toBeInTheDocument();
  });
});
```

### Testing with Real Query Client

```typescript
describe('Agent List with real query caching', () => {
  it('caches agent data between navigations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: false,
        },
      },
    });

    let fetchCount = 0;
    server.use(
      http.get('/api/agents', () => {
        fetchCount++;
        return HttpResponse.json({ agents: mockAgents });
      })
    );

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <AgentList />
      </QueryClientProvider>
    );

    await screen.findByText('Researcher');
    expect(fetchCount).toBe(1);

    // Unmount and remount — data should come from cache
    unmount();

    render(
      <QueryClientProvider client={queryClient}>
        <AgentList />
      </QueryClientProvider>
    );

    // Data appears immediately from cache
    expect(screen.getByText('Researcher')).toBeInTheDocument();
    expect(fetchCount).toBe(1); // No additional fetch
  });
});
```

---

## Snapshot Testing

### When to Use Snapshots

Use snapshots for:
- Static UI components that rarely change (icons, badges, labels)
- Configuration objects
- Serialized data structures

Avoid snapshots for:
- Large component trees (brittle, hard to review diffs)
- Components with dynamic data (dates, IDs)
- Anything that changes frequently

### Inline Snapshots (Preferred)

```typescript
describe('Badge', () => {
  it('renders tier badge correctly', () => {
    const { container } = render(<TierBadge tier="smart" />);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <span
        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800"
      >
        SMART
      </span>
    `);
  });
});

// Snapshot for data structures
describe('pricing utils', () => {
  it('generates correct price map', () => {
    expect(getPriceMap()).toMatchInlineSnapshot(`
      {
        "free": 0,
        "plus": 49.99,
        "pro": 200,
        "smart": 99.99,
        "starter": 19.99,
      }
    `);
  });
});
```

### File Snapshots (For Larger Structures)

```typescript
describe('SVG Avatar Generator', () => {
  it('generates consistent avatar SVG', () => {
    const svg = generateAvatar({ seed: 'test-user', size: 64 });
    expect(svg).toMatchSnapshot();
  });
});
```

### Updating Snapshots

```bash
# Update all snapshots
vitest run --update

# Update snapshots for specific test file
vitest run src/components/badge.test.tsx --update
```

---

## Playwright E2E Testing

### Setup: playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Auth Setup for E2E Tests

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to sign-in
  await page.goto('/sign-in');

  // Fill Clerk sign-in form
  await page.getByLabel('Email address').fill('test@stone-ai.net');
  await page.getByRole('button', { name: /continue/i }).click();

  // Fill password
  await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/chat');
  await expect(page.getByText(/welcome/i)).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

### E2E Test Examples

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('sends a message and receives a response', async ({ page }) => {
    await page.goto('/chat');

    // Select an agent
    await page.getByRole('combobox', { name: /agent/i }).click();
    await page.getByRole('option', { name: /researcher/i }).click();

    // Type a message
    const input = page.getByRole('textbox', { name: /message/i });
    await input.fill('What is machine learning?');
    await input.press('Enter');

    // Wait for response
    const response = page.locator('[data-role="assistant"]').last();
    await expect(response).toBeVisible({ timeout: 30000 });
    await expect(response).not.toBeEmpty();
  });

  test('chat history persists across page reloads', async ({ page }) => {
    await page.goto('/chat');

    // Send a message
    const input = page.getByRole('textbox', { name: /message/i });
    await input.fill('Remember this: testing123');
    await input.press('Enter');

    // Wait for response
    await page.locator('[data-role="assistant"]').last().waitFor();

    // Reload page
    await page.reload();

    // Previous messages should still be visible
    await expect(page.getByText('Remember this: testing123')).toBeVisible();
  });

  test('handles rate limiting gracefully', async ({ page }) => {
    await page.goto('/chat');

    const input = page.getByRole('textbox', { name: /message/i });

    // Send multiple messages rapidly
    for (let i = 0; i < 10; i++) {
      await input.fill(`Rapid message ${i}`);
      await input.press('Enter');
      await page.waitForTimeout(100);
    }

    // Should show rate limit warning, not crash
    const alert = page.getByRole('alert');
    if (await alert.isVisible()) {
      await expect(alert).toContainText(/slow down|rate limit/i);
    }
  });
});

// e2e/billing.spec.ts
test.describe('Billing', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('shows current subscription status', async ({ page }) => {
    await page.goto('/settings/billing');

    await expect(page.getByText(/current plan/i)).toBeVisible();
    await expect(page.getByText(/starter/i)).toBeVisible();
  });

  test('upgrade flow opens Stripe checkout', async ({ page }) => {
    await page.goto('/settings/billing');

    await page.getByRole('button', { name: /upgrade to plus/i }).click();

    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/);
  });
});

// e2e/responsive.spec.ts
test.describe('Responsive Design', () => {
  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/chat');

    // Desktop nav should be hidden
    await expect(page.getByRole('navigation')).not.toBeVisible();

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    // Open mobile nav
    await menuButton.click();

    // Nav links should be visible in sheet
    await expect(page.getByRole('link', { name: /chat/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /agents/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });
});

// Page Object Model pattern for complex flows
class ChatPageObject {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/chat');
    await this.page.waitForLoadState('networkidle');
  }

  async selectAgent(name: string) {
    await this.page.getByRole('combobox', { name: /agent/i }).click();
    await this.page.getByRole('option', { name: new RegExp(name, 'i') }).click();
  }

  async sendMessage(text: string) {
    const input = this.page.getByRole('textbox', { name: /message/i });
    await input.fill(text);
    await input.press('Enter');
  }

  async waitForResponse() {
    const response = this.page.locator('[data-role="assistant"]').last();
    await response.waitFor({ timeout: 30000 });
    return response;
  }

  async getMessageCount() {
    return this.page.locator('[data-role]').count();
  }
}

test('full chat flow with page object', async ({ page }) => {
  const chat = new ChatPageObject(page);
  await chat.goto();
  await chat.selectAgent('Researcher');
  await chat.sendMessage('Tell me about AI');
  const response = await chat.waitForResponse();
  await expect(response).not.toBeEmpty();
});
```

---

## Test Organization

### Directory Structure

```
stone-ai/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-input.test.tsx        # Co-located unit test
│   │   │   ├── chat-message.tsx
│   │   │   └── chat-message.test.tsx
│   │   ├── ui/
│   │   │   └── button.test.tsx            # shadcn/ui wrapper tests
│   │   └── shared/
│   │       ├── avatar.tsx
│   │       └── avatar.test.tsx
│   ├── hooks/
│   │   ├── use-chat.ts
│   │   └── use-chat.test.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── utils.test.ts
│   └── app/
│       └── chat/
│           └── page.test.tsx              # Page-level integration test
├── __tests__/
│   └── integration/
│       ├── chat-flow.test.tsx             # Multi-component integration
│       ├── billing-flow.test.tsx
│       └── auth-flow.test.tsx
├── e2e/
│   ├── auth.setup.ts
│   ├── chat.spec.ts                       # E2E tests
│   ├── billing.spec.ts
│   └── .auth/                             # Stored auth state
│       └── user.json
├── src/mocks/
│   ├── handlers.ts                        # MSW handlers
│   ├── server.ts                          # MSW server setup
│   └── data/                              # Mock data factories
│       ├── agents.ts
│       ├── users.ts
│       └── messages.ts
├── vitest.config.ts
├── vitest.setup.ts
└── playwright.config.ts
```

### Naming Conventions

```typescript
// Describe blocks: component/module name
describe('ChatInput', () => {
  // Nested describe for feature groups
  describe('message submission', () => {
    // Test names start with action verbs
    it('sends message on Enter key', async () => {});
    it('clears input after sending', async () => {});
    it('prevents empty message submission', async () => {});
  });

  describe('character limit', () => {
    it('shows remaining character count', () => {});
    it('disables send button at max length', () => {});
  });

  describe('error handling', () => {
    it('shows error toast on send failure', async () => {});
    it('retries failed message on retry click', async () => {});
  });

  describe('accessibility', () => {
    it('has proper aria labels', () => {});
    it('supports keyboard navigation', async () => {});
  });
});
```

### Mock Data Factories

```typescript
// src/mocks/data/agents.ts
import { faker } from '@faker-js/faker';

interface MockAgent {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'starter' | 'plus' | 'smart' | 'pro';
  number: number;
  category: string;
  isActive: boolean;
}

export function createMockAgent(overrides?: Partial<MockAgent>): MockAgent {
  return {
    id: faker.string.uuid(),
    name: faker.person.firstName(),
    description: faker.lorem.sentence(),
    tier: faker.helpers.arrayElement(['free', 'starter', 'plus', 'smart', 'pro']),
    number: faker.number.int({ min: 1, max: 42 }),
    category: faker.helpers.arrayElement(['research', 'writing', 'analysis', 'coding']),
    isActive: true,
    ...overrides,
  };
}

export function createMockAgentList(count: number, overrides?: Partial<MockAgent>): MockAgent[] {
  return Array.from({ length: count }, () => createMockAgent(overrides));
}

// src/mocks/data/messages.ts
interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  agentId: string;
}

export function createMockMessage(overrides?: Partial<MockMessage>): MockMessage {
  return {
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(['user', 'assistant']),
    content: faker.lorem.paragraph(),
    createdAt: faker.date.recent(),
    agentId: faker.string.uuid(),
    ...overrides,
  };
}

export function createMockConversation(messageCount = 6): MockMessage[] {
  return Array.from({ length: messageCount }, (_, i) =>
    createMockMessage({
      role: i % 2 === 0 ? 'user' : 'assistant',
      createdAt: new Date(Date.now() - (messageCount - i) * 60000),
    })
  );
}
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Check coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage below 80% threshold"
            exit 1
          fi

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run E2E tests
        run: npx playwright test
        env:
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  test-summary:
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests]
    if: always()
    steps:
      - name: Check test results
        run: |
          if [ "${{ needs.unit-tests.result }}" = "failure" ] || [ "${{ needs.e2e-tests.result }}" = "failure" ]; then
            echo "Tests failed"
            exit 1
          fi
```

### Pre-commit Hook for Tests

```bash
#!/bin/bash
# .husky/pre-commit

# Run only tests related to changed files
npx vitest run --changed --passWithNoTests

# Run type checking
npx tsc --noEmit
```

### Coverage Configuration

```typescript
// vitest.config.ts coverage section
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.d.ts',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.stories.{ts,tsx}',
    'src/mocks/**',
    'src/**/types.ts',
  ],
  thresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds for critical paths
    'src/lib/billing/**': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95,
    },
    'src/lib/auth/**': {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
},
```

---

## Real-World Test Examples

### Chat Component Tests

```typescript
// src/components/chat/chat-input.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChatInput } from './chat-input';

describe('ChatInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    isLoading: false,
    maxLength: 4000,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('message submission', () => {
    it('calls onSend with message content on Enter', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello AI agent');
      await user.keyboard('{Enter}');

      expect(onSend).toHaveBeenCalledWith('Hello AI agent');
    });

    it('does not submit on Shift+Enter (newline)', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(input, 'Line 2');

      expect(onSend).not.toHaveBeenCalled();
    });

    it('clears input after successful send', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn().mockResolvedValue(undefined);

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('does not clear input on send failure', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn().mockRejectedValue(new Error('Failed'));

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('test message');
      });
    });

    it('prevents submission when empty', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      await user.keyboard('{Enter}');
      expect(onSend).not.toHaveBeenCalled();
    });

    it('trims whitespace before submission', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();

      render(<ChatInput {...defaultProps} onSend={onSend} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '   hello   ');
      await user.keyboard('{Enter}');

      expect(onSend).toHaveBeenCalledWith('hello');
    });
  });

  describe('loading state', () => {
    it('disables input while loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('shows stop button while streaming', () => {
      render(<ChatInput {...defaultProps} isLoading={true} onStop={vi.fn()} />);

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });
  });

  describe('character limit', () => {
    it('shows character count near limit', async () => {
      const user = userEvent.setup();

      render(<ChatInput {...defaultProps} maxLength={100} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a'.repeat(90));

      expect(screen.getByText('90/100')).toBeInTheDocument();
    });

    it('prevents typing beyond max length', async () => {
      const user = userEvent.setup();

      render(<ChatInput {...defaultProps} maxLength={10} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a'.repeat(15));

      expect(input).toHaveValue('a'.repeat(10));
    });
  });
});

// src/components/chat/chat-message.test.tsx
import { ChatMessage } from './chat-message';

describe('ChatMessage', () => {
  it('renders user message with correct styling', () => {
    render(
      <ChatMessage
        role="user"
        content="Hello, how are you?"
        timestamp={new Date('2026-03-09T10:00:00')}
      />
    );

    const message = screen.getByText('Hello, how are you?');
    expect(message.closest('[data-role="user"]')).toBeInTheDocument();
  });

  it('renders assistant message with markdown', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Here is some **bold** text and a `code snippet`."
        timestamp={new Date('2026-03-09T10:01:00')}
      />
    );

    expect(screen.getByText('bold')).toHaveClass(/font-bold|font-semibold/);
    expect(screen.getByText('code snippet')).toHaveClass(/font-mono/);
  });

  it('renders code blocks with copy button', async () => {
    const user = userEvent.setup();

    render(
      <ChatMessage
        role="assistant"
        content={'```typescript\nconst x = 1;\n```'}
        timestamp={new Date()}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it('renders agent avatar for assistant messages', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Hello!"
        agentName="Researcher"
        agentAvatar="/agents/researcher.svg"
        timestamp={new Date()}
      />
    );

    expect(screen.getByAltText('Researcher')).toBeInTheDocument();
  });

  it('shows timestamp on hover', async () => {
    const user = userEvent.setup();

    render(
      <ChatMessage
        role="user"
        content="Hello"
        timestamp={new Date('2026-03-09T10:00:00')}
      />
    );

    await user.hover(screen.getByText('Hello'));
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });
});
```

### Auth Flow Tests

```typescript
// __tests__/integration/auth-flow.test.tsx
describe('Authentication Flow', () => {
  describe('protected routes', () => {
    it('redirects unauthenticated users to sign-in', () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
      } as any);

      const mockRedirect = vi.fn();
      vi.mocked(redirect).mockImplementation(mockRedirect);

      render(<ProtectedLayout><ChatPage /></ProtectedLayout>);

      expect(mockRedirect).toHaveBeenCalledWith('/sign-in');
    });

    it('renders content for authenticated users', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_123',
      } as any);

      render(<ProtectedLayout><ChatPage /></ProtectedLayout>);

      expect(await screen.findByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('tier-based access control', () => {
    const tiers = [
      { tier: 'free', agentCount: 4 },
      { tier: 'starter', agentCount: 16 },
      { tier: 'plus', agentCount: 30 },
      { tier: 'smart', agentCount: 39 },
      { tier: 'pro', agentCount: 38 },
    ] as const;

    tiers.forEach(({ tier, agentCount }) => {
      it(`shows ${agentCount} agents for ${tier} tier`, async () => {
        vi.mocked(useUser).mockReturnValue({
          isLoaded: true,
          isSignedIn: true,
          user: {
            id: `user_${tier}`,
            publicMetadata: { tier },
          },
        } as any);

        render(
          <TestProviders>
            <AgentSelector />
          </TestProviders>
        );

        await waitFor(() => {
          const agents = screen.getAllByRole('option');
          expect(agents).toHaveLength(agentCount);
        });
      });
    });

    it('shows upgrade prompt when accessing locked agent', async () => {
      const user = userEvent.setup();

      vi.mocked(useUser).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: {
          id: 'user_free',
          publicMetadata: { tier: 'free' },
        },
      } as any);

      render(
        <TestProviders>
          <AgentCard agent={{ id: '10', name: 'Premium Agent', tier: 'starter', number: 10 }} />
        </TestProviders>
      );

      await user.click(screen.getByText('Premium Agent'));

      expect(screen.getByText(/upgrade to starter/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
    });
  });
});
```

### Billing Page Tests

```typescript
// __tests__/integration/billing-flow.test.tsx
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Billing Page', () => {
  it('displays current subscription details', async () => {
    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    expect(await screen.findByText(/starter/i)).toBeInTheDocument();
    expect(screen.getByText(/\$19\.99\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/renews on april 9/i)).toBeInTheDocument();
  });

  it('shows all tier options for upgrade', async () => {
    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    await screen.findByText(/starter/i);

    expect(screen.getByText(/plus.*\$49\.99/i)).toBeInTheDocument();
    expect(screen.getByText(/smart.*\$99\.99/i)).toBeInTheDocument();
    expect(screen.getByText(/pro.*\$200/i)).toBeInTheDocument();
  });

  it('initiates checkout for upgrade', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    await screen.findByText(/starter/i);

    const upgradeButton = screen.getByRole('button', { name: /upgrade to plus/i });
    await user.click(upgradeButton);

    // Should show loading state
    expect(await screen.findByText(/redirecting to checkout/i)).toBeInTheDocument();
  });

  it('shows annual pricing option with discount', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    await screen.findByText(/starter/i);

    // Toggle to annual
    await user.click(screen.getByRole('switch', { name: /annual billing/i }));

    // SMART annual should show $84.99
    expect(screen.getByText(/\$79\.99\/year/i)).toBeInTheDocument();
    // PRO annual should show $170
    expect(screen.getByText(/\$170\/year/i)).toBeInTheDocument();
  });

  it('handles cancellation flow', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    await screen.findByText(/starter/i);

    await user.click(screen.getByRole('button', { name: /cancel subscription/i }));

    // Confirmation dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm cancellation/i }));

    expect(await screen.findByText(/subscription will end/i)).toBeInTheDocument();
  });

  it('handles payment failure gracefully', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/billing/create-checkout', () => {
        return HttpResponse.json(
          { error: 'Payment method declined' },
          { status: 402 }
        );
      })
    );

    render(
      <TestProviders>
        <BillingPage />
      </TestProviders>
    );

    await screen.findByText(/starter/i);

    await user.click(screen.getByRole('button', { name: /upgrade to plus/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/payment.*declined/i);
  });
});
```

---

## Testing Anti-Patterns to Avoid

### Common Mistakes

```typescript
// BAD: Testing implementation details
it('sets state correctly', () => {
  const { result } = renderHook(() => useMyHook());
  // Don't test internal state — test behavior
  expect(result.current.internalState).toBe('something');
});

// GOOD: Test observable behavior
it('shows updated value after toggle', () => {
  render(<ToggleComponent />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('ON')).toBeInTheDocument();
});

// BAD: Querying by class name or data-testid when better options exist
const element = container.querySelector('.my-class');

// GOOD: Query by role
const element = screen.getByRole('button', { name: /submit/i });

// BAD: Using act() unnecessarily — userEvent.setup() handles it
act(() => {
  fireEvent.click(button);
});

// GOOD: Use userEvent
const user = userEvent.setup();
await user.click(button);

// BAD: Using fixed timeouts
await new Promise(r => setTimeout(r, 1000));

// GOOD: Use waitFor or findBy
await waitFor(() => {
  expect(screen.getByText('loaded')).toBeInTheDocument();
});

// BAD: Testing third-party library internals
expect(queryClient.getQueryData(['agents'])).toEqual(mockAgents);

// GOOD: Test what the user sees
expect(screen.getByText('Researcher')).toBeInTheDocument();

// BAD: Massive snapshot of entire page
expect(container).toMatchSnapshot();

// GOOD: Targeted assertion or inline snapshot of small element
expect(screen.getByRole('badge')).toHaveTextContent('PRO');
```

---

## Quick Reference

| What to Test | Tool | Query Strategy |
|---|---|---|
| Component renders | RTL render + screen | getByRole, getByText |
| User interactions | userEvent.setup() | click, type, keyboard |
| Async data loading | findBy* or waitFor | findByText, findByRole |
| Element absence | queryBy* | queryByText returns null |
| Hook behavior | renderHook + act | result.current |
| API responses | MSW handlers | server.use() for overrides |
| Full page flows | RTL + MSW + providers | Integration test pattern |
| Cross-browser | Playwright | E2E test pattern |
| Visual regression | Playwright screenshots | toHaveScreenshot() |
| Accessibility | getByRole queries | Queries enforce a11y by design |

---

*This seed covers the complete testing stack for Stone AI's Next.js 16 frontend. Every pattern shown here is production-ready and follows React Testing Library's guiding principle: "The more your tests resemble the way your software is used, the more confidence they can give you."*
