# File Upload & Processing

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

File uploads require careful handling: size limits, type validation, virus scanning, efficient storage, and image processing. This seed covers multipart uploads, S3/R2 storage, image optimization, presigned URLs, and secure patterns for the Stone AI stack (Next.js 16, Vercel, Cloudflare R2, PostgreSQL 16).

---

## 1. Upload Architecture

```
Client → Presigned URL request → API validates auth/tier → Generate presigned URL
Client → Direct upload to R2/S3 → Completion webhook → API processes & validates
```

### Why Presigned URLs?

- Uploads bypass the server — go directly to object storage
- No Vercel function timeout risk (50MB upload on a 30s timeout = failure)
- Reduced bandwidth costs — data doesn't pass through your server

---

## 2. File Type Validation

```typescript
// src/lib/uploads/validation.ts

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  avatar: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  backdrop: ['image/png', 'image/jpeg', 'image/webp'],
  attachment: [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/json',
  ],
};

// NEVER trust Content-Type header alone — check magic bytes
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'application/pdf': [Buffer.from('%PDF')],
};

export function validateFileType(
  buffer: Buffer,
  declaredMimeType: string,
  category: keyof typeof ALLOWED_MIME_TYPES
): { valid: boolean; detectedType: string | null; reason?: string } {
  // Check if declared type is allowed
  const allowed = ALLOWED_MIME_TYPES[category];
  if (!allowed?.includes(declaredMimeType)) {
    return {
      valid: false,
      detectedType: null,
      reason: `File type ${declaredMimeType} not allowed for ${category}`,
    };
  }

  // Verify magic bytes match declared type
  const expectedMagic = MAGIC_BYTES[declaredMimeType];
  if (expectedMagic) {
    const headerSlice = buffer.slice(0, 12);
    const matches = expectedMagic.some((magic) =>
      headerSlice.includes(magic)
    );
    if (!matches) {
      return {
        valid: false,
        detectedType: detectTypeFromMagic(buffer),
        reason: 'File content does not match declared type',
      };
    }
  }

  // Block SVG data URIs (XSS vector) — Stone AI security rule
  if (declaredMimeType === 'image/svg+xml') {
    return { valid: false, detectedType: 'image/svg+xml', reason: 'SVG uploads not allowed' };
  }

  // Check for embedded scripts in images
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
  if (content.includes('<script') || content.includes('javascript:')) {
    return { valid: false, detectedType: null, reason: 'File contains embedded scripts' };
  }

  return { valid: true, detectedType: declaredMimeType };
}

function detectTypeFromMagic(buffer: Buffer): string | null {
  for (const [type, magics] of Object.entries(MAGIC_BYTES)) {
    const header = buffer.slice(0, 12);
    if (magics.some((magic) => header.includes(magic))) {
      return type;
    }
  }
  return null;
}

// Size limits per tier
const SIZE_LIMITS: Record<string, Record<string, number>> = {
  avatar: { FREE: 2, STARTER: 5, PLUS: 10, SMART: 10, PRO: 20 }, // MB
  backdrop: { FREE: 0, STARTER: 5, PLUS: 10, SMART: 20, PRO: 50 },
  attachment: { FREE: 5, STARTER: 25, PLUS: 50, SMART: 100, PRO: 200 },
};

export function getMaxFileSize(
  category: string,
  tier: string
): number {
  const limits = SIZE_LIMITS[category];
  return (limits?.[tier] ?? 0) * 1024 * 1024; // Convert to bytes
}
```

---

## 3. Presigned URL Generation

```typescript
// src/lib/uploads/presigned.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Cloudflare R2 is S3-compatible
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

export async function generatePresignedUploadUrl(
  userId: string,
  category: string,
  fileName: string,
  mimeType: string,
  fileSizeBytes: number,
  tier: string
): Promise<PresignedUrlResult> {
  // Validate size
  const maxSize = getMaxFileSize(category, tier);
  if (fileSizeBytes > maxSize) {
    throw new ValidationError(
      `File too large. Max size for ${category}: ${maxSize / (1024 * 1024)}MB`
    );
  }

  // Validate type
  const allowed = ALLOWED_MIME_TYPES[category as keyof typeof ALLOWED_MIME_TYPES];
  if (!allowed?.includes(mimeType)) {
    throw new ValidationError(`File type ${mimeType} not allowed`);
  }

  // Generate unique key
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
  const fileKey = `${category}/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
    Metadata: {
      'user-id': userId,
      'category': category,
      'original-name': fileName,
    },
  });

  const expiresIn = 300; // 5 minutes
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

  return { uploadUrl, fileKey, publicUrl, expiresIn };
}
```

### API Route

```typescript
// src/app/api/uploads/presign/route.ts
import { z } from 'zod';

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  category: z.enum(['avatar', 'backdrop', 'attachment']),
}).strict();

export const POST = withObservability(
  requireAuth(async (req: AuthenticatedRequest) => {
    const body = presignSchema.parse(await req.json());
    const { userId, tier } = req.auth;

    const result = await generatePresignedUploadUrl(
      userId,
      body.category,
      body.fileName,
      body.mimeType,
      body.fileSize,
      tier
    );

    // Track the pending upload
    await prisma.uploadRecord.create({
      data: {
        userId,
        fileKey: result.fileKey,
        category: body.category,
        fileName: body.fileName,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        status: 'pending',
        expiresAt: new Date(Date.now() + 300_000),
      },
    });

    return Response.json(result);
  })
);
```

---

## 4. Upload Completion and Processing

```typescript
// src/app/api/uploads/complete/route.ts

const completeSchema = z.object({
  fileKey: z.string().min(1),
}).strict();

export const POST = withObservability(
  requireAuth(async (req: AuthenticatedRequest) => {
    const { fileKey } = completeSchema.parse(await req.json());
    const { userId } = req.auth;

    // Verify the upload record belongs to this user
    const record = await prisma.uploadRecord.findFirst({
      where: {
        fileKey,
        userId,
        status: 'pending',
      },
    });

    if (!record) {
      throw new NotFoundError('Upload record');
    }

    // Verify the file actually exists in R2
    const exists = await checkFileExists(fileKey);
    if (!exists) {
      throw new ValidationError('File not found in storage');
    }

    // Process based on category
    let processedUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

    if (record.category === 'avatar') {
      processedUrl = await processAvatar(fileKey, userId);
    } else if (record.category === 'backdrop') {
      processedUrl = await processBackdrop(fileKey);
    }

    // Update record
    await prisma.uploadRecord.update({
      where: { id: record.id },
      data: {
        status: 'completed',
        processedUrl,
        completedAt: new Date(),
      },
    });

    return Response.json({
      url: processedUrl,
      fileKey,
    });
  })
);
```

---

## 5. Image Processing

```typescript
// src/lib/uploads/image-processing.ts
import sharp from 'sharp';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface ImageVariant {
  suffix: string;
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

const AVATAR_VARIANTS: ImageVariant[] = [
  { suffix: '-sm', width: 64, height: 64, quality: 80, format: 'webp' },
  { suffix: '-md', width: 128, height: 128, quality: 85, format: 'webp' },
  { suffix: '-lg', width: 256, height: 256, quality: 90, format: 'webp' },
];

const BACKDROP_VARIANTS: ImageVariant[] = [
  { suffix: '-thumb', width: 400, height: 225, quality: 75, format: 'webp' },
  { suffix: '-full', width: 1920, height: 1080, quality: 85, format: 'webp' },
];

async function processAvatar(
  fileKey: string,
  userId: string
): Promise<string> {
  // Download original from R2
  const original = await downloadFile(fileKey);

  // Strip EXIF data and validate
  const metadata = await sharp(original).metadata();

  if (!metadata.width || !metadata.height) {
    throw new ValidationError('Invalid image file');
  }

  // Generate variants
  const baseKey = fileKey.replace(/\.[^.]+$/, '');
  const variants: { key: string; url: string }[] = [];

  for (const variant of AVATAR_VARIANTS) {
    const processed = await sharp(original)
      .resize(variant.width, variant.height, {
        fit: 'cover',
        position: 'centre',
      })
      .removeAlpha()
      .toFormat(variant.format, { quality: variant.quality })
      .toBuffer();

    const variantKey = `${baseKey}${variant.suffix}.${variant.format}`;

    await uploadFile(variantKey, processed, `image/${variant.format}`);

    variants.push({
      key: variantKey,
      url: `${process.env.R2_PUBLIC_URL}/${variantKey}`,
    });
  }

  // Delete original (we keep only processed variants)
  await deleteFile(fileKey);

  // Return the medium variant as the default URL
  return variants.find((v) => v.key.includes('-md'))?.url ?? variants[0].url;
}

async function processBackdrop(fileKey: string): Promise<string> {
  const original = await downloadFile(fileKey);

  const baseKey = fileKey.replace(/\.[^.]+$/, '');
  let fullUrl = '';

  for (const variant of BACKDROP_VARIANTS) {
    const processed = await sharp(original)
      .resize(variant.width, variant.height, {
        fit: 'cover',
        withoutEnlargement: true,
      })
      .toFormat(variant.format, { quality: variant.quality })
      .toBuffer();

    const variantKey = `${baseKey}${variant.suffix}.${variant.format}`;
    await uploadFile(variantKey, processed, `image/${variant.format}`);

    if (variant.suffix === '-full') {
      fullUrl = `${process.env.R2_PUBLIC_URL}/${variantKey}`;
    }
  }

  await deleteFile(fileKey);
  return fullUrl;
}

async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(command);
  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

async function deleteFile(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

async function checkFileExists(key: string): Promise<boolean> {
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}
```

---

## 6. Client-Side Upload Component

```typescript
// src/lib/uploads/client.ts

interface UploadOptions {
  file: File;
  category: 'avatar' | 'backdrop' | 'attachment';
  onProgress?: (percent: number) => void;
}

export async function uploadFile(options: UploadOptions): Promise<string> {
  const { file, category, onProgress } = options;

  // Step 1: Get presigned URL
  const presignResponse = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      category,
    }),
  });

  if (!presignResponse.ok) {
    const error = await presignResponse.json();
    throw new Error(error.error?.message ?? 'Failed to get upload URL');
  }

  const { uploadUrl, fileKey } = await presignResponse.json();

  // Step 2: Upload directly to R2
  await uploadToR2(uploadUrl, file, onProgress);

  // Step 3: Notify completion
  const completeResponse = await fetch('/api/uploads/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileKey }),
  });

  if (!completeResponse.ok) {
    throw new Error('Upload processing failed');
  }

  const { url } = await completeResponse.json();
  return url;
}

async function uploadToR2(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload network error')));

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

---

## 7. Cleanup and Lifecycle

```typescript
// src/lib/uploads/cleanup.ts

// Clean up expired/orphaned uploads
export async function cleanupUploads(): Promise<{
  expired: number;
  orphaned: number;
}> {
  // Remove expired pending uploads
  const expired = await prisma.uploadRecord.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  });

  // Find orphaned files in R2 (no matching record)
  // Run periodically via scheduled job
  let orphaned = 0;

  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const listResult = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'attachment/',
      MaxKeys: 100,
    })
  );

  for (const obj of listResult.Contents ?? []) {
    const record = await prisma.uploadRecord.findFirst({
      where: { fileKey: obj.Key },
    });

    if (!record && obj.LastModified) {
      const ageMs = Date.now() - obj.LastModified.getTime();
      if (ageMs > 24 * 3600_000) {
        await deleteFile(obj.Key!);
        orphaned++;
      }
    }
  }

  return { expired: expired.count, orphaned };
}
```

---

## 8. Testing

```typescript
// __tests__/uploads/validation.test.ts
import { describe, it, expect } from 'vitest';

describe('File Validation', () => {
  it('should accept valid PNG by magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const result = validateFileType(pngHeader, 'image/png', 'avatar');
    expect(result.valid).toBe(true);
  });

  it('should reject mismatched magic bytes', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const result = validateFileType(jpegHeader, 'image/png', 'avatar');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match');
  });

  it('should reject SVG uploads', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">');
    const result = validateFileType(svg, 'image/svg+xml', 'avatar');
    expect(result.valid).toBe(false);
  });

  it('should reject files with embedded scripts', () => {
    const malicious = Buffer.from('<script>alert("xss")</script>');
    const result = validateFileType(malicious, 'image/png', 'avatar');
    expect(result.valid).toBe(false);
  });
});
```

---

## Summary

| Component | Implementation | Purpose |
|-----------|---------------|---------|
| Presigned URLs | S3-compatible (R2) | Direct client-to-storage uploads |
| Magic byte validation | Buffer header check | Prevent MIME spoofing |
| Image processing | Sharp | Resize, optimize, generate variants |
| Tier-based limits | Size per category/tier | Fair resource allocation |
| XSS prevention | Block SVG, script detection | Security |
| Lifecycle management | Scheduled cleanup | Remove orphaned files |

File uploads in Stone AI follow a presign-upload-process pattern that keeps the server lean while maintaining security through validation at every step.
