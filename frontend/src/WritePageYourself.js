import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
//import './styles.css';
import styles from './styles.modules.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "react-oidc-context";
import { toast } from 'react-toastify';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
// to do 1. get rid of anything in [brackets]   2. ensure both sentences have same length(might wanna fo this on backend) 3. put widget saying how many errors are on page



function WritePage() {
  //check if there is a location.state here. if there is instantate story text, images, etc. Else instantie the way it does it now
  const [showModal, setShowModal] = useState(false);
  const [grammarText, setGrammarText] = useState('');

  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);

  const bookId = useRef(crypto.randomUUID()).current;

  const [isCharacterPopupOpen, setIsCharacterPopupOpen] = useState(null);

  const [characterDescriptions, setCharacterDescriptions] = useState([]);

  const auth = useAuth();
  console.log(auth)

  const [pages, setPages] = useState([""]);
  const [imageLinks, setImageLinks]  = useState([])
  const [imageS3Paths, setImageS3Paths]  = useState([])

  const [currentPage, setCurrentPage] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  //this gets the amount of tokens a user has
  useEffect(() => {
    if (auth.isAuthenticated){
      //console.log(auth)
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
                      //console.log(result)
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
  }, [auth.isAuthenticated, imageLinks]);

  const handleImageS3Paths = (image_S3_path) => {
    setImageS3Paths((prevS3Paths) => { //here prevS3Paths is the current imageS3Paths state
      prevS3Paths[currentPage] = image_S3_path
      return [...prevS3Paths]
    })
  }


  const nextPage = () => {

    if (pages[currentPage]){ // if True, something is written in the text box, else nothing is written in the text box
      setCurrentPage(currentPage + 1);
      console.log(pages)
      console.log(imageLinks[currentPage])
      console.log('currentPage')
      console.log(imageLinks)
      console.log(currentPage)

      if(!pages[currentPage + 1]){ // If I dont instantiate a brand new page with "", the text from the previous page will not change, so the brand new page will have the previous page text
        const updatedPages = [...pages];
        console.log('aaaaa', updatedPages)
        updatedPages[currentPage+ 1] = "";
        setPages(updatedPages);
      }




    }
    else {
      toast.info('write something!!!',{
      autoClose: 1500});
    }
  };


  //useEffect(() => {

    //setPages((prevPages) => {
      //prevPages[currentPage] = ""
      //return [...prevPages]
    //})
  //}, [currentPage] )


  const prevPage = () => {
    console.log(pages)
    console.log(imageLinks[currentPage])
    console.log('prevcurrentPage')
    console.log(currentPage)
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const navigate = useNavigate();

  const redirectToAnotherPage = () => {
    navigate('/'); // Replace '/another-page' with your desired route
  };

  const callLambdaFunctions = async (event) => {

    if (!pages[currentPage]){

      toast.info("make sure to type something into the box!",{
      });
      return
    }

    if (auth.isAuthenticated === false){
      return

    }

    if (credits === "0"){
      toast.info('out of credits! ',{
      autoClose: 1500});
      console.log("out of credits!")
      return
    }

    const username = auth.user.profile.username
    if (event == "generateImage" ){

      if (imageLinks[currentPage]){
        toast.info("an image for this page has already been generarted!",{
        });
        return
      }

      console.log("credits")
      console.log(credits)

      toast.info('generating image and saving your story!!!',{
      autoClose: 20000});

      const stringifyCharacterDescriptions = characterDescriptions.join('. ') + '.';
      const data = { client_ref_id: username, prompt : pages[currentPage], character_desc_list : characterDescriptions, character_desc : stringifyCharacterDescriptions, current_page_text : "", 'state_machine_arn' : 'arn:aws:states:us-east-1:681897892690:stateMachine:WriteOwnStoryGenImageExpress', book_id : bookId, error : "none", image_s3_paths_for_story_in_list : imageS3Paths, pages_list : pages, execution_type : "sync", current_page : currentPage, pages_to_generate : pages.length.toString() }; //current_page and pages_to_generate is needed for one of the functions but it's irrelevant for this page

      const response = await fetch('https://h72k7br90g.execute-api.us-east-1.amazonaws.com/startStepFunction', {
        //const response = await fetch('https://generate.adventureader.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const url_ = await response.json();
      const temp_url = url_["urls"]

      console.log("printing urs and temp urls")
      console.log(temp_url)
      console.log(url_['image_s3_paths_for_story_in_list'])
      //I CAN JUST CALL setImageLinks DIRECTLY HERE. SIMPLIFY LATER
      setImageLinks((prevImageLinks) => { //here prevImageLinks is the current imageLinks state

        //return [...prevImageLinks, temp_url[0]];
        return [...temp_url ];
      })
      console.log("printing urs and temp urls again")
      //handleImageLinks(temp_url[0])

      //CALLING ANOTHER FUN HERE IS DUMB. JUST DO WHAT YOU DID ABOVE
      handleImageS3Paths(url_['image_s3_paths_for_story_in_list'][currentPage])

      console.log("printing urs and temp urls again")


    }

    else if (event == "improveGrammar"){

      const apiUrl = 'https://1enu5amz30.execute-api.us-east-1.amazonaws.com/';
      //const apiUrl = 'https://h72k7br90g.execute-api.us-east-1.amazonaws.com/startStepFunction'

      toast.info('looking for improvements with your text!!!',{
      autoClose: 5000});

      const data = { prompt : pages[currentPage] };

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
          setGrammarText(result["grammar_improvments"]);
          setShowModal(true); // Show modal with the string

        }


    }
  }


  // below functions are for adding character descriptions logic
  const addCharacterDescription = () => {
    if (characterDescriptions.length < 5){
      setCharacterDescriptions([...characterDescriptions, ""]);  // Add a new empty description
    }
    else{
      toast.info('max amount of character reaches! ',{
      autoClose: 1500})
    }
  };

  const updateCharacterDescription = (index, value) => {

    const updatedDescriptions = [...characterDescriptions];
    updatedDescriptions[index] = value;
    setCharacterDescriptions(updatedDescriptions);
  };

  const removeCharacterDescription = (index) => {
    const updatedDescriptions = [...characterDescriptions];
    updatedDescriptions.splice(index, 1);
    setCharacterDescriptions(updatedDescriptions);
  };



      return (

        <div className={"body"}>

          <div className={"bookContainerWritePageYourself"}>
          <div className={"pageContent"}>

                {imageLinks[currentPage] ? (
                  <img src={imageLinks[currentPage]} alt="Page" className="pageImage" />
                  ) : (
                  <p>Image will go here</p> // Optional fallback if the array is empty
                  )}

                <textarea
                  id = 'user_text'
                  className={`editableText ${isPopupOpen ? 'popup' : ''}`} // if isPopupOpen = True, .editableText.popup inside App.css will be rendered. Else editableText in App.css will be rendered
                  value={pages[currentPage]} // Controlled component
                  maxLength={300}
                  onChange={(event) => {
                    const updatedPages = [...pages];
                    //console.log('aaaaa', updatedPages)
                    updatedPages[currentPage] = event.target.value;
                    setPages(updatedPages)//, event.target.value);

                  }}
                  //contentEditable
                  //suppressContentEditableWarning
                  onBlur={(event) => {

                    setIsPopupOpen(false);
                  }}
                  onClick={() => setIsPopupOpen(true)}
                  placeholder="Click here to start writing your story..."
                />
              </div>

              <div className="navigation">
                <button onClick={prevPage} disabled={currentPage === 0}>Previous</button>
                <button onClick={nextPage}> Next</button>
                <button onClick={redirectToAnotherPage}>Create another story</button>
              </div>

              <div className="improve-text-create-image" >
                <button onClick={() => callLambdaFunctions("improveGrammar")}>Improve Grammar</button>
                <button onClick={() => callLambdaFunctions("generateImage")}>Generate Image</button>


                <button onClick={addCharacterDescription}>
                  Add Character
                </button>



              </div>

              <div className="characterDescriptionContainer">
                {characterDescriptions.map((description, index) => (
                <div key={index} className="characterDescriptionWrapper">
                  <textarea
                    key={index}
                    /*className={`characterDescription ${isCharacterPopupOpen ? 'popup' : ''}`} */
                    className="characterDescription"
                    maxLength={125}
                    value={characterDescriptions[index]}
                    onChange={(event) => updateCharacterDescription(index, event.target.value)}
                    onBlur={() => setIsCharacterPopupOpen(null)}
                    onClick={() => setIsCharacterPopupOpen(index)}
                    placeholder="Click to start writing character description..."
                  />
                  <button
                    className="deleteButton"
                    onClick={() => removeCharacterDescription(index)}
                  >
                    ✕
                  </button>
                </div>
                ))}
              </div>

            </div>

        {/* 🔽 Blackboard Modal inserted here */}
        {showModal && (
          <div className="blackboard-backdrop">
            <div className="blackboard-modal">
              <h2>📚 Grammar Lesson</h2>
              <p>{grammarText}</p>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
        </div>
      );


}
export default WritePage;
