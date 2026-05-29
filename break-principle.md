# CodePrincipleGuard Report

## Agent Summary
Reviewed the codebase for reserved word "status" usage in Next.js backend code, hardcoded URLs/secrets/constants, missing .env.example coverage, hardcoded business rules, and API calls that do not use environment-based base URLs.

## Findings

### Usage of reserved word "status" in Next.js backend
| File path | Line number | Broken principle | Explanation |
| --- | --- | --- | --- |
| `src/lib/api-helpers.ts` | `30, 42, 62, 87, 117, 118` | Usage of reserved word "status" in Next.js backend | `status` is used in backend response construction and parameters. |
| `src/app/api/dashboard/route.ts` | `13, 23, 182` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/orders/route.ts` | `9, 14, 22, 27` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/auth/logout/route.ts` | `9, 22` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/customers/[id]/route.ts` | `37, 66, 95, 108, 133, 140, 161, 173, 187` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses and update logic. |
| `src/app/api/categories/[id]/route.ts` | `31, 40, 69, 82, 99, 106, 127, 139, 153` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses and update logic. |
| `src/app/api/users/[id]/route.ts` | `18, 24, 33, 44, 53, 70, 76, 80, 87, 97, 108, 123, 140, 146, 157, 165, 181` | Usage of reserved word "status" in Next.js backend | `status` is used in request handling, data shapes, and API responses. |
| `src/app/api/auth/login/route.ts` | `25, 45, 63, 83, 114, 132` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/categories/route.ts` | `39, 69, 87, 92, 99` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/lib/security-config.ts` | `133, 141, 143, 145, 149` | Usage of reserved word "status" in Next.js backend | `status` is used in backend security status modeling. |
| `src/app/api/auth/me/route.ts` | `13, 21, 37` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/health/route.ts` | `15, 31, 35` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/customers/route.ts` | `80, 110, 134, 139, 146` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/lib/secure-cookies.ts` | `172, 175, 183, 189, 195` | Usage of reserved word "status" in Next.js backend | `status` is used in backend cookie security structures. |
| `src/app/api/users/route.ts` | `20, 33, 54, 60, 67, 71, 73, 74, 86, 103, 111, 119, 124` | Usage of reserved word "status" in Next.js backend | `status` is used in request handling, validation, and API responses. |
| `src/app/api/users/[id]/reset-password/route.ts` | `26, 35, 43, 63, 98, 104` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/lib/error-handler.ts` | `15, 23, 30, 38, 46, 54, 62` | Usage of reserved word "status" in Next.js backend | `status` is used in backend error responses. |
| `src/app/api/categories/import/route.ts` | `14, 24, 36, 44, 64, 137` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/security/health/route.ts` | `13, 15, 19, 34, 43, 52` | Usage of reserved word "status" in Next.js backend | `status` is used in response payloads and responses. |
| `src/app/api/sales/[id]/route.ts` | `52, 61, 66, 80, 89, 104, 111, 128, 135, 163, 197` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses and sales update context. |
| `src/app/api/sales/route.ts` | `89, 99, 175, 184, 193, 203, 270, 275` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/products/route.ts` | `54, 64, 140, 150, 162, 171, 204, 219, 252, 257` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/products/import/route.ts` | `15, 25, 37, 45, 65, 193` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/reports/sales/route.ts` | `13, 23, 223` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/products/[id]/route.ts` | `39, 48, 77, 90, 103, 136, 143, 164, 178, 192` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |
| `src/app/api/auth/mfa/status/route.ts` | `6, 13, 15, 16` | Usage of reserved word "status" in Next.js backend | `status` is used in response content and response metadata. |
| `src/app/api/search/consolidated/route.ts` | `10, 89` | Usage of reserved word "status" in Next.js backend | `status` is used in API responses. |

### Hardcoded URLs, secrets, tokens, or constants
| File path | Line number | Broken principle | Explanation |
| --- | --- | --- | --- |
| `scripts/test-security.js` | `6` | Hardcoded URLs, secrets, tokens, or constants | Base URL is hardcoded to `http://localhost:3002`. |
| `scripts/security-test-suite.js` | `6` | Hardcoded URLs, secrets, tokens, or constants | Default base URL is hardcoded to `http://localhost:3000`. |
| `deploy-security.ps1` | `122` | Hardcoded URLs, secrets, tokens, or constants | Health check URL is hardcoded to `http://localhost:3000/api/security/health`. |
| `server.js` | `33` | Hardcoded URLs, secrets, tokens, or constants | Logs a hardcoded `http://` URL string. |
| `src/middleware.ts` | `14` | Hardcoded URLs, secrets, tokens, or constants | Content Security Policy includes hardcoded `https://vercel.live`. |
| `src/lib/production-security.ts` | `167` | Hardcoded URLs, secrets, tokens, or constants | Content Security Policy includes hardcoded `https://vercel.live`. |
| `src/lib/env.ts` | `46` | Hardcoded URLs, secrets, tokens, or constants | Hardcoded secret placeholder `your-super-secret-jwt-key-change-in-production`. |
| `src/lib/security.ts` | `5-33` | Hardcoded URLs, secrets, tokens, or constants | Security config values are hardcoded (JWT settings, rate limits, password policy, validation patterns). |

### Missing environment variables in .env.example
| File path | Line number | Broken principle | Explanation |
| --- | --- | --- | --- |
| `.env.example` | `N/A (file not found)` | Missing environment variables in .env.example | No `.env.example` file exists to document required environment variables. |

### Business logic hardcoded instead of data-driven
| File path | Line number | Broken principle | Explanation |
| --- | --- | --- | --- |
| `src/types/user.ts` | `1, 4` | Business logic hardcoded instead of data-driven | User roles and statuses are hardcoded in source. |
| `src/app/api/users/route.ts` | `54, 71` | Business logic hardcoded instead of data-driven | User role/status defaults and validation rely on hardcoded values. |
| `src/lib/security.ts` | `62-65` | Business logic hardcoded instead of data-driven | Common password list is hardcoded in code. |

### Next.js API calls not using environment variables
| File path | Line number | Broken principle | Explanation |
| --- | --- | --- | --- |
| `src/actions/categories.ts` | `6, 10, 14, 18, 22, 29` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/customers.ts` | `19, 23, 40, 44, 48` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/auth.ts` | `10, 29, 43` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/mfa.ts` | `5, 9, 13, 17, 21` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/dashboard.ts` | `5` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/reports.ts` | `19` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/products.ts` | `9, 14, 22, 26, 31, 35, 42` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/search.ts` | `6` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/users.ts` | `16, 20, 25` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/sales.ts` | `13, 18, 23, 28, 32, 36, 43` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
| `src/actions/security.ts` | `5` | Next.js API calls not using environment variables | API calls use hardcoded relative `/api/...` paths. |
