require('dotenv').config();
const fetch = require('node-fetch');

const {
  SKILLS_CK: ck, SKILLS_CS: cs, SKILLS_URL: url,
} = process.env;

const convPric = {
  USD: 28.42,
  EUR: 30.08,
  AUD: 30.08,
  CAD: 28.29,
  RUB: 28.67,
  MXN: 27.90,
  PLN: 28.34,
  CHF: 32.03,
  GBP: 29,
};

const auth = `?consumer_key=${ck}&consumer_secret=${cs}`;

const getOrders = async (page) => {
  const getOrdersUrl = `${url}/wp-json/wc/v3/orders${auth}&per_page=100&page=${page}`;
  const response = await fetch(getOrdersUrl);
  return response.json();
};

const getPaymentFee = (order) => {
  const {
    meta_data: metaData, currency, payment_method: paymentMethod, total,
  } = order;

  const feeObj = metaData.find(
    (e) => e.key === '_stripe_fee' || e.key === 'PayPal Transaction Fee',
  );

  const fee = feeObj ? Number(feeObj.value) : 0;

  let [feePct, exchangeFeePct] = [0, 0];

  if (paymentMethod === 'stripe') {
    feePct = currency === 'EUR' ? fee / 44 : currency === 'USD' ? fee / 54 : fee / 39;
    exchangeFeePct = currency !== 'GBP' && currency !== 'EUR' && currency !== 'USD' ? 0.02 : 0;
  }
  if (paymentMethod === 'paypal') {
    feePct = fee / total;
    exchangeFeePct = currency !== 'GBP' && currency !== 'EUR' && currency !== 'USD' ? 0.0375 : 0;
  }

  return paymentMethod ? feePct + exchangeFeePct : 0;
};

const getCountryPrice = (order) => convPric[order.currency];

const getWCData = async () => {
  const numbers = Array.from({ length: 1 }, (_, i) => i + 1);
  const orderRequests = numbers.map((e) => getOrders(e));
  const orders = await Promise.all(orderRequests);

  const flatOrders = orders.flat();
  const feePct = flatOrders.filter((e) => e.status === 'completed').map((e) => getPaymentFee(e));
  const filteredFeePct = feePct.filter((e) => e !== 0.0375 && e !== 0 && !isNaN(e));
  console.log(filteredFeePct);
  const avgFees = filteredFeePct.reduce((a, b) => (
    a + b)) / filteredFeePct.length;
  console.log(avgFees);
  const actualPrices = flatOrders.map((e) => getCountryPrice(e));
  const avgPrice = actualPrices.reduce((a, b) => a + b) / actualPrices.length;
  console.log(actualPrices);
  console.log(avgPrice);
};

getWCData().catch((err) => console.log(err));
