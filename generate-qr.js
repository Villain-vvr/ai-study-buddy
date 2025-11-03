const QRCode = require('qrcode');

// The URL of your deployed app
const url = 'https://villain-vvr.github.io/ai-study-buddy';

// Generate QR code and save it as PNG
QRCode.toFile('qr-code.png', url, {
  color: {
    dark: '#000',  // QR code color
    light: '#FFF' // Background color
  },
  width: 400,
  margin: 2
}, function(err) {
  if (err) throw err;
  console.log('QR Code has been generated successfully!');
  console.log(`\nScan this QR code to access: ${url}`);
  console.log('\nThe QR code has been saved as "qr-code.png"');
});

// Also display QR code in terminal
console.log('\nPreview in terminal:');
QRCode.toString(url, { type: 'terminal' }, function(err, string) {
  if (err) throw err;
  console.log(string);
});