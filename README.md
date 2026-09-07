# Gym Management System

A multi-tenant gym management platform. One codebase, many gyms — each gym ("Company")
gets its own logo/branding, members, staff, membership plans, attendance, and revenue,
fully isolated inside a shared MongoDB database via a `companyId` field on every record.

```
gym-management/
├── backend/     Node.js + Express + MongoDB (Mongoose) REST API
└── frontend/    React (Vite) + Tailwind, Apple-inspired design system
```

## 1. Prerequisites

- Node.js 18+
- A free MongoDB Atlas account (the M0 free-tier cluster **does not** sleep from
  inactivity — unlike some other free database hosts — so this is the right choice)

## 2. Set up MongoDB Atlas (free, ~5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **M0 (Free)** cluster — any cloud/region is fine.
3. Under **Database Access**, create a database user with a username/password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) for development.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name before the `?`, e.g. `.../gymdb?retryWrites=true...`

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: paste your MONGO_URI, set a strong JWT_SECRET
npm run seed:superadmin   # creates the platform superadmin (edit .env first for custom credentials)
npm run dev                # starts on http://localhost:5000
```

The seed script creates **one** superadmin account (`SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`
from `.env`). Log in as this user to reach **Company Master** and onboard gyms — or skip this
and just use the public **"Create an account"** flow on the login screen, which self-registers
a brand-new gym + its first owner account in one step.

## 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api (default is already correct for local dev)
npm run dev                 # starts on http://localhost:5173
```

## 5. First run walkthrough

1. Open `http://localhost:5173/login`, click **"Create an account"**, fill in your gym's
   name, a short company code, your name/email/password. This creates the Company + your
   `owner` login in one step and drops you straight into the dashboard.
2. Go to **Membership Plans** → create a plan (e.g. "Monthly Unlimited", ₹1500, 30 days).
3. Go to **Register Member** → fill the form, optionally attach the plan + payment.
4. Go to **Attendance** → search the member you just created → mark them present.
5. Go to **Reports** → see the revenue chart populate, export a PDF.
6. Go to **Settings** → paste a logo URL and pick a brand color — the sidebar/buttons across
   the whole dashboard update to match, instantly, for your gym only.
7. Go to **Staff & Users** → add a manager or trainer login for your team.

To see the **Company Master** (multi-tenant admin view), log out and log back in as the
superadmin account you seeded in step 3 of backend setup.

## 6. Roles

| Role | Scope | Can do |
|---|---|---|
| `superadmin` | Platform-wide | Onboard/activate/deactivate gyms in Company Master |
| `owner` | One gym | Everything within their gym: members, plans, attendance, reports, staff, branding |
| `manager` | One gym | Members, attendance, plans, reports (no staff management) |
| `trainer` | One gym | Members (read), attendance marking |

## 7. What's implemented vs. what to extend next

**Implemented (working end-to-end):**
- Multi-tenant auth (JWT), self-serve gym signup, role-based access control
- Company Master (superadmin) with dynamic per-gym branding (logo, brand color, tagline)
- Dynamic, validated member registration form
- Dynamic membership plan builder (owner-defined plans, not hardcoded)
- Attendance marking via search-and-tap dashboard flow, daily roster
- Member report card (profile, payment history, attendance) with PDF export
- Revenue report with date filtering, chart, and PDF export
- Staff/User management table per gym

**Good next steps** (structure is ready, not yet built):
- Photo upload for member/company logo (currently URL-based; wire up S3/Cloudinary via `multer`, already a backend dependency)
- Email/SMS reminders for expiring memberships
- QR-code / kiosk check-in (the `Attendance.source` field already supports `'qr'` and `'kiosk'`)
- Multi-branch support per company
- Refund/partial-payment workflows

## 8. Deploying for free

- **Backend**: Render.com or Railway.app free tier (Node web service), point `MONGO_URI` at Atlas.
- **Frontend**: Vercel or Netlify free tier — set `VITE_API_URL` to your deployed backend's `/api` URL.
- Update `CLIENT_URL` in the backend `.env` to your deployed frontend URL (for CORS).
