const fetch = require('node-fetch');

const { MYTAPI_TOKEN: myTapiToken, MYTAPI_ID: myTapiID, MYTAPI_PHONE: myTapiPhone } = process.env;

const url = `https://api.maytapi.com/api/${myTapiID}/${myTapiPhone}/sendMessage`;

exports.sendWhatsapp = (numbers, message) => {
  const dataObjects = numbers.map((e) => ({
    to_number: e,
    message,
    type: 'text',
  }));
  dataObjects.forEach(
    (data) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'x-maytapi-key': myTapiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((response) => {
        response.json().then((json) => console.log(json));
      });
    },
  );
};
