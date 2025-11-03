const QRCode = require('qrcode');
const os = require('os');
const http = require('http');

// Get the most suitable local IP for mobile access
function getBestLocalIP() {
    const interfaces = os.networkInterfaces();
    // Prefer Wi-Fi and Ethernet interfaces
    const preferredNames = ['Wi-Fi', 'Ethernet', 'eth0', 'wlan0'];
    
    let bestIP = null;
    
    // First try preferred interfaces
    for (const preferred of preferredNames) {
        const iface = interfaces[preferred];
        if (iface) {
            const ipv4 = iface.find(ip => ip.family === 'IPv4' && !ip.internal);
            if (ipv4) {
                bestIP = ipv4.address;
                break;
            }
        }
    }
    
    // If no preferred interface found, try any non-internal IPv4
    if (!bestIP) {
        for (const ifaceName in interfaces) {
            const iface = interfaces[ifaceName];
            const ipv4 = iface.find(ip => ip.family === 'IPv4' && !ip.internal);
            if (ipv4) {
                bestIP = ipv4.address;
                break;
            }
        }
    }
    
    return bestIP;
}

// Test if a port is accessible
async function testPort(host, port) {
    return new Promise((resolve) => {
        const req = http.get(`http://${host}:${port}/`, (res) => {
            resolve(true);
            req.destroy();
        });
        
        req.on('error', () => {
            resolve(false);
            req.destroy();
        });
        
        req.setTimeout(1000, () => {
            resolve(false);
            req.destroy();
        });
    });
}

async function generateQRCodes() {
    const port = process.env.PORT || 3000;
    const bestIP = getBestLocalIP();
    
    if (!bestIP) {
        console.error('❌ Could not find a suitable network interface');
        return;
    }
    
    const networkURL = `http://${bestIP}:${port}`;
    
    // Test if the server is accessible
    const isAccessible = await testPort(bestIP, port);
    
    console.log('\n🌐 Network Access Information:\n');
    
    if (!isAccessible) {
        console.log('⚠️ Warning: Server port is not accessible. Please check:');
        console.log('1. The Vite server is running (npm run dev)');
        console.log('2. Windows Firewall allows Node.js/port 3000');
        console.log('3. Your antivirus is not blocking the connection');
        console.log('\nTo fix firewall, run PowerShell as Administrator and enter:');
        console.log('New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow\n');
    }
    
    console.log('📱 Network URL (scan this on mobile):');
    console.log(networkURL);
    
    console.log('\n📱 QR Code for mobile access:');
    const qr = await QRCode.toString(networkURL, {
        type: 'terminal',
        small: true
    });
    console.log(qr);
    
    // Save as PNG for better scanning
    await QRCode.toFile('network-qr.png', networkURL, {
        color: {
            dark: '#000',
            light: '#FFF'
        },
        width: 300,
        margin: 2
    });
    
    console.log('\n💾 QR code also saved as: network-qr.png');
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Make sure your phone is on the same Wi-Fi network');
    console.log('2. Try opening the URL directly in your phone\'s browser');
    console.log(`3. Your local IP is: ${bestIP}`);
    console.log('4. If using Windows, check Windows Defender Firewall settings\n');
}

generateQRCodes().catch(console.error);