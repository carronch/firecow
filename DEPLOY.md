# Deployment & CMS Configuration Guide

## Cloudflare Pages + Keystatic Setup

To make the Content Management System (CMS) work on your live site, you need to connect your Cloudflare deployment to your GitHub repository via valid OAuth credentials.

### 1. Create a GitHub OAuth App
1.  Go to **[GitHub Developer Settings > OAuth Apps](https://github.com/settings/applications/new)**.
2.  Click **New OAuth App**.
3.  **Application Name**: `FireCow CMS` (or your preferred name).
4.  **Homepage URL**: Use your Cloudflare Pages URL (e.g., `https://firecow.pages.dev`).
5.  **Authorization Callback URL**: 
    ```
    https://<YOUR-SITE-URL>/api/keystatic/github/oauth/callback
    ```
    *(Replace `<YOUR-SITE-URL>` with your actual Cloudflare Pages domain)*.

### 2. Configure Cloudflare Environment Variables
1.  Go to your **Cloudflare Dashboard**.
2.  Navigate to **Pages** > **Your Project** > **Settings** > **Environment Variables**.
3.  Add the following variables using the credentials from the GitHub OAuth App you just created:
    - `KEYSTATIC_GITHUB_CLIENT_ID`
    - `KEYSTATIC_GITHUB_CLIENT_SECRET`
    - `KEYSTATIC_SECRET` (A random string for session encryption, e.g., generated with `openssl rand -hex 32`)

### 3. Redeploy
After saving the variables, you must **redeploy** your site for the changes to take effect. You can do this by:
- Pushing a new commit to your `main` branch.
- Or manually retry the latest deployment in the Cloudflare dashboard.

---

## Deploying a New Site (Spin-off)

When you create a new site using `pnpm new-site`, the code is ready for Cloudflare, but you must manually create the project in the Cloudflare Dashboard to connect it.

### Step-by-Step Guide

1.  **Create Project**:
    - Go to **Cloudflare Dashboard > Pages**.
    - Click **Create a project** > **Connect to Git**.
    - Select your repository (`firecow-bookings`).

2.  **Configure Build Settings**:
    - **Project Name**: e.g., `isla-tortuga`
    - **Production Branch**: `main`
    - **Framework Preset**: `None`
    - **Build command**: 
      ```bash
      npx turbo run build --filter=@firecow/<your-new-site-name>
      ```
      *(Example: `npx turbo run build --filter=@firecow/isla-tortuga-costa-rica`)*
    - **Build output directory**:
      ```bash
      apps/<your-new-site-name>/dist
      ```
      *(Example: `apps/isla-tortuga-costa-rica/dist`)*

3.  **Environment Variables**:
    - Add the same `KEYSTATIC_GITHUB_` variables if you want the CMS to work (you can reuse the same OAuth app if the domain matches, or create a new one).

### Local Development
To run the CMS locally:
1.  Run `pnpm dev`.
2.  Go to `http://localhost:4321/keystatic`.
3.  Since we are in `github` mode, changes will be committed directly to your repository!
