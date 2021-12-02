require('dotenv').config();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SALES_TEAM_TOKEN);

const getStripeCharges = async () => {
  const charge = await stripe.payouts.list();
  console.log(charge);
};

getStripeCharges();
