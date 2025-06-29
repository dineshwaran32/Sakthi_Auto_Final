# Production Build Guide for Sakthi App

## Issues Fixed

The main issues that were causing OTP failures in production builds have been addressed:

### 1. Network Security Configuration
- **Problem**: HTTP connections were blocked by default in production builds
- **Solution**: Added network security configurations for both Android and iOS

### 2. Network Connectivity Detection
- **Problem**: No network connectivity validation before API calls
- **Solution**: Added NetInfo integration for network status checking

### 3. Better Error Handling
- **Problem**: Generic error messages made debugging difficult
- **Solution**: Added specific error handling for different network scenarios

## Build Steps

### 1. Install Dependencies
```bash
npm install
npm install @react-native-community/netinfo
```

### 2. Build for Production

#### Using EAS Build (Recommended)
```bash
# Install EAS CLI if not already installed
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

#### Using Expo Build (Legacy)
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

### 3. Test Network Connectivity

The app now includes a "Test Network Connection" button that appears only in production builds. This helps debug network issues.

## Configuration Files Updated

### 1. app.json
- Added `usesCleartextTraffic: true` for Android
- Added network security configuration for HTTP connections
- Added iOS App Transport Security exceptions

### 2. utils/api.js
- Added network connectivity checking
- Improved error handling with specific messages
- Added request/response logging for debugging

### 3. utils/networkConfig.js
- Environment-specific network configurations
- Platform-specific settings
- Debug utilities

### 4. utils/networkTest.js
- Network connectivity testing utilities
- API endpoint testing
- Comprehensive diagnostics

## Troubleshooting

### If OTP Still Fails:

1. **Check Network Configuration**
   - Ensure your server IP `118.91.235.74:80` is accessible
   - Verify the server allows HTTP connections

2. **Test Network Connectivity**
   - Use the "Test Network Connection" button in the app
   - Check console logs for detailed error messages

3. **Common Issues**:
   - **Firewall**: Ensure port 80 is open on your server
   - **CORS**: Server should allow requests from mobile apps
   - **SSL**: Consider upgrading to HTTPS for better security

### Debug Steps:

1. **Check Console Logs**
   ```javascript
   // Look for these log messages:
   🌐 Network Configuration: {...}
   📡 Network Status: {...}
   🚀 Making API request: {...}
   ✅ API Response Success: {...}
   🚨 API Error: {...}
   ```

2. **Test API Endpoints**
   ```bash
   # Test your API directly
   curl -X POST http://118.91.235.74:80/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"employeeNumber": "12345"}'
   ```

3. **Check Network Permissions**
   - Ensure the app has internet permission
   - Check if device firewall is blocking the app

## Environment Variables

You can customize the API URL by modifying `utils/networkConfig.js`:

```javascript
export const NETWORK_CONFIG = {
  production: {
    baseURL: 'http://118.91.235.74:80', // Change this to your server
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000,
  },
  // ...
};
```

## Security Considerations

1. **HTTP vs HTTPS**: The app currently uses HTTP. For production, consider:
   - Upgrading your server to HTTPS
   - Using a reverse proxy (nginx) with SSL termination
   - Using a CDN with SSL

2. **API Security**: Ensure your backend:
   - Validates all inputs
   - Implements rate limiting
   - Uses proper authentication

## Support

If you continue to experience issues:

1. Check the console logs for detailed error messages
2. Use the network test functionality in the app
3. Verify your server is accessible from mobile networks
4. Consider using a service like ngrok for testing

## Next Steps

1. **Monitor**: Watch for network errors in production
2. **Upgrade**: Consider moving to HTTPS
3. **Optimize**: Add retry logic for failed requests
4. **Analytics**: Add network performance monitoring 