# How to Update Backend and Frontend Servers

## Overview
This guide shows how to deploy the password hashing security update to your production servers.

## Important Notes
- **Backend MUST be updated** - Contains the password hashing changes
- **Frontend does NOT need changes** - No frontend code was modified, it just calls the API
- **No downtime required** - Existing users can still login during deployment

---

## Step 1: Update Backend (REQUIRED)

The backend needs to be redeployed to Cloud Run with the updated password hashing code.

### Option A: Using PowerShell Script (Recommended)

1. **Open PowerShell** in the project root directory

2. **Run the deployment script:**
   ```powershell
   .\deploy-backend.ps1
   ```

3. **Wait for deployment to complete** - This will:
   - Build a new Docker image with updated `requirements.txt` (includes werkzeug)
   - Build with updated `auth.py` (password hashing code)
   - Deploy to Cloud Run
   - Show you the service URL when done

### Option B: Manual Deployment

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Build and deploy:**
   ```powershell
   gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
   
   gcloud run deploy smrtvocab-api `
     --image gcr.io/smrtvocab/smrtvocab-api `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated `
     --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" `
     --project smrtvocab `
     --memory 512Mi `
     --cpu 1 `
     --timeout 300 `
     --max-instances 10
   ```

3. **Return to project root:**
   ```powershell
   cd ..
   ```

### Verify Backend Deployment

After deployment, test that the backend is working:

1. **Check the service URL** (shown at end of deployment)
2. **Test an endpoint:**
   ```powershell
   # Replace YOUR-SERVICE-URL with your actual URL
   curl https://YOUR-SERVICE-URL/api/settings/get
   ```

---

## Step 2: Update Frontend (OPTIONAL)

**Note:** The frontend does NOT need to be updated since no frontend code changed. However, if you want to ensure everything is in sync, you can redeploy:

### Using PowerShell Script

```powershell
.\deploy-frontend.ps1
```

### Manual Deployment

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## What Happens After Deployment

### For New Users
- All new registrations will automatically use password hashing
- Passwords stored securely in hashed format

### For Existing Users
- **No disruption** - Users can login normally
- **Automatic migration** - When existing users login with their plain text password:
  1. System verifies the password (backward compatible)
  2. System automatically hashes the password
  3. Password is updated in the database
  4. Next login will use the hashed password

### Testing the Update

1. **Test new registration:**
   - Register a new account
   - Check that password is hashed (starts with `pbkdf2:` in CSV)

2. **Test existing user login:**
   - Login with an existing account
   - Should work normally
   - Password will be automatically hashed

3. **Test password verification:**
   - Try incorrect password - should be rejected
   - Try correct password - should work

---

## Troubleshooting

### Backend Deployment Fails

**Error: "gcloud not found"**
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Run: `gcloud auth login`

**Error: "Docker not running"**
- Start Docker Desktop

**Error: "Permission denied"**
- Run: `gcloud auth login`
- Verify project: `gcloud config set project smrtvocab`

**Error: "Build failed"**
- Check that `backend/requirements.txt` includes `werkzeug==3.0.1`
- Check that `backend/api/auth.py` has the password hashing imports

### Backend Not Responding After Deployment

1. **Check Cloud Run service status:**
   ```powershell
   gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab
   ```

2. **Check logs:**
   ```powershell
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 50
   ```

3. **Test endpoint directly:**
   - Visit: `https://YOUR-SERVICE-URL/api/settings/get`
   - Should return JSON response

### Users Can't Login After Update

1. **Check backend logs** for errors
2. **Verify password hashing is working:**
   - Check `AccountInformation.csv` (if accessible)
   - New passwords should start with `pbkdf2:`
3. **Test with a new registration** to verify hashing works

---

## Quick Reference

### Backend Deployment (Required)
```powershell
.\deploy-backend.ps1
```

### Frontend Deployment (Optional)
```powershell
.\deploy-frontend.ps1
```

### Check Backend Status
```powershell
gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab
```

### View Backend Logs
```powershell
gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 50
```

---

## Files Changed (For Reference)

- ✅ `backend/requirements.txt` - Added werkzeug==3.0.1
- ✅ `backend/api/auth.py` - Implemented password hashing
- ❌ Frontend - No changes needed

---

## Deployment Checklist

Before deploying:
- [ ] Code changes committed to repository
- [ ] Google Cloud SDK authenticated (`gcloud auth login`)
- [ ] Docker Desktop running
- [ ] Project set correctly (`gcloud config set project smrtvocab`)

After deploying:
- [ ] Backend deployment successful
- [ ] Service URL obtained
- [ ] Test endpoint accessible
- [ ] Test new user registration
- [ ] Test existing user login
- [ ] Verify password hashing in logs/database

---

## Support

If you encounter issues:
1. Check `DEPLOYMENT-TROUBLESHOOTING.md`
2. Review backend logs
3. Verify all prerequisites are met
4. Check that werkzeug is in requirements.txt

