require('dotenv').config();
const express = require('express');
const app = express();
const https = require('https');

app.use(express.json());
app.use(express.static('public'));

// Paystack transaction initialization endpoint
app.post('/create-checkout-session', (req, res) => {
  const { productName, amount } = req.body;

  // Paystack expects amount in the lowest currency unit (cents for ZAR, e.g., 2000 = R20.00)
  const params = JSON.stringify({
    email: "testcustomer@example.com", // In a real store, you'd collect the customer's email on the frontend
    amount: amount,
    currency: "ZAR",
    callback_url: `${req.headers.origin}/success.html`
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_paystack_key_here'}`,
      'Content-Type': 'application/json'
    }
  };

  const reqPaystack = https.request(options, apiRes => {
    let data = '';
    apiRes.on('data', chunk => {
      data += chunk;
    });
    apiRes.on('end', () => {
      const response = JSON.parse(data);
      if (response.status) {
        // Send Paystack's hosted payment link back to your frontend
        res.json({ url: response.data.authorization_url });
      } else {
        res.status(500).json({ error: response.message });
      }
    });
  });

  reqPaystack.on('error', error => {
    res.status(500).json({ error: error.message });
  });

  reqPaystack.write(params);
  reqPaystack.end();
});

app.listen(4242, () => console.log('Paystack server running on port 4242!'));