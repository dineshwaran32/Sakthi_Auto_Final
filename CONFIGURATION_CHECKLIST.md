# Configuration Checklist for Production Build

## ✅ **Added Configurations:**

### 1. **Android Permissions** (app.json)
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE", 
  "android.permission.ACCESS_WIFI_STATE"
]
```

### 2. **Network Security Config** (app.json)
```json
"usesCleartextTraffic": true,
"networkSecurityConfig": {
  "domain-config": [
    {
      "domain": "118.91.235.74",
      "cleartextTrafficPermitted": true
    }
  ]
}
```

### 3. **iOS App Transport Security** (app.json)
```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": true,
  "NSExceptionDomains": {
    "118.91.235.74": {
      "NSExceptionAllowsInsecureHTTPLoads": true,
      "NSExceptionMinimumTLSVersion": "1.0",
      "NSExceptionRequiresForwardSecrecy": false
    }
  }
}
```

### 4. **NetInfo Plugin Configuration** (app.json)
```json
"plugins": [
  [
    "@react-native-community/netinfo",
    {
      "android": {
        "usesCleartextTraffic": true
      }
    }
  ]
]
```

### 5. **EAS Build Configuration** (eas.json)
- Development: APK build
- Preview: APK build with release
- Production: AAB build with release

### 6. **Network Security XML** (android/app/src/main/res/xml/network_security_config.xml)
- Allows cleartext traffic for your server domain
- Configures trust anchors

### 7. **Metro Configuration** (metro.config.js)
- Network request support
- Server configuration
- Transformer settings

### 8. **Babel Configuration** (babel.config.js)
- Production console removal
- Reanimated plugin support

## 🔧 **Build Commands:**

### Development Build:
```bash
eas build --platform android --profile development
```

### Preview Build:
```bash
eas build --platform android --profile preview
```

### Production Build:
```bash
eas build --platform android --profile production
```

## 🧪 **Testing Steps:**

1. **Test Network Connectivity**
   - Use the "Test Network Connection" button in production builds
   - Check console logs for network status

2. **Test OTP Functionality**
   - Try sending OTP with demo credentials
   - Monitor network requests in console

3. **Test API Endpoints**
   - Health check: `/api/health`
   - OTP send: `/api/auth/send-otp`
   - OTP verify: `/api/auth/verify-otp`

## 📱 **Platform-Specific Notes:**

### Android:
- ✅ Internet permission added
- ✅ Network state permission added
- ✅ Cleartext traffic enabled
- ✅ Network security config added

### iOS:
- ✅ App Transport Security configured
- ✅ HTTP exceptions for your server
- ✅ Arbitrary loads allowed

## 🔍 **Debug Information:**

The app now logs detailed network information:
- Network configuration on startup
- Network status before each request
- API request details
- Response success/error details

## ⚠️ **Important Notes:**

1. **HTTP vs HTTPS**: Your app uses HTTP. For production, consider upgrading to HTTPS
2. **Server Accessibility**: Ensure your server at `118.91.235.74:80` is accessible from mobile networks
3. **Firewall**: Make sure port 80 is open on your server
4. **CORS**: Server should allow requests from mobile apps

## 🚀 **Next Steps:**

1. Build the app using EAS Build
2. Test network connectivity in the built app
3. Monitor console logs for any issues
4. Consider upgrading to HTTPS for better security

## 📞 **Support:**

If issues persist:
1. Check console logs for detailed error messages
2. Use the network test functionality
3. Verify server accessibility
4. Test with different network conditions 