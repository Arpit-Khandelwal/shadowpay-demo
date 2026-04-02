# 🛠️ Rename Guide: Dark Payroll

I've renamed the local project configuration to `dark-payroll`.
To complete the rename for your public links, follow these steps:

## 1. Rename GitHub Repository

Run these commands in your terminal:

```bash
# 1. Rename the remote repository using GitHub CLI (gh)
gh repo rename dark-payroll --confirm

# 2. Verify the remote URL has updated
git remote -v
```

*Alternative (Web UI):*
1. Go to your repo Settings > General.
2. Change "Repository name" to `dark-payroll`.
3. Click "Rename".

## 2. Rename Vercel Project

Run these commands:

```bash
# 1. Link the local project to the new Vercel project name
vercel link

# (Follow the prompts: select your scope, then link to existing project? NO. Create a new one? YES -> name it 'dark-payroll')
```

*Alternative (Web UI):*
1. Go to Vercel Dashboard > Select Project.
2. Settings > General.
3. Change "Project Name" to `dark-payroll`.
4. The deployment URL will update to `https://dark-payroll.vercel.app` (if available).

## 3. Update Vercel Build Settings (Important!)

Since we changed the package name, ensure Vercel's build settings are still correct (usually defaults are fine).

1. Go to Vercel > Settings > Build & Development.
2. Ensure "Framework Preset" is Next.js.
3. Redeploy to make sure the name change propagates:
   ```bash
   vercel --prod
   ```
