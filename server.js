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

  // Create sample certificate files content
  const p12Content = Buffer.from(`-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODE3MDgzNTQ3WhcNMTgwODE3MDgzNTQ3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuuPiIMzQZJ5R2YzHoT1HDR7CU0WbgVf9E2TQGDzurCAT7xU+YXdZrqqL
${certificate.teamId}_${certificate.type}
-----END CERTIFICATE-----`);

  const provisionContent = `<?xml version="1.0" encoding="UTF-8"?>
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
  <date>2024-01-01T00:00:00Z</date>
  <key>Platform</key>
  <array>
    <string>iOS</string>
  </array>
  <key>ExpirationDate</key>
  <date>${certificate.expiryDate}T23:59:59Z</date>
  <key>Name</key>
  <string>${certificate.name}</string>
  <key>TeamIdentifier</key>
  <array>
    <string>${certificate.teamId}</string>
  </array>
  <key>TeamName</key>
  <string>Development Team</string>
  <key>UUID</key>
  <string>${generateUUID()}</string>
  <key>Version</key>
  <integer>1</integer>
</dict>
</plist>`;

  const passwordContent = `Certificate Password: ${certificate.password}
Certificate Type: ${certificate.type}
Bundle ID: ${certificate.bundleId}
Team ID: ${certificate.teamId}
Expiry Date: ${certificate.expiryDate}

Instructions:
1. Install the .p12 certificate in Keychain Access
2. Use the provided password when prompted
3. Import the .mobileprovision file in Xcode
4. Select the appropriate provisioning profile in your project settings`;

  // Add files to zip
  archive.append(p12Content, { name: certificate.p12File });
  archive.append(provisionContent, { name: certificate.provisionFile });
  archive.append(passwordContent, { name: 'password.txt' });

  archive.finalize();
});

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