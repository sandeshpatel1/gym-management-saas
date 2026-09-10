const razorpay = require('./razorpay');
const easebuzz = require('./easebuzz');

// Adding a new gateway = write one file with the same shape, register it
// here, and add its key + credential fields to PlatformSettings from the
// superadmin UI. No other backend code needs to change.
const registry = { razorpay, easebuzz };

const getGateway = (providerKey) => {
  const gw = registry[providerKey];
  if (!gw) throw new Error(`Unsupported payment gateway: ${providerKey}`);
  return gw;
};

module.exports = { getGateway };