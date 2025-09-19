# Multi-Tenant OneDrive Integration Setup Guide

## 🎯 **Overview**

This guide will help you set up **multi-tenant OneDrive integration** for the BA Agent, allowing each user to connect their own OneDrive account and access their personal documents.

## ✅ **What This Achieves**

- **Multi-User Support**: Each user connects their own OneDrive account
- **Personal Access**: Users only see their own OneDrive files
- **Secure Authentication**: OAuth 2.0 with Microsoft Identity Platform
- **Cross-Organization**: Works with any Microsoft 365 organization

## 🔧 **Step-by-Step Setup**

### Step 1: Create Multi-Tenant Azure App Registration

1. **Go to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create App Registration**
   - Go to **Azure Active Directory** → **App registrations**
   - Click **New registration**

3. **Configure App Details**
   - **Name**: `BA Agent OneDrive Integration`
   - **Supported account types**: **Accounts in any organizational directory (Any Azure AD directory - Multitenant)**
   - **Redirect URI**: 
     - **Type**: Web
     - **URI**: `http://localhost:3000/auth/callback`
   - Click **Register**

### Step 2: Configure API Permissions

1. **Go to API Permissions**
   - In your app, click **API permissions**
   - Click **Add a permission**

2. **Select Microsoft Graph**
   - Choose **Microsoft Graph**
   - Select **Delegated permissions**

3. **Add Required Permissions**
   - `Files.Read.All` - Read all files that user can access
   - `Files.ReadWrite.All` - Read and write all files that user can access
   - `User.Read` - Sign in and read user profile

4. **Grant Admin Consent**
   - Click **Grant admin consent for [Your Organization]**
   - Confirm the permissions

### Step 3: Get Application Credentials

1. **Copy Client ID**
   - In **Overview**, copy the **Application (client) ID**

2. **Configure Redirect URIs**
   - Go to **Authentication**
   - Add these redirect URIs:
     - `http://localhost:3000/auth/callback` (Development)
     - `https://yourdomain.com/auth/callback` (Production)

3. **Enable Implicit Grant** (if needed)
   - In **Authentication**, check **Access tokens** and **ID tokens**

### Step 4: Update Environment Variables

Add these to your `.env` file:

```bash
# Multi-Tenant OneDrive Integration
ONEDRIVE_CLIENT_ID=your_multi_tenant_client_id_here
ONEDRIVE_REDIRECT_URI=http://localhost:3000/auth/callback
ONEDRIVE_AUTHORITY=https://login.microsoftonline.com/common
```

**Replace** `your_multi_tenant_client_id_here` with the Client ID from Step 3.

## 🔄 **How It Works**

### 1. **User Authentication Flow**
```
User clicks "Select from OneDrive" 
→ Redirected to Microsoft login 
→ User signs in with their Microsoft account 
→ Microsoft redirects back with auth code 
→ BA Agent exchanges code for access token 
→ User can now access their OneDrive files
```

### 2. **Multi-Tenant Benefits**
- **No Organization Restriction**: Works with any Microsoft 365 organization
- **User-Specific Access**: Each user sees only their own files
- **Automatic Token Management**: Handles token refresh automatically
- **Secure**: Uses OAuth 2.0 standard

### 3. **Token Storage**
- Tokens are stored per user in memory
- Automatically refreshed when expired
- Secure and isolated per user session

## 🧪 **Testing the Integration**

### 1. **Start the Backend**
```bash
cd backend
python main.py
```

### 2. **Start the Frontend**
```bash
cd frontend
npm start
```

### 3. **Test OneDrive Connection**
1. Go to **Upload** section
2. Look for OneDrive integration box
3. Status should show "Not Connected"
4. Click "Select from OneDrive"
5. Click "Connect OneDrive"
6. Sign in with your Microsoft account
7. Grant permissions
8. Return to BA Agent
9. Status should show "Connected"

## 🔒 **Security Features**

### **OAuth 2.0 Security**
- **Authorization Code Flow**: Most secure OAuth flow
- **State Parameter**: Prevents CSRF attacks
- **Scope Limitation**: Only requested permissions granted
- **Token Expiration**: Automatic token refresh

### **Data Isolation**
- **User-Specific Tokens**: Each user has separate access
- **No Cross-User Access**: Users cannot see others' files
- **Secure Storage**: Tokens stored in memory only

## 🚀 **Production Deployment**

### **Update Redirect URIs**
1. Go to Azure App Registration
2. Add production redirect URI:
   - `https://yourdomain.com/auth/callback`

### **Update Environment Variables**
```bash
ONEDRIVE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

### **HTTPS Required**
- Production requires HTTPS
- Update frontend to use HTTPS URLs
- Ensure proper SSL certificates

## 🐛 **Troubleshooting**

### **Common Issues**

#### 1. **"OneDrive Not Configured"**
- Check `ONEDRIVE_CLIENT_ID` is set
- Verify app registration exists
- Check Azure app permissions

#### 2. **"Authentication Failed"**
- Verify redirect URI matches exactly
- Check app registration is multi-tenant
- Ensure admin consent granted

#### 3. **"Files Not Loading"**
- Check user has connected OneDrive
- Verify token hasn't expired
- Check Microsoft Graph API permissions

#### 4. **Redirect URI Mismatch**
- Ensure redirect URI in Azure matches exactly
- Check for trailing slashes
- Verify protocol (http vs https)

### **Debug Steps**
1. **Check Browser Console** for error messages
2. **Verify Environment Variables** are loaded
3. **Check Azure App Registration** configuration
4. **Test with Different Microsoft Account**
5. **Check Network Tab** for API calls

## 📋 **Checklist**

- [ ] Multi-tenant app registration created
- [ ] API permissions configured (Files.Read.All, User.Read)
- [ ] Admin consent granted
- [ ] Redirect URIs configured
- [ ] Environment variables updated
- [ ] Backend restarted
- [ ] Frontend restarted
- [ ] Test connection with Microsoft account
- [ ] Verify file browsing works
- [ ] Test file download functionality

## 🔗 **Useful Links**

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API Reference](https://docs.microsoft.com/en-us/graph/api/overview)
- [OAuth 2.0 Authorization Code Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

## 🎉 **Success Indicators**

When everything is working correctly:
- ✅ OneDrive status shows "Connected" (green)
- ✅ Users can browse their OneDrive files
- ✅ Files can be selected and processed
- ✅ Each user sees only their own files
- ✅ No authentication errors in console

---

**Congratulations!** You now have a fully functional multi-tenant OneDrive integration that allows each user to access their own OneDrive account securely. 🚀
