import React, { useState, useEffect } from 'react';
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

  const [isCharacterPopupOpen, setIsCharacterPopupOpen] = useState(null);
  console.log(isCharacterPopupOpen)
  console.log('isCharacterPopupOpen')
  const [characterDescriptions, setCharacterDescriptions] = useState([]);

  const [bookId, setBookId] = useState(() => crypto.randomUUID());

  const auth = useAuth();
  console.log(auth)

  const [pages, setPages] = useState([""]);
  const [imageLinks, setImageLinks]  = useState([])
  const [imageS3Paths, setImageS3Paths]  = useState([])

  const [currentPage, setCurrentPage] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  /*
  const handleImageLinks = (image_link) => {
    setImageLinks((prevImageLinks) => { //here prevImageLinks is the current imageLinks state
      prevImageLinks[currentPage] = image_link
      return [...prevImageLinks]
    })
  }
  */

  const handleImageS3Paths = (image_S3_path) => {
    setImageS3Paths((prevS3Paths) => { //here prevS3Paths is the current imageS3Paths state
      prevS3Paths[currentPage] = image_S3_path
      return [...prevS3Paths]
    })
  }


  const nextPage = () => {
    console.log(pages)
    console.log('currentPage')
    if (pages[currentPage]){ // if True, something is written in the text box, else nothing is written in the text box
      setCurrentPage(currentPage + 1);
      console.log(pages)
      console.log('currentPage')
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
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const navigate = useNavigate();

  const redirectToAnotherPage = () => {
    navigate('/'); // Replace '/another-page' with your desired route
  };



  const callLambdaFunction = async (event) => {
        if (!pages[currentPage]){
          toast.info('write something!!!',{
          autoClose: 1500})
          return
        }

        event.preventDefault(); // Prevents form from reloading
        console.log('clicked!!!!!')
        console.log(event)
        console.log(pages)
        console.log(pages[currentPage])
        const username = auth.user.profile.username

        const buttonId = event.nativeEvent.submitter.id
        try {
          if (buttonId == "generateImage"){
            const apiUrl = 'https://giwi4nhzuc.execute-api.us-east-1.amazonaws.com/genDalle3ImageSaveToS3';
            //const apiUrl = 'https://h72k7br90g.execute-api.us-east-1.amazonaws.com/startStepFunction'

            const data = { client_ref_id: username, prompt : pages[currentPage], character_desc : "", current_page_text : "" };

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

                console.log('abc')
                console.log(result)
                console.log(result['image_s3_paths_for_story_in_list'])

                const response = await fetch("https://ihwc8lc6n4.execute-api.us-east-1.amazonaws.com/createUrlForImage", {
                  method: 'POST',
                  mode: 'cors', // this cannot be 'no-cors'
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({images : result['image_s3_paths_for_story_in_list'] }),
                });
                const temp_url = await response.json();
                console.log(temp_url)
                console.log('temp_url')

                setImageLinks((prevImageLinks) => { //here prevImageLinks is the current imageLinks state
                  console.log('prevImageLinks')
                  console.log(prevImageLinks)
                  return [...prevImageLinks, temp_url[0]];
                })
                //handleImageLinks(temp_url[0])

                handleImageS3Paths(result['image_s3_paths_for_story_in_list'][0])

                console.log(imageLinks)
                console.log('result')
                console.log(imageS3Paths)

            }
            else {
                console.log("error")
                //const errorData = await res.json();
            }
          }
        else if (buttonId == "improveGrammar"){

          const apiUrl = 'https://1enu5amz30.execute-api.us-east-1.amazonaws.com/';
          //const apiUrl = 'https://h72k7br90g.execute-api.us-east-1.amazonaws.com/startStepFunction'

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

              console.log('abcdef')
              console.log(result["grammar_improvments"])
            }


        }
          } catch (err) {
              console.log("catched error")
              console.log(err.message)};
        }

  const savePageLambdaFunction = async (event) => {
    event.preventDefault(); // Prevents form from reloading
    console.log('clicked!!!!!')
    console.log(event)
    const username = auth.user.profile.username

    try {

      const apiUrl = 'https://2qxpvl1c62.execute-api.us-east-1.amazonaws.com/saveBookDynamo';
      //const apiUrl = 'https://qywclwlms3v3kexxwalw3ort7u0wjsfn.lambda-url.us-east-1.on.aws';
      const data = { client_reference_id: username, text_for_story_in_list : pages, image_s3_paths_for_story_in_list : imageS3Paths, book_id : bookId };

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


          }
          else {
              console.log("error")
              //const errorData = await res.json();
          }



      } catch (err) {
          console.log("catched error")
          console.log(err.message)};

  }

  // below functions are for adding character descriptions logic
  const addCharacterDescription = () => {
    setCharacterDescriptions([...characterDescriptions, ""]);  // Add a new empty description
  };

  const updateCharacterDescription = (index, value) => {

    const updatedDescriptions = [...characterDescriptions];
    updatedDescriptions[index] = value;
    setCharacterDescriptions(updatedDescriptions);
  };


      return (
        <div className={"body"}>

          <form onSubmit={callLambdaFunction} className="storybook-form">

            <div className="auth-buttons">
              <button id="improveGrammar" type="submit" >
                improve grammar
              </button>
              <button id="creativeIdeas" type="submit" >
                creative ideas
              </button>
              <button id="generateImage" type="submit" >
                Generate Image
              </button>
            {/* Moved inside the auth-buttons container */}


            <div className="topButtonsContainer">
              {/* Save Page button */}
              <button onClick={savePageLambdaFunction} className="pageStatusWidget">
                save page
              </button>
            </div>

            {/* Add Character Description + generated textareas */}
            <div className="addCharacterButtonContainer">
              <button onClick={addCharacterDescription}>
                Add Character
              </button>

              <div className="characterDescriptionContainer">
                {characterDescriptions.map((description, index) => (
                  <textarea
                    key={index}
                    /*className={`characterDescription ${isCharacterPopupOpen ? 'popup' : ''}`} */
                    className={`characterDescription ${isCharacterPopupOpen === index ? 'popup' : ''}`}
                    value={characterDescriptions[index]}
                    onChange={(event) => updateCharacterDescription(index, event.target.value)}
                    onBlur={() => setIsCharacterPopupOpen(null)}
                    onClick={() => setIsCharacterPopupOpen(index)}
                    placeholder="Click to start writing character description..."
                  />
                ))}
              </div>
            </div>




            </div>
              <div className={"bookContainer"}>
                <div className={"pageContent"}>

                  {imageLinks.length > 0 ? (
                    <img src={imageLinks[currentPage]} alt="Page" className="pageImage" />
                    ) : (
                    <p>Image will go here</p> // Optional fallback if the array is empty
                    )}

                  <textarea
                    id = 'user_text'
                    className={`editableText ${isPopupOpen ? 'popup' : ''}`} // if isPopupOpen = True, .editableText.popup inside App.css will be rendered. Else editableText in App.css will be rendered
                    value={pages[currentPage]} // Controlled component
                    onChange={(event) => {
                      const updatedPages = [...pages];
                      console.log('aaaaa', updatedPages)
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
              </div>

          </form>



          {/* Wrap save button, 'Add Character' button, and the textareas in the same container */}

</div>
      );


}
export default WritePage;
