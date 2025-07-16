require('dotenv').config();
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
console.log(accountSid, authToken);
const client = twilio(accountSid, authToken);

// Send verification code using Twilio Verify API
async function sendVerification({ to }) {
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!verifyServiceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID is not set in .env');
  try {
    const verification = await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to, channel: 'sms' });
    return verification;
  } catch (error) {
    throw error;
  }
}

// Check verification code using Twilio Verify API
async function checkVerification({ to, code }) {
  
  if (!verifyServiceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID is not set in .env');
  try {
    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to, code });
    return verificationCheck;
  } catch (error) {
    throw error;
  }
}

if (require.main === module) {
  const readline = require('readline');
  const testNumber = "+919095145230";
  sendVerification({ to: testNumber })
    .then(verification => {
      console.log('Verification sent! SID:', verification.sid);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the OTP you received: ', (inputCode) => {
        checkVerification({ to: testNumber, code: inputCode })
          .then(result => {
            if (result.status === 'approved') {
              console.log('✅ OTP verified successfully!');
            } else {
              console.log('❌ OTP verification failed. Status:', result.status);
            }
            rl.close();
          })
          .catch(err => {
            console.error('Verification check failed:', err.message);
            rl.close();
          });
      });
    })
    .catch(err => {
      console.error('Test failed:', err.message);
      process.exit(1);
    });
}

module.exports = { 
  sendVerification,
  checkVerification
}; 