import './genBook.css'
import React, { useState, useEffect } from 'react';
//I need this to route to other pages
import { useNavigate } from 'react-router-dom';
import './App.css';
import { toast } from 'react-toastify';
//import toast from 'react-hot-toast';
import { useAuth } from "react-oidc-context";

function TextComp(){
  const auth = useAuth();

  //I need this to route to other pages
  const navigate = useNavigate();
  // we set this to false initially, so the pop up saying u must subscribe first doesn't show until the submit button is clicked,
  // at which point, we set showPopup to true
  const [showPopup, setShowPopup] = useState(false);
  const [pagesToGenerate, setPagesToGenerate] = useState('');

  const [misspellWordError, setMisspellWordError] = useState(false);
  const [subjectWordAgreementError, setSubjectWordAgreementError] = useState(false);
  const [punctuationError, setPunctuationError] = useState(false);

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [inputVal, setInputVal] = useState('');
  const [inputVal2, setInputVal2] = useState('');
  //const [outputVal, setOutputVal] = useState('');


  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);

  const [bookId, setBookId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (Number(pagesToGenerate) > credits){ //for some reason, if I dont add Number here, any value over 5 will always trigger this if statement
      toast.info('Note: not enough credits for a ' + pagesToGenerate + ' page story, you only have ' + credits + ' credits',{
      });
      setPagesToGenerate(credits)
    }
    }, [pagesToGenerate])


  //this gets the amount of tokens a user has
  useEffect(() => {
    if (auth.isAuthenticated){
      console.log(auth)
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
                      setCredits(result.tokens);
                  } else {
                      const errorData = await res.json();
                      setError(`Error ${res.status}: ${errorData.message}`);
                  }
              } catch (err) {
                  setError(`An error occurred: ${err.message}`);
              }
          };
        callLambdaFunction();
      }
    else{
        setCredits(0)
      }
  }, [auth.isAuthenticated]);



  const handleInputChange = (event) => {
    //console.log(event)
    if (event.target.id === "first"){
      setInputVal(event.target.value)
    }
    else if (event.target.id === "second"){
      setInputVal2(event.target.value)
    }
  }


  const handleSubmit = async (event) => {



    // Prevent page reload on form submit
    event.preventDefault();
    if (auth.isAuthenticated){
      const username = auth.user.profile.username
      if (pagesToGenerate <= 0 || pagesToGenerate === null || pagesToGenerate === undefined){
        toast.info('must pick a positive number for pages to generate!',{
        });
        return
      }


      if (credits < 1){
        toast.info('out of credits!!! Please buy more or increase subscription!',{
        });
        return
      }

      else {
        toast.info('Creating your story!!! When completed, new story will appear at bottom of page.',{
        autoClose: 150000});
      }

      //const response = await fetch('http://localhost:5000', {
      //const response = await fetch('http://trial-eleven-env.eba-mmydifkc.us-east-1.elasticbeanstalk.com', {
      const response = await fetch('https://h72k7br90g.execute-api.us-east-1.amazonaws.com/startStepFunction', {
        //const response = await fetch('https://generate.adventureader.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        //body: JSON.stringify({ inputVal,  pagesToGenerate, subjectWordAgreementError, misspellWordError, punctuationError, username, bookId, 'state_machine_arn' : 'arn:aws:states:us-east-1:681897892690:stateMachine:generateEntireBook', execution_type : "async"}),
        body: JSON.stringify({ 'prompt' : inputVal,  'pages_to_generate' : pagesToGenerate, 'subjectWordAgreementError' : subjectWordAgreementError, 'misspellWordError' : misspellWordError, 'punctuationError' : punctuationError, 'client_ref_id' : username, 'book_id' : bookId, 'state_machine_arn' : 'arn:aws:states:us-east-1:681897892690:stateMachine:generateEntireBook', execution_type : "async"}),
      });
      const data = await response.json();

      //toast.dismiss()
      navigate('/previously_written_stories');
      //navigate('/new-page', { state:  {story_text: data['pages_for_story'], image_links : data['image_links_'], gramatical_error_story_text: data['grammar_errord_pages_for_story']}  });
      //navigate('/new-page', { state:  {username, bookId}  });
    }
    else{
      setShowPopup(true);
    }

  };

  // below code is all for cognito auth

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  //I dont understand what the point of the below code is. Might delete
  //const signoutRedireOut = () => {
  //  const clientId = "5stih23ateuf46pfbjgg62s54e";
  //  const logoutUri = "<logout uri>";
  //  const cognitoDomain = "<user pool domain>";
  //  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  //};


  // will delete below code
  //if (auth.isAuthenticated) {
  //  return (
  //    <div>
  //      <pre> Hello: {auth.user?.profile.email} </pre>
  //      <pre> ID Token: {auth.user?.id_token} </pre>
  //      <pre> Access Token: {auth.user?.access_token} </pre>
  //      <pre> Refresh Token: {auth.user?.refresh_token} </pre>

  //      <button onClick={() => auth.removeUser()}>Sign out</button>
  //    </div>
  //  );
  //}

  return(
    <div className="fantasy-background">

    <div className="contact-button-container">
      <a
        href="mailto:info@adventureader.com?subject=Contact Us"
        className="contact-button"
      >
        Contact Us
      </a>
    </div>
      <div className="header-container">
        <div className="auth-buttons-gen-book">
          {auth.isAuthenticated ? (
            <>
            <button onClick={() => auth.removeUser()}>Sign Out</button>
            <button onClick={() => navigate('/previously_written_stories')}>Generated Stories</button>
            <button onClick={() => navigate('/write-page-yourself')}>Write Pages Yourself</button>
            <button onClick={() => navigate('/payment-options')}>Add Credits</button>
            </>
          ) : (
            <>
            <button onClick={() => auth.signinRedirect()}>Login / Create Free Account</button>
            <button onClick={() => navigate('/free_library')}>Free Library</button>
            </>
          )}


            <div className="credit-box">
                {`${credits} credits left`}
            </div>

        </div>


      </div>
      <div>
        <h1 class="fantasy-text">Hello, adventurers!</h1>
        <p class="fantasy-text">type in something magical!</p>
      </div>


      <form onSubmit={handleSubmit}>
        <input
          id = "first"
          type="text"
          placeholder="enter enchanting premise!"
          value={inputVal}
          onChange={handleInputChange}
          className="fantasy-input"
          maxLength={150} // Set your desired character limit
        />


        <button type="submit" className="fantasy-button">Submit</button>


        <label htmlFor="pageCount" className="fantasy-label"> </label>
        <input
          id="pageCount"
          type="number"
          placeholder="# of pages to from 1 to 5:"
          min="1"
          max="5"
          value={pagesToGenerate}
          onChange={(e) => setPagesToGenerate(e.target.value)}
          className="fantasy-input"
        />



        {/* Advanced Options Section */}
      <div className="advanced-options-container">
        <button
          type="button"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="advanced-options-button"
        >
          {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>

        {showAdvancedOptions && (
          <div className="advanced-options-box">
            <h3 className="advanced-options-title">Advanced Options</h3>
            <div className="checkbox-container">

              <input
                type="checkbox"
                id="createError"
                checked={misspellWordError}
                onChange={() => setMisspellWordError(!misspellWordError)}
                className="fantasy-checkbox"
              />
              <label htmlFor="createError" className="fantasy-text">
                Create grammatical error
              </label>

              <input
                type="checkbox"
                id="subjectVerbAgreementError"
                checked={subjectWordAgreementError}
                onChange={() => setSubjectWordAgreementError(!subjectWordAgreementError)}
                className="fantasy-checkbox"
              />
              <label htmlFor="subjectVerbAgreementError" className="fantasy-text">
                Create subject verb agreement error
              </label>

              <input
                type="checkbox"
                id="createError"
                checked={punctuationError}
                onChange={() => setPunctuationError(!punctuationError)}
                className="fantasy-checkbox"
              />
              <label htmlFor="createError" className="fantasy-text">
                Create punctuation error
              </label>

              {/* Tooltip on Hover */}
              <div className="tooltip">
                <span className="tooltip-text">
                  So we can try and identify the error!
                </span>
              </div>
          </div>
      </div>
  )}



</div>




      </form>

      {showPopup && <p class="subscription-warning">sign in or create account to create a story!</p>}

    </div>
  )

}


export default TextComp;
