# Form Validation Patterns

## Deep Knowledge Seed — Palace LLM Reference

Complete reference for building forms with react-hook-form v7, Zod validation, and shadcn/ui form components in a Next.js 16 + TypeScript stack. Every pattern includes production-ready code.

---

## 1. Foundation: react-hook-form + Zod Setup

### Installation

```bash
npm install react-hook-form @hookform/resolvers zod
```

### Core Architecture

```
Zod Schema (defines shape + validation rules)
    ↓
zodResolver (bridges Zod to react-hook-form)
    ↓
useForm (manages form state, validation, submission)
    ↓
FormField + FormControl (shadcn wrappers for accessibility)
    ↓
Input/Select/Textarea (actual form elements)
    ↓
FormMessage (displays errors from Zod)
```

### Basic Pattern

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define the schema
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// 2. Infer the TypeScript type
type FormData = z.infer<typeof schema>;

// 3. Use in component
export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    // data is fully typed and validated
    console.log(data); // { email: string, password: string }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... fields ... */}
    </form>
  );
}
```

---

## 2. Zod Schema Patterns

### String Validation

```typescript
const userSchema = z.object({
  // Basic string
  name: z.string().min(1, "Name is required"),

  // Email
  email: z.string().email("Invalid email"),

  // URL
  website: z.string().url("Invalid URL").optional().or(z.literal("")),

  // Regex
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, hyphens, underscores"),

  // Trimmed and transformed
  displayName: z
    .string()
    .min(1, "Required")
    .max(50, "Max 50 characters")
    .trim(),

  // Enum
  role: z.enum(["admin", "user", "moderator"], {
    required_error: "Please select a role",
  }),

  // Password with multiple rules
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
});
```

### Number Validation

```typescript
const productSchema = z.object({
  price: z
    .number({ required_error: "Price is required", invalid_type_error: "Must be a number" })
    .positive("Must be positive")
    .multipleOf(0.01, "Max 2 decimal places"),

  quantity: z
    .number()
    .int("Must be a whole number")
    .min(1, "Minimum 1")
    .max(999, "Maximum 999"),

  // Coerce from string input (HTML inputs always return strings)
  age: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(13, "Must be at least 13")
    .max(120, "Invalid age"),
});
```

### Date Validation

```typescript
const eventSchema = z.object({
  startDate: z.coerce
    .date({ required_error: "Start date is required" })
    .min(new Date(), "Must be in the future"),

  endDate: z.coerce
    .date({ required_error: "End date is required" }),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);
```

### Array and Nested Object Validation

```typescript
const teamSchema = z.object({
  teamName: z.string().min(1, "Required"),

  members: z
    .array(
      z.object({
        name: z.string().min(1, "Name required"),
        email: z.string().email("Invalid email"),
        role: z.enum(["lead", "member", "observer"]),
      })
    )
    .min(1, "At least one member required")
    .max(10, "Maximum 10 members"),

  tags: z
    .array(z.string().min(1))
    .min(1, "At least one tag required")
    .max(5, "Maximum 5 tags"),

  settings: z.object({
    isPublic: z.boolean().default(false),
    maxAgents: z.number().int().min(1).max(44),
    tier: z.enum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]),
  }),
});
```

### Discriminated Unions

```typescript
const notificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    emailAddress: z.string().email(),
    frequency: z.enum(["instant", "daily", "weekly"]),
  }),
  z.object({
    type: z.literal("sms"),
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
  }),
  z.object({
    type: z.literal("webhook"),
    url: z.string().url("Invalid webhook URL"),
    secret: z.string().min(16, "Secret must be at least 16 characters"),
  }),
]);
```

### Refinements (Cross-field Validation)

```typescript
const registerSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Error shows on confirmPassword field
  });

// Multiple refinements
const scheduleSchema = z
  .object({
    startTime: z.string(),
    endTime: z.string(),
    breakStart: z.string().optional(),
    breakEnd: z.string().optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (d) => {
      if (d.breakStart && d.breakEnd) {
        return d.breakEnd > d.breakStart;
      }
      return true;
    },
    {
      message: "Break end must be after break start",
      path: ["breakEnd"],
    }
  );
```

### Strict Schemas (Security — REQUIRED for Stone AI mutations)

```typescript
// .strict() rejects unknown keys — prevents parameter injection
const updateProfileSchema = z.object({
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
}).strict(); // Rejects { username: "x", bio: "y", role: "admin" }

// For API routes:
export async function PATCH(req: Request) {
  const body = await req.json();
  const result = updateProfileSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // result.data is typed and safe
  await prisma.user.update({
    where: { id: userId },
    data: result.data,
  });
}
```

---

## 3. useForm Configuration

### Full Options

```typescript
const form = useForm<FormData>({
  // Validation adapter
  resolver: zodResolver(schema),

  // Initial values (ALWAYS provide these)
  defaultValues: {
    email: "",
    password: "",
    remember: false,
  },

  // When to validate
  mode: "onBlur",          // Validate on blur (recommended for UX)
  // mode: "onChange",      // Validate on every keystroke (expensive)
  // mode: "onSubmit",     // Validate only on submit (default)
  // mode: "onTouched",    // Validate on blur, then on change after first blur
  // mode: "all",          // Validate on blur AND change

  // When to re-validate after error
  reValidateMode: "onChange", // Re-validate on change after error shown

  // Focus first error on submit
  shouldFocusError: true,

  // Unregister fields when unmounted
  shouldUnregister: false, // Keep values of unmounted fields (for multi-step)

  // Delay validation (debounce)
  delayError: 500, // Show errors after 500ms delay
});
```

### Form State

```typescript
const {
  // Methods
  handleSubmit,    // Wraps your onSubmit with validation
  register,        // Register a field (uncontrolled)
  control,         // For Controller/FormField (controlled)
  reset,           // Reset form to defaults
  setValue,        // Programmatically set a field value
  getValues,       // Get current form values
  setError,        // Manually set an error
  clearErrors,     // Clear errors
  trigger,         // Manually trigger validation
  watch,           // Subscribe to field changes
  setFocus,        // Focus a field

  // State
  formState: {
    errors,          // Current validation errors
    isDirty,         // Any field changed from default
    isValid,         // All fields pass validation
    isSubmitting,    // Currently in onSubmit handler
    isSubmitted,     // Form has been submitted at least once
    isSubmitSuccessful, // Last submit succeeded
    submitCount,     // Number of submissions
    touchedFields,   // Fields the user has interacted with
    dirtyFields,     // Fields that differ from defaults
  },
} = form;
```

---

## 4. Field-Level vs Form-Level Validation

### Field-Level (per-field rules in schema)

This is the default with Zod — each field has its own rules:

```typescript
const schema = z.object({
  email: z.string().email("Invalid email"),        // Field-level
  age: z.coerce.number().min(13, "Must be 13+"),   // Field-level
});
```

Errors map directly to individual fields and show under each input.

### Form-Level (cross-field rules with .refine/.superRefine)

```typescript
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Attach error to specific field
  });

// Form-level error (no specific field)
const schema2 = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Invalid date range",
    // No path = root-level error
  });

// Access root errors
const rootError = form.formState.errors.root?.message;
// Or if using path-less refine:
// errors[""]?.message (empty string key)
```

### Manual Error Setting (from server responses)

```typescript
const onSubmit = async (data: FormData) => {
  const result = await createAccount(data);

  if (result.error) {
    // Set error on specific field
    if (result.error.field === "email") {
      form.setError("email", {
        type: "server",
        message: result.error.message, // "Email already taken"
      });
      return;
    }

    // Set root-level error
    form.setError("root", {
      type: "server",
      message: result.error.message, // "Server error, try again"
    });
  }
};

// Display root error
{form.formState.errors.root && (
  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
    {form.formState.errors.root.message}
  </div>
)}
```

---

## 5. Async Validation

### Checking Username Availability

```typescript
const schema = z.object({
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_-]+$/, "Invalid characters")
    .refine(
      async (username) => {
        // Debounced server check
        const response = await fetch(`/api/check-username?username=${username}`);
        const { available } = await response.json();
        return available;
      },
      { message: "Username is already taken" }
    ),
});

// Use mode: "onBlur" to avoid checking on every keystroke
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur",
  defaultValues: { username: "" },
});
```

### Async Validation with Loading State

```tsx
function UsernameField() {
  const { control, formState } = useFormContext();
  const isChecking = formState.isValidating;

  return (
    <FormField
      control={control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <div className="relative">
              <Input {...field} />
              {isChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Debounced Async Validation (Manual)

```tsx
"use client";

import { useForm, useWatch } from "react-hook-form";
import { useEffect, useRef, useState } from "react";

function UsernameFieldWithDebounce() {
  const form = useFormContext<{ username: string }>();
  const username = useWatch({ control: form.control, name: "username" });
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!username || username.length < 3) return;

    // Clear previous timer
    clearTimeout(debounceRef.current);

    // Clear previous errors
    form.clearErrors("username");

    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/check-username?u=${encodeURIComponent(username)}`);
        const { available } = await res.json();
        if (!available) {
          form.setError("username", {
            type: "validate",
            message: "Username is already taken",
          });
        }
      } finally {
        setChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [username, form]);

  return (
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <div className="relative">
              <Input {...field} />
              {checking && (
                <Loader2Icon className="absolute right-3 top-3 size-4 animate-spin" />
              )}
              {!checking && !form.formState.errors.username && username.length >= 3 && (
                <CheckIcon className="absolute right-3 top-3 size-4 text-green-500" />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

---

## 6. Multi-Step Form Wizard

### State Persistence Across Steps

```tsx
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Step schemas
const step1Schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

const step2Schema = z.object({
  company: z.string().min(1, "Required"),
  role: z.enum(["developer", "designer", "manager", "other"]),
});

const step3Schema = z.object({
  tier: z.enum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

// Combined schema for the full form
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FullFormData = z.infer<typeof fullSchema>;

const stepSchemas = [step1Schema, step2Schema, step3Schema] as const;
const TOTAL_STEPS = stepSchemas.length;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  const form = useForm<FullFormData>({
    resolver: zodResolver(stepSchemas[step]),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      role: undefined,
      tier: undefined,
      agreeToTerms: undefined,
    },
    mode: "onBlur",
    shouldUnregister: false, // CRITICAL: keep values across steps
  });

  const nextStep = async () => {
    // Validate current step before proceeding
    const fieldsToValidate = Object.keys(stepSchemas[step].shape) as (keyof FullFormData)[];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: FullFormData) => {
    // All steps validated — submit full form
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        {/* Step content */}
        {step === 0 && <Step1Fields />}
        {step === 1 && <Step2Fields />}
        {step === 2 && <Step3Fields />}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function Step1Fields() {
  const { control } = useFormContext<FullFormData>();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step2Fields() {
  const { control } = useFormContext<FullFormData>();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company</FormLabel>
            <FormControl>
              <Input placeholder="Acme Inc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step3Fields() {
  const { control } = useFormContext<FullFormData>();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="tier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subscription Tier</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="FREE">Free — $0</SelectItem>
                <SelectItem value="STARTER">Starter — $19.99/mo</SelectItem>
                <SelectItem value="PLUS">Plus — $49.99/mo</SelectItem>
                <SelectItem value="SMART">Smart — $99.99/mo</SelectItem>
                <SelectItem value="PRO">Pro — $200/mo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="agreeToTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>I agree to the Terms of Service and Privacy Policy</FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
```

---

## 7. File Upload Validation

### Schema

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const avatarSchema = z.object({
  avatar: z
    .custom<File>()
    .refine((file) => file instanceof File, "Please upload a file")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File must be under 5MB")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .png, .jpg, .webp, and .gif are accepted"
    ),
});

// Optional file (edit form where avatar might not change)
const editProfileSchema = z.object({
  name: z.string().min(1),
  avatar: z
    .custom<File>()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "File must be under 5MB")
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .png, .jpg, .webp, and .gif are accepted"
    )
    .optional(),
});

// Multiple files
const gallerySchema = z.object({
  images: z
    .custom<FileList>()
    .refine((files) => files.length >= 1, "Upload at least one image")
    .refine((files) => files.length <= 10, "Maximum 10 images")
    .refine(
      (files) => Array.from(files).every((f) => f.size <= MAX_FILE_SIZE),
      "Each file must be under 5MB"
    )
    .refine(
      (files) => Array.from(files).every((f) => ACCEPTED_IMAGE_TYPES.includes(f.type)),
      "Only image files are accepted"
    ),
});
```

### File Upload Component

```tsx
"use client";

function AvatarUploadField() {
  const { control, watch } = useFormContext();
  const [preview, setPreview] = useState<string | null>(null);

  const avatarFile = watch("avatar");

  useEffect(() => {
    if (avatarFile instanceof File) {
      const url = URL.createObjectURL(avatarFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  return (
    <FormField
      control={control}
      name="avatar"
      render={({ field: { onChange, value, ...field } }) => (
        <FormItem>
          <FormLabel>Avatar</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                  <UserIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onChange(file);
                }}
                {...field}
              />
            </div>
          </FormControl>
          <FormDescription>PNG, JPG, WebP, or GIF. Max 5MB.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Image Dimension Validation

```typescript
function validateImageDimensions(
  file: File,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const valid =
        img.width >= minWidth &&
        img.height >= minHeight &&
        img.width <= maxWidth &&
        img.height <= maxHeight;
      URL.revokeObjectURL(img.src);
      resolve(valid);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}

const bannerSchema = z.object({
  banner: z
    .custom<File>()
    .refine((file) => file instanceof File, "Required")
    .refine((file) => file.size <= 10 * 1024 * 1024, "Max 10MB")
    .refine(
      async (file) => validateImageDimensions(file, 1200, 400, 4096, 2048),
      "Image must be between 1200x400 and 4096x2048 pixels"
    ),
});
```

---

## 8. Dynamic Form Fields (Add/Remove)

### useFieldArray Pattern

```tsx
"use client";

import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1, "Label required"),
  url: z.string().url("Invalid URL"),
});

const profileLinksSchema = z.object({
  links: z
    .array(linkSchema)
    .min(0)
    .max(5, "Maximum 5 links"),
});

type ProfileLinksForm = z.infer<typeof profileLinksSchema>;

export function ProfileLinksEditor() {
  const form = useForm<ProfileLinksForm>({
    resolver: zodResolver(profileLinksSchema),
    defaultValues: {
      links: [{ label: "", url: "" }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "links",
  });

  const onSubmit = async (data: ProfileLinksForm) => {
    await fetch("/api/profile/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    toast.success("Links saved!");
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name={`links.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Label</FormLabel>}
                      <FormControl>
                        <Input placeholder="GitHub" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`links.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>URL</FormLabel>}
                      <FormControl>
                        <Input placeholder="https://github.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("shrink-0", index === 0 && "mt-8")}
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {fields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", url: "" })}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Link
          </Button>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save Links
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

### Drag-and-Drop Reorder with useFieldArray

```tsx
import { GripVerticalIcon } from "lucide-react";

// In the field list, add move functionality:
<div
  key={field.id}
  className="flex items-center gap-2 rounded-md border p-2"
  draggable
  onDragStart={(e) => e.dataTransfer.setData("index", String(index))}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    const fromIndex = Number(e.dataTransfer.getData("index"));
    move(fromIndex, index);
  }}
>
  <GripVerticalIcon className="size-4 cursor-grab text-muted-foreground" />
  {/* ... field inputs ... */}
</div>
```

---

## 9. Error Display Patterns

### Inline Errors (Default shadcn)

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Shows inline below the input */}
    </FormItem>
  )}
/>
```

### Error Summary (Top of Form)

```tsx
function ErrorSummary() {
  const { formState: { errors } } = useFormContext();
  const errorMessages = Object.entries(errors)
    .filter(([_, error]) => error?.message)
    .map(([field, error]) => ({
      field,
      message: error!.message as string,
    }));

  if (errorMessages.length === 0) return null;

  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircleIcon className="size-4 text-destructive" />
        <h4 className="text-sm font-medium text-destructive">
          Please fix the following errors:
        </h4>
      </div>
      <ul className="list-disc list-inside space-y-1">
        {errorMessages.map(({ field, message }) => (
          <li key={field} className="text-sm text-destructive">
            <button
              type="button"
              className="underline hover:no-underline"
              onClick={() => {
                document.querySelector(`[name="${field}"]`)?.focus();
              }}
            >
              {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Toast Errors

```tsx
const onSubmit = async (data: FormData) => {
  try {
    await saveData(data);
    toast.success("Saved successfully!");
  } catch (error) {
    toast.error("Failed to save", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// On invalid submit (validation errors)
<form onSubmit={form.handleSubmit(onSubmit, (errors) => {
  const errorCount = Object.keys(errors).length;
  toast.error(`${errorCount} validation error${errorCount > 1 ? "s" : ""}`, {
    description: "Please check the form and try again.",
  });
})}>
```

### Visual Error States on Inputs

```tsx
// The FormControl component automatically adds aria-invalid when there's an error.
// Style inputs to show red border on error:

// In your Input component:
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
```

---

## 10. Server-Side Validation + Client Revalidation

### Server Action Pattern (Next.js 16)

```typescript
// src/app/actions/profile.ts
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/),
  bio: z.string().max(500).optional(),
}).strict();

type ActionResult = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function updateProfile(
  formData: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Unauthorized" };

  // Server-side validation (ALWAYS validate on server, even if client validates)
  const result = updateProfileSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: {
      username: result.data.username,
      NOT: { clerkId: userId },
    },
  });

  if (existing) {
    return {
      success: false,
      errors: { username: ["Username is already taken"] },
    };
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: result.data,
  });

  return { success: true, message: "Profile updated" };
}
```

### Client Component Consuming Server Action

```tsx
"use client";

import { updateProfile } from "@/app/actions/profile";

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormValues }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = async (data: ProfileFormValues) => {
    const result = await updateProfile(data);

    if (!result.success) {
      // Map server errors back to form fields
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof ProfileFormValues, {
            type: "server",
            message: messages[0],
          });
        });
      }
      if (result.message) {
        form.setError("root", { message: result.message });
      }
      return;
    }

    toast.success(result.message);
    form.reset(data); // Reset dirty state with new values
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}
        {/* ... fields ... */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

### API Route Pattern

```typescript
// src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
}).strict();

export async function PATCH(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    // Return field-level errors
    return NextResponse.json(
      {
        success: false,
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // ... save to db ...

  return NextResponse.json({ success: true });
}
```

```tsx
// Client consuming API route
const onSubmit = async (data: FormData) => {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const { errors } = await res.json();
    if (errors) {
      Object.entries(errors).forEach(([field, messages]) => {
        form.setError(field as keyof FormData, {
          type: "server",
          message: (messages as string[])[0],
        });
      });
    }
    return;
  }

  toast.success("Saved!");
};
```

---

## 11. Accessibility

### Automatic (via shadcn Form components)

The shadcn `FormField` + `FormControl` + `FormMessage` pattern automatically handles:

- `htmlFor` on labels pointing to inputs
- `aria-invalid="true"` on inputs with errors
- `aria-describedby` linking inputs to their description and error messages
- `id` generation for all connections

### Manual Accessibility Additions

```tsx
// Live region for dynamic error announcements
<div role="alert" aria-live="polite" className="sr-only">
  {form.formState.errors.email?.message}
</div>

// Focus management on error
const onInvalid = (errors: FieldErrors<FormData>) => {
  // Focus first error field
  const firstErrorField = Object.keys(errors)[0];
  form.setFocus(firstErrorField as keyof FormData);
};

<form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>

// Required field indicator
<FormLabel>
  Email <span className="text-destructive" aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</FormLabel>

// Fieldset for groups
<fieldset>
  <legend className="text-sm font-medium mb-2">Notification Preferences</legend>
  {/* ... checkbox group ... */}
</fieldset>

// Progress for multi-step
<div
  role="progressbar"
  aria-valuenow={step + 1}
  aria-valuemin={1}
  aria-valuemax={TOTAL_STEPS}
  aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
>
  {/* visual progress bar */}
</div>
```

---

## 12. Common Form Component Recipes

### Switch/Toggle Field

```tsx
<FormField
  control={form.control}
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Email Notifications</FormLabel>
        <FormDescription>
          Receive emails about agent activity.
        </FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

### Radio Group Field

```tsx
<FormField
  control={form.control}
  name="tier"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Choose a plan</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex flex-col space-y-1"
        >
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="FREE" />
            </FormControl>
            <FormLabel className="font-normal">Free — $0/month</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="STARTER" />
            </FormControl>
            <FormLabel className="font-normal">Starter — $19.99/month</FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="PRO" />
            </FormControl>
            <FormLabel className="font-normal">Pro — $200/month</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Date Picker Field

```tsx
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

<FormField
  control={form.control}
  name="birthDate"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date of birth</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value ? format(field.value, "PPP") : "Pick a date"}
              <CalendarIcon className="ml-auto size-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea with Character Count

```tsx
<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Tell us about yourself..."
          className="resize-none"
          maxLength={500}
          {...field}
        />
      </FormControl>
      <div className="flex justify-between">
        <FormDescription>Brief description for your profile.</FormDescription>
        <span className={cn(
          "text-xs tabular-nums",
          (field.value?.length ?? 0) > 450
            ? "text-destructive"
            : "text-muted-foreground"
        )}>
          {field.value?.length ?? 0}/500
        </span>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 13. Pattern Reference Table

| Pattern | When to Use | Key API |
|---|---|---|
| `zodResolver(schema)` | Always | react-hook-form + Zod bridge |
| `z.object({}).strict()` | All mutations | Reject unknown keys |
| `.refine()` | Cross-field validation | After `.object()` |
| `.superRefine()` | Complex conditional validation | Multiple errors per check |
| `z.discriminatedUnion()` | Form changes based on a type field | Type-safe unions |
| `z.coerce.number()` | HTML number inputs | String → number |
| `useFieldArray()` | Dynamic add/remove fields | `append`, `remove`, `move` |
| `form.trigger()` | Manual/step validation | Multi-step wizards |
| `form.setError()` | Server error mapping | After failed API calls |
| `form.reset()` | After successful submit | Clears dirty state |
| `shouldUnregister: false` | Multi-step forms | Preserves unmounted fields |
| `mode: "onBlur"` | Best UX default | Validates on blur, not keystroke |

This covers every form validation pattern needed for Stone AI production development.
