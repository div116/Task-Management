require('dotenv').config();
const mongoose = require('mongoose');

console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET (' + process.env.MONGO_URI.substring(0, 35) + '...)' : 'UNDEFINED');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'UNDEFINED');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false,
})
  .then(() => {
    console.log('MongoDB Connected OK');
    process.exit(0);
  })
  .catch((e) => {
    console.error('MongoDB Error:', e.message);
    process.exit(1);
  });
