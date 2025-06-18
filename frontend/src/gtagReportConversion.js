export const gtag_report_conversion = (price, url) => {
  const callback = () => {
    if (typeof url !== 'undefined') {
      window.location = url;
    }
  };

  console.log('gtag event incoming with price: ', price);
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'conversion', {
      send_to: 'AW-17082339509/nOh2CIWhgNUaELWhv9E_',
      value: price,
      currency: 'USD',
      event_callback: callback,
    });
    console.log('gtag event sent');
  }

  return false;
};
