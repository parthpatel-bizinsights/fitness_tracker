const webpush = require('web-push');
const fs = require('fs');

const vapidKeys = webpush.generateVAPIDKeys();

const envPath = 'e:/Parth/Git-BizInsights/Fitness_Tracker/node.fitness.tracker/.env';
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (!envContent.includes('VAPID_PUBLIC_KEY')) {
  envContent += `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:admin@aurafit.com\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('VAPID keys added to .env');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
} else {
  console.log('VAPID keys already exist in .env');
}
