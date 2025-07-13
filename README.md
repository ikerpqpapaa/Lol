# Apple P12 Certificate Manager

A modern web application for managing and downloading Apple P12 certificates with mobile provisioning profiles optimized for IPA signing tools.

## Features

✨ **Certificate Management**
- View all active Apple P12 certificates
- Filter certificates by name, type, bundle ID, or team ID
- Real-time statistics dashboard
- Expiration date tracking

🔒 **IPA Signing Compatible**
- Certificates work seamlessly with IPA signers
- No mobileprovision errors
- Proper entitlements included
- Valid certificate chain structure

📦 **Download Package**
- One-click download of complete certificate packages
- Includes .p12 certificate, .mobileprovision file, and password
- Ready-to-use with popular IPA signing tools
- Comprehensive installation instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Browse available certificates
   - Click any certificate to download the package

## Certificate Types Supported

- **iOS Distribution** - For App Store releases
- **iOS Development** - For development and testing
- **Push Notification** - For APNs services
- **AdHoc Distribution** - For limited device distribution

## IPA Signing Compatibility

The generated certificates are fully compatible with:
- AppSigner
- iOS App Signer
- 3uTools
- AltStore
- Sideloadly
- And other popular IPA signing tools

## Package Contents

Each downloaded zip file contains:
- **Certificate.p12** - The signing certificate
- **Profile.mobileprovision** - The provisioning profile
- **password.txt** - Certificate password and instructions

## Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Styling:** Modern CSS with gradient backgrounds and animations
- **Icons:** Font Awesome
- **Archive:** Archiver.js for zip file generation

## Security Features

- Non-revoked certificates only
- Proper certificate validation
- Secure password generation
- Team ID verification

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

For development with auto-reload:
```bash
npm run dev
```

## License

MIT License - Feel free to use and modify for your needs.
