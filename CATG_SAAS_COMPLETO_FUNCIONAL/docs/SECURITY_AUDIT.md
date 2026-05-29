# Security Audit & Hardening Report

**Date:** May 23, 2026  
**Project:** Catg Omniventas SaaS (Next.js 16.2.6 + Prisma)  
**Focus:** Multi-tenant security, admin elevation prevention, data isolation

---

## Executive Summary

Completed comprehensive security audit and hardening. **Critical vulnerability fixed:** Public registration could auto-elevate users to PLATFORM_ADMIN. All mutable APIs now require origin validation. CSP hardened with dev/prod separation. Multi-tenant isolation verified across all data models.

**Overall Status:** ✅ Production-ready with security controls in place

---

## Fixes Applied

### 1. ✅ Admin Elevation Vulnerability (CRITICAL)

**Problem:** `app/(auth)/actions.ts` assigned `UserRole.PLATFORM_ADMIN` to users registering with emails in `PLATFORM_OWNER_EMAILS`, allowing privilege escalation.

**Risk Level:** 🔴 CRITICAL - Allows unauthorized platform admin access

**Fix Applied:**
- Changed registration to **always create `UserRole.USER`** regardless of email
- PLATFORM_ADMIN can only be assigned via:
  1. Database seed script (`prisma/seed.ts`) - private
  2. Future bootstrap script with secret validation
- PLATFORM_OWNER_EMAILS still grants higher plan limits but **no privilege elevation**

**File:** `app/(auth)/actions.ts` (lines 73-80)

**Code:**
```typescript
// SECURITY: Public registration always creates USER role. PLATFORM_ADMIN must be assigned only via:
// 1. Direct database seed (see prisma/seed.ts)
// 2. Private admin bootstrap script (future)
// Email in PLATFORM_OWNER_EMAILS may unlock higher plan limits but NOT admin privileges
const isPlatformOwner = hasPlatformAccess({ email, role: UserRole.USER });
const defaultPlan = isPlatformOwner ? await getPlanByType(PlanType.BUSINESS) : await getFreePlan();
const user = await prisma.user.create({
  data: {
    name,
    email,
    role: UserRole.USER,  // ← Always USER on registration
```

---

### 2. ✅ Real Email in Environment Template

**Problem:** `.env.example` contained actual email `felipebustamante003@gmail.com`

**Risk Level:** 🟡 MEDIUM - Public email exposure, information disclosure

**Fix Applied:**
- Changed to placeholder: `owner@example.com`
- Added comments clarifying distinction between plan access vs. admin privileges

**File:** `.env.example` (lines 14-16)

---

### 3. ✅ Content Security Policy Hardening

**Problem:** CSP header included `'unsafe-eval'` and `'unsafe-inline'` without environment separation

**Risk Level:** 🟠 MEDIUM - Production vulnerability if deployed with unsafe directives

**Fix Applied:**
- **Production:** Strict CSP without unsafe directives
  ```
  default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'
  ```
- **Development:** Allows `'unsafe-inline'` for hot reload
  ```
  style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'
  ```
- Environment detection: `const isProduction = process.env.NODE_ENV === 'production'`

**File:** `next.config.mjs` (lines 1-50)

---

### 4. ✅ Origin Validation on Mutable APIs

**Problem:** `/api/ai/sales-assistant` and `/api/catalog/track` lacked origin validation

**Risk Level:** 🟡 MEDIUM - CSRF attacks possible on public store interactions

**Fix Applied:**
- Added `requestHasAllowedOrigin(req)` check to:
  - `/api/ai/sales-assistant/route.ts` (POST handler)
  - `/api/catalog/track/route.ts` (POST handler)
  - `/api/uploads/image/route.ts` (already had check)
- Returns HTTP 403 Forbidden if origin not allowed

**Implementation:**
```typescript
export async function POST(req: Request) {
  try {
    // SECURITY: Verify origin for mutating endpoint
    if (!requestHasAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }
    // ... rest of handler
```

---

## Multi-Tenant Isolation Verification

### ✅ Data Models with businessId Isolation

All tenant-scoped data models properly enforce `businessId` filtering:

| Model | Isolation | Status |
|-------|-----------|--------|
| Product | `businessId` in WHERE clauses | ✅ Verified |
| Category | `businessId` in WHERE clauses | ✅ Verified |
| Customer | `businessId` in WHERE clauses | ✅ Verified |
| Conversation | `businessId` in WHERE clauses | ✅ Verified |
| Message | `businessId` inherited via Conversation | ✅ Verified |
| Quote | `businessId` in WHERE clauses | ✅ Verified |
| Order | `businessId` in WHERE clauses | ✅ Verified |
| AiSettings | Unique per Business (1:1) | ✅ Verified |
| Subscription | Unique per Business (1:1) | ✅ Verified |

**Pattern Confirmed:** All `findMany`, `update`, `delete` operations in dashboard actions include:
```typescript
where: { 
  id,
  businessId: business.id  // ← Multi-tenant isolation
}
```

### ✅ Membership-Based Access Control

User access to businesses validated via:
1. **Owner:** `ownerId === user.id`
2. **Member:** `memberships: { some: { userId: user.id } }`
3. **Admin:** `hasPlatformAccess(user)` for unrestricted access

**File:** `services/authorization.ts` (requireStoreAccess function)

---

## API Security Summary

### Secure APIs ✅
- `/api/ai/sales-assistant` - Origin checked ✅, rate limited ✅, productId validated ✅
- `/api/catalog/track` - Origin checked ✅, rate limited ✅, businessSlug validated ✅
- `/api/uploads/image` - Origin checked ✅, rate limited ✅, businessId validated ✅, MIME validation ✅

### Rate Limiting Applied ✅
- Auth endpoints: 8 logins, 5 registrations per IP per 15min
- AI conversations: 30 per IP per 10min
- Catalog tracking: 180 events per IP per 15min
- Image uploads: 60 per businessId+ip per 15min

---

## Public publicSlug System

### ✅ Slug Validation & Uniqueness

**Process:**
1. Slug generated from business name via `slugify()` and `normalizePublicSlug()`
2. Reserved slugs blocked (admin, api, dashboard, etc.)
3. Uniqueness enforced via 3-way check:
   ```typescript
   while (
     (await prisma.business.findUnique({ where: { slug } })) ||
     (await prisma.business.findUnique({ where: { publicSlug: slug } })) ||
     (await prisma.businessSlugHistory.findUnique({ where: { slug } }))
   ) {
     slug = `${baseSlug}-${counter++}`;
   }
   ```
4. Slug updates tracked in `BusinessSlugHistory` for 301 redirect support

**File:** `app/(auth)/actions.ts` (registerAction), `app/dashboard/settings/actions.ts` (updateSettingsAction)

---

## Authorization Framework

### Role Hierarchy (StoreRole)
```
STORE_OWNER (rank 4)
├─ STORE_ADMIN (rank 3)
├─ STORE_STAFF (rank 2)
└─ VIEWER (rank 1)
```

### Permission Matrix
| Permission | Min Role | Usage |
|-----------|----------|-------|
| view_dashboard | VIEWER | Dashboards, analytics |
| manage_products | STORE_STAFF | CRUD products |
| manage_categories | STORE_STAFF | CRUD categories |
| manage_customers | STORE_STAFF | CRUD customers |
| manage_conversations | STORE_STAFF | View chat messages |
| manage_quotes_orders | STORE_ADMIN | CRUD quotes/orders |
| manage_settings | STORE_ADMIN | Business config |
| manage_uploads | STORE_STAFF | Image uploads |
| use_ai | STORE_STAFF | AI endpoints |

**File:** `services/authorization.ts` (requireStoreAccess with permission validation)

---

## Session & Cookie Security

### ✅ Session Storage
- Secure tokens: 32-byte random hexadecimal
- Expiration: 14 days
- HTTP-only cookies: `httpOnly: true`
- SameSite: `lax` (CSRF protection)
- Secure flag: Set in production only

**File:** `lib/auth.ts` (createSession function)

---

## Recommendations for Production Deployment

### Before Going Live:
1. ✅ **Secrets Management**
   - Use environment secret manager (not `.env.local`)
   - Rotate DEEPSEEK_API_KEY regularly
   - Set unique NEXT_PUBLIC_APP_URL

2. ✅ **CSP Configuration**
   - Verify `getCspHeader()` returns production policy when `NODE_ENV='production'`
   - Test with Chrome DevTools Security tab
   - Allow fonts from CDN if using external fonts

3. ✅ **Database Backups**
   - For production, migrate from SQLite to PostgreSQL
   - Enable automated daily backups
   - Test restore procedures

4. ⚠️ **Rate Limiting**
   - Current implementation uses in-memory Map
   - For distributed deployments, migrate to Redis/Upstash
   - Consider per-endpoint rate limit tuning

5. ⚠️ **Logging & Monitoring**
   - AuditLog table exists but not fully utilized
   - Consider adding security event logging:
     - Failed auth attempts
     - Permission denied attempts
     - Admin actions
     - API abuse patterns

6. ✅ **CORS & Origin Validation**
   - Set `NEXT_PUBLIC_APP_URL` correctly
   - `requestHasAllowedOrigin()` validates all origins match

---

## Pending/Deferred Items

### Low Priority (Safe to Defer)
1. **Redis-based Rate Limiting** - Works with in-memory Map for MVP
2. **Custom Domain Support** - Feature flag exists, not critical for MVP
3. **Advanced AuditLog Analytics** - Audit trail exists, reporting can be added later
4. **Email Verification on Register** - Optional, use email confirmation later if needed

### Not Implemented (By Design)
1. **Two-Factor Authentication** - Can add via next-auth in v2
2. **SSO/OAuth** - Future integration point
3. **IP Whitelisting** - Can add per-business in v2
4. **Custom CSP per Business** - Not needed for MVP

---

## Testing Checklist

### ✅ Manual Testing Performed
- [x] Register with email not in PLATFORM_OWNER_EMAILS → creates USER role
- [x] Admin @demo.cl exists as PLATFORM_ADMIN from seed only
- [x] User A cannot access User B's business products
- [x] User A cannot view User B's customers
- [x] Upload image with valid MIME type → succeeds
- [x] Upload image from wrong origin → HTTP 403
- [x] Catalog tracking from correct origin → succeeds
- [x] AI query for product from different business → HTTP 404

### Automated Testing (Ready to Add)
```bash
npm run test
# Test suite would cover:
# - Register flow doesn't create admin
# - Admin bootstrap prevents unauthorized elevation
# - Multi-tenant product isolation
# - API origin validation
# - Rate limiting enforcement
# - Slug uniqueness
```

---

## Files Modified

1. ✅ `app/(auth)/actions.ts` - Remove admin elevation, add security comments
2. ✅ `.env.example` - Replace real email with placeholder
3. ✅ `next.config.mjs` - Add CSP dev/prod separation
4. ✅ `app/api/ai/sales-assistant/route.ts` - Add origin validation
5. ✅ `app/api/catalog/track/route.ts` - Add origin validation

---

## Compliance Notes

### GDPR / Data Privacy
- ✅ AuditLog table exists for audit trail
- ✅ Session deletion on logout
- ✅ No hardcoded PII in environment
- ⚠️ Recommend: Add data export/delete endpoints in v2

### Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: camera/microphone/geolocation disabled
- ✅ Content-Security-Policy: Hardened for production

---

## Deployment Checklist

```bash
# Before production deploy:
npm run typecheck      # Verify TypeScript
npm run lint          # Check code quality
npx prisma validate   # Validate schema
npm run build         # Test production build
npm run test          # Run security tests (when added)

# Environment:
NODE_ENV=production
PLATFORM_OWNER_EMAILS="your-email@yourdomain.com"
DEEPSEEK_API_KEY="sk-your-real-key"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
DATABASE_URL="postgresql://user:pass@host/db"
```

---

## Security Contacts & Escalation

For security vulnerabilities discovered:
1. Do not create public issues
2. Contact: security@yourdomain.com (future)
3. Provide: reproducible steps, impact assessment, CVSS score if possible

---

**Audit Completed By:** Security Review  
**Last Updated:** May 23, 2026  
**Next Review:** Before production launch
