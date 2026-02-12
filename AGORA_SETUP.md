# 🎯 AGORA SETUP GUIDE

## Getting Your Agora Credentials

Agora is required for the video calling feature. Follow these steps:

### Step 1: Create Agora Account

1. Visit https://console.agora.io/
2. Click "Sign Up" (top right)
3. Fill in your details:
   - Email
   - Password
   - Company (can be "Personal" or "Student Project")
4. Verify your email

### Step 2: Create a Project

1. After login, you'll see the Agora Console
2. Click "Create" or "New Project"
3. Fill in project details:
   - **Project Name**: `TeleHealth` (or any name)
   - **Use Case**: Select "Video Calling"
   - **Authentication**: Choose "Secured mode: APP ID + Token"
4. Click "Submit"

### Step 3: Get Your Credentials

1. Your project will appear in the dashboard
2. Click on the project name
3. You'll see two important values:

   **App ID**: A string like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   
   **App Certificate**: Click "Enable" if not enabled, then copy the certificate

### Step 4: Add to Environment Variables

Open your `.env` file and add:

```env
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
```

**Important**: 
- Replace `your_app_id_here` with your actual App ID
- Replace `your_app_certificate_here` with your actual App Certificate
- The App ID appears in both backend and frontend configs

### Step 5: Verify Setup

1. Restart your backend server
2. Try to join a video call
3. Check browser console for any Agora errors

---

## Free Tier Limits

Agora's free tier includes:
- ✅ 10,000 minutes per month
- ✅ Unlimited projects
- ✅ Full feature access
- ✅ No credit card required

This is more than enough for development and testing!

---

## Troubleshooting

### "Invalid App ID" Error
- Double-check you copied the entire App ID
- Ensure no extra spaces in `.env` file
- Restart the backend server after changing `.env`

### "Token Request Failed" Error
- Verify App Certificate is enabled
- Check that App Certificate is correctly copied
- Ensure backend is running and accessible

### "Camera/Microphone Access Denied"
- Check browser permissions
- Allow camera/microphone access when prompted
- Try in a different browser (Chrome recommended)

### Video Not Showing
- Ensure you're using HTTPS in production (or localhost for dev)
- Check if other participant has joined
- Verify appointment is within ±15 minutes of scheduled time

---

## Testing Video Calls

1. **Create two accounts**: One patient, one doctor
2. **Book appointment**: Patient books with doctor
3. **Wait for time**: Or modify appointment time to be now
4. **Join from both accounts**: Open in two different browsers/windows
5. **Test controls**: Mute, video toggle, end call

---

## Production Deployment

When deploying to production:

1. **Keep credentials secret**: Never commit to Git
2. **Use environment variables**: Set in hosting platform
3. **Enable HTTPS**: Required for camera/microphone access
4. **Test thoroughly**: Verify video works in production environment

---

## Alternative: Testing Without Agora

If you want to test the system without video calling:

1. Comment out video-related routes in backend
2. Hide "Join Call" buttons in frontend
3. Focus on other features (appointments, records, etc.)

However, **video calling is a core feature** of this telehealth system, so it's recommended to set up Agora properly.

---

## Need Help?

- Agora Documentation: https://docs.agora.io/
- Agora Support: https://www.agora.io/en/support/
- Video Tutorial: https://www.youtube.com/results?search_query=agora+react+setup

---

**Remember**: Keep your App Certificate secret! Never share it publicly or commit it to version control.
