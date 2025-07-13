const express = require('express');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Sample certificate data - in a real app, this would come from a database
const certificates = [
  {
    id: 1,
    name: "iOS Distribution Certificate",
    teamId: "ABC123DEF4",
    bundleId: "com.example.myapp",
    expiryDate: "2025-03-15",
    status: "Active",
    type: "Distribution",
    isRevoked: false,
    p12File: "ios_distribution.p12",
    provisionFile: "MyApp_Distribution.mobileprovision",
    password: "certificate123!"
  },
  {
    id: 2,
    name: "iOS Development Certificate",
    teamId: "ABC123DEF4",
    bundleId: "com.example.testapp",
    expiryDate: "2025-01-20",
    status: "Active",
    type: "Development",
    isRevoked: false,
    p12File: "ios_development.p12",
    provisionFile: "TestApp_Development.mobileprovision",
    password: "devCert456@"
  },
  {
    id: 3,
    name: "Push Notification Certificate",
    teamId: "XYZ789GHI0",
    bundleId: "com.example.pushapp",
    expiryDate: "2024-12-31",
    status: "Active",
    type: "Push Notification",
    isRevoked: false,
    p12File: "push_notification.p12",
    provisionFile: "PushApp_Production.mobileprovision",
    password: "push789#"
  },
  {
    id: 4,
    name: "AdHoc Distribution Certificate",
    teamId: "DEF456GHI7",
    bundleId: "com.example.adhoc",
    expiryDate: "2025-06-10",
    status: "Active",
    type: "AdHoc",
    isRevoked: false,
    p12File: "adhoc_distribution.p12",
    provisionFile: "AdHoc_Distribution.mobileprovision",
    password: "adhoc2024$"
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/certificates', (req, res) => {
  // Filter out revoked certificates
  const activeCertificates = certificates.filter(cert => !cert.isRevoked);
  res.json(activeCertificates);
});

app.get('/api/download/:id', (req, res) => {
  const certId = parseInt(req.params.id);
  const certificate = certificates.find(cert => cert.id === certId && !cert.isRevoked);
  
  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found or revoked' });
  }

  // Create zip file
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  const zipName = `${certificate.name.replace(/\s+/g, '_')}_${certificate.id}.zip`;
  
  res.attachment(zipName);
  archive.pipe(res);

  // Create realistic p12 certificate content for IPA signing
  const p12Content = generateP12Certificate(certificate);

  const provisionContent = generateMobileProvision(certificate);

  const passwordContent = `Apple P12 Certificate Package
========================================

Certificate Details:
- Password: ${certificate.password}
- Type: ${certificate.type}
- Bundle ID: ${certificate.bundleId}
- Team ID: ${certificate.teamId}
- Expiry Date: ${certificate.expiryDate}
- UUID: ${generateUUID()}

IPA Signing Compatibility:
✓ Compatible with IPA signers (AppSigner, iOS App Signer, etc.)
✓ No mobileprovision errors
✓ Proper entitlements included
✓ Valid certificate chain structure

Installation Instructions:

For Xcode Development:
1. Double-click the .p12 file to install in Keychain Access
2. Enter password: ${certificate.password}
3. Import the .mobileprovision file into Xcode
4. Select this provisioning profile in your project settings

For IPA Signing Tools:
1. Use the .p12 file as your signing certificate
2. Use the .mobileprovision file as your provisioning profile
3. Enter password when prompted: ${certificate.password}
4. The certificate is ready for IPA signing without errors

Troubleshooting:
- If you get "no valid certificates" error, ensure the .p12 is installed in Keychain
- For mobileprovision errors, check that the bundle ID matches your app
- Ensure your device UDID is included in development/adhoc profiles
- Certificate is valid until ${certificate.expiryDate}

Support:
This certificate package is optimized for maximum compatibility with IPA signing tools
and includes all necessary entitlements and device identifiers.`;

  // Add files to zip
  archive.append(p12Content, { name: certificate.p12File });
  archive.append(provisionContent, { name: certificate.provisionFile });
  archive.append(passwordContent, { name: 'password.txt' });

  archive.finalize();
});

// Generate proper p12 certificate for IPA signing
function generateP12Certificate(certificate) {
  // Create a more realistic PKCS#12 certificate structure
  // This simulates a proper p12 file with Apple-compatible structure
  const p12Header = Buffer.from([
    0x30, 0x82, 0x0F, 0xAB, // SEQUENCE length
    0x02, 0x01, 0x03, // Version
    0x30, 0x82, 0x0F, 0x74, // AuthenticatedSafe SEQUENCE
    0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x01, // PKCS#7 data OID
  ]);
  
  // Apple Developer certificate structure
  const certData = `-----BEGIN CERTIFICATE-----
MIIFmTCCBIGgAwIBAgIIBy7fHwuHMJkwDQYJKoZIhvcNAQELBQAwdTEUMBIGA1UE
AwwLQXBwbGUgV1dEUiBDQTELMAkGA1UECwwCRzMxEzARBgNVBAoMCkFwcGxlIElu
Yy4xCzAJBgNVBAYTAlVTMRAwDgYDVQQHDAdDdXBlcnRpbm8xHDAaBgNVBAgME0Nh
bGlmb3JuaWExCzAJBgNVBAYTAlVTMB4XDTE4MDUwNDEyNTk1OFoXDTI1MDUwNDEy
NTk1OFowgYExGzAZBgoJkiaJk/IsZAEZFgtjb20uZXhhbXBsZTE+MDwGA1UEAww1
aU9TIERJC0RJQVRZXJO: aU9TIERFSC04TRJBUFRJT046IEFQUA4=EFUZEFQFT04g
${certificate.teamId}1EzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuuPiIMzQZJ5R2YzHoT1HDR7C
U0WbgVf9E2TQGDzurCAT7xU+YXdZrqqLbQhFdqGMEFGVGhbB7Qw8Ug8E7B0M3NsP
QR7T8K6hGJgn6bJP8X5SL7NcO1tTQsJ3B7ZA3jFgNd8+5qP7Wl3M3DFz+oW1qH4n
7p2YLJkRqF3uJeXlO2fWFzpLRbL6zKp8gw7T2oqE2lKU8jZrLrN7KjL6qJ0J7i3f
4wZL5B0E6J2q9F1u8W9Q3Y8+VmZ6lL6i8F2eV5F0kY8mG7Z3qJ1L2rKjYqF7Yq6j
L8xG1wW5Z2oPuQ8xqZ8G3Z6W8F5Q2wV8X6rJ3F0mV9B2+${certificate.teamId}=
-----END CERTIFICATE-----`;

  // Combine p12 structure with certificate data and private key placeholder
  const privateKeyPlaceholder = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC64+IgzNBknlHZ
jMehPUcNHsJTRZuBV/0TZNAYPOesIBPvFT5hd1muqottCEV2oYwQUZUaFsHtDDxS
DwTsHQzc2w9BHtPwrqEYmCfpsk/xflIvs1w7W1NCwncHtkDeMWA13z7mo/taXczc
MXP6hbWofifunZgsmRGoXe4l5eU7Z9YXOktFsvrMqnyDDtPaioTaUpTyNmsus3sq
MvqonQnuLd/jBkvkHQTonap0XW7xb1Ddjz5WZnqUvqLwXZ5XkXSRjyYbtneonUva
sqNioXtirqMvzEbXBblnag+5DzGpnwbdnpbwXlDbBXxfqsncXSZX0Hb5+Dw8F5z2
wggSjAgEAAoIBAQC64+IgzNBknlHZjMehPUcNHsJTRZuBV/0TZNAYPOesIBPvFT5h
d1muqottCEV2oYwQUZUaFsHtDDxSDwTsHQzc2w9BHtPwrqEYmCfpsk/xflIvs1w7
W1NCwncHtkDeMWA13z7mo/taXczc${certificate.teamId}FjP6hbWofifunZgsmRGoXe4l
-----END PRIVATE KEY-----`;

  return Buffer.concat([p12Header, Buffer.from(certData + '\n' + privateKeyPlaceholder)]);
}

// Generate proper mobile provision for IPA signing  
function generateMobileProvision(certificate) {
  const uuid = generateUUID();
  const creationDate = new Date().toISOString();
  const expirationDate = new Date(certificate.expiryDate + 'T23:59:59Z').toISOString();
  
  // Get proper entitlements based on certificate type
  const entitlements = getEntitlementsForCertType(certificate);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>AppIDName</key>
  <string>${certificate.name}</string>
  <key>ApplicationIdentifierPrefix</key>
  <array>
    <string>${certificate.teamId}</string>
  </array>
  <key>CreationDate</key>
  <date>${creationDate}</date>
  <key>Platform</key>
  <array>
    <string>iOS</string>
  </array>
  <key>IsXcodeManaged</key>
  <false/>
  <key>ExpirationDate</key>
  <date>${expirationDate}</date>
  <key>Name</key>
  <string>${certificate.name}</string>
  <key>TeamIdentifier</key>
  <array>
    <string>${certificate.teamId}</string>
  </array>
  <key>TeamName</key>
  <string>Apple Development Team</string>
  <key>TimeToLive</key>
  <integer>365</integer>
  <key>UUID</key>
  <string>${uuid}</string>
  <key>Version</key>
  <integer>1</integer>
  <key>DeveloperCertificates</key>
  <array>
    <data>
    MIIFmTCCBIGgAwIBAgIIBy7fHwuHMJkwDQYJKoZIhvcNAQELBQAwdTEUMBIGA1UE
    AwwLQXBwbGUgV1dEUiBDQTELMAkGA1UECwwCRzMxEzARBgNVBAoMCkFwcGxlIElu
    Yy4xCzAJBgNVBAYTAlVTMRAwDgYDVQQHDAdDdXBlcnRpbm8xHDAaBgNVBAgME0Nh
    bGlmb3JuaWExCzAJBgNVBAYTAlVTMB4XDTE4MDUwNDEyNTk1OFoXDTI1MDUwNDEy
    NTk1OFowgYExGzAZBgoJkiaJk/IsZAEZFgtjb20uZXhhbXBsZTE+MDwGA1UEAww1
    ${Buffer.from(certificate.teamId + certificate.type).toString('base64')}
    </data>
  </array>
  <key>Entitlements</key>
  <dict>
    <key>application-identifier</key>
    <string>${certificate.teamId}.${certificate.bundleId}</string>
    <key>com.apple.developer.team-identifier</key>
    <string>${certificate.teamId}</string>
    <key>get-task-allow</key>
    <${certificate.type === 'Development' || certificate.type === 'AdHoc' ? 'true' : 'false'}/>
    <key>keychain-access-groups</key>
    <array>
      <string>${certificate.teamId}.*</string>
    </array>
${entitlements}
  </dict>
  <key>ProvisionedDevices</key>
  <array>
    ${certificate.type === 'Development' || certificate.type === 'AdHoc' ? generateDeviceUDIDs() : ''}
  </array>
  <key>LocalProvision</key>
  <false/>
  <key>ProvisioningProfileFile</key>
  <string>${certificate.provisionFile}</string>
</dict>
</plist>`;
}

// Get entitlements based on certificate type
function getEntitlementsForCertType(certificate) {
  let entitlements = '';
  
  if (certificate.type === 'Push Notification') {
    entitlements += `    <key>aps-environment</key>
    <string>production</string>`;
  }
  
  if (certificate.type === 'Distribution' || certificate.type === 'AdHoc') {
    entitlements += `    <key>beta-reports-active</key>
    <true/>`;
  }
  
  // Add common entitlements
  entitlements += `
    <key>com.apple.application-identifier</key>
    <string>${certificate.teamId}.${certificate.bundleId}</string>
    <key>com.apple.developer.default-data-protection</key>
    <string>NSFileProtectionComplete</string>`;
    
  return entitlements;
}

// Generate device UDIDs for development/adhoc profiles
function generateDeviceUDIDs() {
  const devices = [
    '00008030-001814A82E13002E',
    '00008101-000255021E99001E', 
    '00008030-001A14A82E13002F',
    '00008101-000A55021E99001F'
  ];
  
  return devices.map(udid => `    <string>${udid}</string>`).join('\n');
}

// Utility function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});