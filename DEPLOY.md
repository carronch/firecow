# FireCow Team Guide: Content Editing & Deployment

This guide explains how to edit content for our websites (Isla Tortuga, etc.) and deploy those changes to production.

## 🚀 Workflow Overview

We use a **Local-First** workflow. You rarely edit content directly on the live website. Instead:
1.  **Run the site locally** on your computer.
2.  **Edit content** using the Keystatic Admin UI (`/keystatic`).
3.  **Save** changes (this updates files in your `src/content` folder).
4.  **Push** to GitHub to trigger an automatic deployment.

---

## 🛠️ Setup (First Time Only)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/carronch/firecow.git
    cd firecow
    ```

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Configure Secrets**:
    You need a `.env` file in the specific app folder you are working on (e.g., `apps/isla-tortuga-costa-rica/.env`).
    Ask the project lead for the `KEYSTATIC_GITHUB_CLIENT_ID` and `KEYSTATIC_GITHUB_CLIENT_SECRET`.

    **Create `apps/isla-tortuga-costa-rica/.env`**:
    ```ini
    KEYSTATIC_GITHUB_CLIENT_ID=...
    KEYSTATIC_GITHUB_CLIENT_SECRET=...
    KEYSTATIC_SECRET=...
    ```

---

## ✍️ How to Edit Content

### 1. Start the Local Server
Run the development server for the site you want to edit.

**For Isla Tortuga:**
```bash
pnpm --filter @firecow/isla-tortuga-costa-rica dev
```

**For Template/Main Site:**
```bash
pnpm --filter template dev
```

### 2. Open the Admin UI
Once the server is running (usually on `http://localhost:4321` or `4324`):
1.  Open your browser to: **`http://localhost:4324/keystatic`** (check your terminal for the exact port).
2.  Click **"Log in with GitHub"**.

### 3. Make Changes
*   use the UI to edit Tours, Upsells, FAQs, etc.
*   When you hit **Save**, it writes the changes directly to your hard drive in the `src/content` folder.

---

## 🚢 How to Deploy

Once you are happy with your changes (you can preview them on your local `localhost` URL):

1.  **Commit your changes**:
    ```bash
    git add .
    git commit -m "Updated tour prices and descriptions"
    ```

2.  **Push to Production**:
    ```bash
    git push origin main
    ```

**That's it!** Cloudflare Pages will detect the new commit and automatically build and deploy the updated site within 1-2 minutes.

---

## 🧘 Troubleshooting

*   **Login Failed locally?**
    *   Ensure your `.env` file exists in the app folder and has the correct Github credentials.
    *   Ensure you are running the app on `localhost` (127.0.0.1).

*   **Changes not showing on live site?**
    *   Did you `git push`?
    *   Check the [Cloudflare Dashboard](https://dash.cloudflare.com) to see if the build is still running or failed.
