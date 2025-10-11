# LegalKaki Frontend

A people-friendly legal document comprehension system frontend built with Next.js 15, TypeScript, and Tailwind CSS.

## Environment Configuration

The frontend supports environment-based backend configuration for seamless development and production deployment.

### Development Mode

Set `DEV_MODE=true` to automatically use localhost backend (http://localhost:8000):

```bash
# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local and set:
DEV_MODE=true
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEV_MODE` | Enable development mode (uses localhost:8000) | `false` |
| `NEXT_PUBLIC_BACKEND_URL` | Manual backend URL override (overrides DEV_MODE) | - |
| `NEXT_PUBLIC_API_BASE_URL` | Production backend URL | `http://43.217.199.206:8000` |
| `NEXT_PUBLIC_API_TOKEN` | Backend authentication token | `ragflow-E1YWMxNmU4OTZkNTExZjBiNzUwMDI0Mm` |

### Backend URL Resolution Priority

1. **Manual Override**: `NEXT_PUBLIC_BACKEND_URL`
2. **Development Mode**: `localhost:8000` (when `DEV_MODE=true`)
3. **Production**: `NEXT_PUBLIC_API_BASE_URL` or default

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your settings
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Verify backend connection**:
   - Open browser console
   - Check for environment configuration logs
   - API calls will automatically point to localhost:8000 when `DEV_MODE=true`

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - React components
- `src/api/` - API client layer with environment configuration
- `src/lib/` - Utility functions and environment config
- `src/types/` - TypeScript type definitions

## API Integration

The frontend automatically switches between mock and real API based on:

- **Environment configuration** (DEV_MODE)
- **Backend connectivity** (automatic fallback to mock)
- **Endpoint availability** (graceful degradation)

### Environment-Based API Calls

```typescript
// API calls automatically use the correct backend URL
import { api } from '@/api/endpoints';

// When DEV_MODE=true: points to localhost:8000
// When DEV_MODE=false: points to production backend
const response = await api.collections.getCollections();
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
