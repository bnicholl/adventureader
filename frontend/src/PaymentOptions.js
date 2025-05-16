import React, { useState, useEffect } from 'react';
import './Payments.css'; // Create this CSS file for styling
import { useAuth } from "react-oidc-context";
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const auth = useAuth();

  console.log(auth)

  const [subscriberId, setSubscriberId] = useState();

  useEffect(() => {
    if (auth.isAuthenticated){
        const username = auth.user.profile.username
        const callLambdaFunction = async () => {
              const apiUrl = 'https://tsslzkazt5.execute-api.us-east-1.amazonaws.com/query_dynamo';
              //const apiUrl = 'https://qywclwlms3v3kexxwalw3ort7u0wjsfn.lambda-url.us-east-1.on.aws';
              const data = { client_reference_id: username };

              try {
                  const res = await fetch(apiUrl, {
                      method: 'POST',
                      mode: 'cors', // this cannot be 'no-cors'
                      headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(data),
                  });

                  if (res.ok) {
                      const result = await res.json();
                      console.log(result)
                      setSubscriberId(result['subscription'])
                  } else {
                      const errorData = await res.json();
                  }
              } catch (err) {
                  console.log(err.message)
              }
          };
        callLambdaFunction();
      }
  }, [auth.isAuthenticated]);







  const handleUnsubscribe = async () => {
      const apiUrl = 'https://60wyc7gkp9.execute-api.us-east-1.amazonaws.com/cancelSubscription';
      //const apiUrl = 'https://qywclwlms3v3kexxwalw3ort7u0wjsfn.lambda-url.us-east-1.on.aws';
      const data = { subscription: subscriberId };
      console.log(subscriberId)
      console.log('subscriberId')
      try {
          const res = await fetch(apiUrl, {
              method: 'POST',
              mode: 'cors', // this cannot be 'no-cors'
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
          });

          if (res.ok) {
              const result = await res.json();
              console.log(result)
              toast.info('Subscription successfully canceled! ',{
              autoClose: 25000})
          } else {
              const errorData = await res.json();
              toast.info(errorData + ' Error canceling subscription. Contact info@adventureader.com and we will remedy this immediately  ',{
              autoClose: 25000})
          }
      } catch (err) {
          console.log(err.message)
          toast.info(err.message + ' Error canceling subscription. Contact info@adventureader.com and we will remedy this immediately  ',{
          autoClose: 25000})
      }
  };

  const paymentOptions = [
    { id: 1, price: 6, stories: 15, individual_pages : 75, url: `https://buy.stripe.com/bIYbJ04Ul29b2NGeV0?client_reference_id=${auth.user.profile.username}` },
    { id: 2, price: 12, stories: 35, individual_pages : 175, url: `https://buy.stripe.com/bIYaEW1I9013ag86ov?client_reference_id=${auth.user.profile.username}` },
    { id: 3, price: 24, stories: 80, individual_pages : 400, url: `https://buy.stripe.com/aEU8wO72tg010Fy14c?client_reference_id=${auth.user.profile.username}` },
    { id: 4, price: 48, stories: 190, individual_pages : 950, url: `https://buy.stripe.com/7sIfZg3Qh157bkc5kt?client_reference_id=${auth.user.profile.username}` },
  ];

  const handleSubscribe = (url) => {
    window.location.href = url;
  };

  return (
    <div className="payments-container">
      <h1>Choose Your Plan</h1>
      <div className="payment-options">
        {paymentOptions.map((option) => (
          <div key={option.id} className="payment-option">
            <h2>${option.price}</h2>
            <p>&bull; {option.stories} five page stories a month</p>
            <p>&bull; {option.individual_pages} individual pages a month </p>
            <p>&bull; cancel anytime</p>
            <button
              className="subscribe-button"
              onClick={() => handleSubscribe(option.url)}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>

      <button className="unsubscribe-button" onClick={handleUnsubscribe}>
        Unsubscribe
      </button>
    </div>
  );
};

export default PaymentPage;
