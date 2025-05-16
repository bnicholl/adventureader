import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
//import './styles.css';
import styles from './styles.modules.css';
import { useNavigate } from 'react-router-dom';
import { FacebookShareButton, FacebookIcon } from 'react-share';
import { Helmet } from "react-helmet-async";
import { useParams } from 'react-router-dom';
import TextToSpeech from './TextToSpeech'

// to do 1. get rid of anything in [brackets]   2. ensure both sentences have same length(might wanna fo this on backend) 3. put widget saying how many errors are on page

function NewPage() {
  const funMessages = ["🎉 Great job!", "🌟 You rock!", "👏 Well done!", "🥳 Awesome!", "💥 Fantastic!"];
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const [text, setText] = useState("Hello! Press the button to hear this text.");
  const textToSpeechRef = useRef();

  //const gramatical_error_story_text = useRef();
  const [gramatical_error_story_text, setGramaticalErrorStoryText] = useState([]);

  //const story_text = useRef();
  const [story_text, setStoryText] = useState(["..loading"]);

  //const image_links = useRef();
  const [image_links, setImageLinks] = useState(['..loading']);

  const [thereAreGramaticallyIncorrectPages, setThereAreGramaticallyIncorrectPages] = useState(false);

  const location = useLocation();

  const { bookId } = useParams();
  const { username } = useParams();

  //const { story_text, image_links, gramatical_error_story_text} = location.state || {};
  useEffect(() => {
    const fetchDataFromDynamoDB = async () => {

        const data = { client_reference_id: username, book_id : bookId };
        const response = await fetch("https://6cqkj6h200.execute-api.us-east-1.amazonaws.com/queryBookFromDynamo", {
          method: 'POST',
          mode: 'cors', // this cannot be 'no-cors'
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });


        const res = await response.json();
        const book_data = res["Item"]


        // everything below up until the next // should be put in NewPage.js
        let pages = []
        let grammaticalErrorPages = []
        let imageS3Paths = []
        for (let i = 0; i < book_data['pages_in_book']; i++) {
          pages.push(book_data[`page ${i}`])
          if (book_data[`grammatical_error_page ${i}`]){
            grammaticalErrorPages.push(book_data[`grammatical_error_page ${i}`])
          }
          imageS3Paths.push(book_data[`image ${i}`])

        }


        const response_for_urls = await fetch("https://ihwc8lc6n4.execute-api.us-east-1.amazonaws.com/createUrlForImage", {
          method: 'POST',
          mode: 'cors', // this cannot be 'no-cors'
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({image_s3_paths_for_story_in_list : imageS3Paths }),
        });
        const temp_images_urls_ = await response_for_urls.json();
        const temp_images_urls = temp_images_urls_["urls"]

        //gramatical_error_story_text.current = grammaticalErrorPages
        setGramaticalErrorStoryText(grammaticalErrorPages)
        //story_text.current = pages
        setStoryText(pages)
        console.log("aaasss")
        console.log(story_text)
        console.log(gramatical_error_story_text)
        //image_links.current = temp_images_urls
        setImageLinks(temp_images_urls)
        //
      }
      fetchDataFromDynamoDB();

  }, []);










  console.log('gramatical_error_story_text', gramatical_error_story_text)
  console.log('story_text', story_text)

  const [amountOfErrorsGivenPage, setAmountOfErrorsGivenPage] = useState(new Array(story_text.length).fill(0));
  const [indicesWithErrors, setIndicesWithErrors] = useState([]);

  useEffect(() => {
  // here we simply loop through both story_text and gramatical_error_story_text, and as soon as a word or character is different
  // in gramatical_error_story_text, we keep track of the indices of those characters.
    var amount_of_errors_given_page = []
    var indices_with_errors = []

    // if this is true, create a gramatical error must hav e been checked
    if (gramatical_error_story_text.length > 0){
      setThereAreGramaticallyIncorrectPages(true)
      //var there_are_gramatically_incorrect_pages = true
      for (let page_iterator = 0; page_iterator < story_text.length; page_iterator ++) {
        //Example of story_text_words and gramatical_error_story_text_words = [the, dog, ran]
        var story_text_words = story_text[page_iterator].split(' ')
        var gramatical_error_story_text_words = gramatical_error_story_text[page_iterator].split(' ')

        var indices_with_errors_for_page = []
        var amount_of_errors_given_page_int = 0
        for (let word_iterator = 0; word_iterator < story_text_words.length; word_iterator++){

          if (story_text_words[word_iterator] != gramatical_error_story_text_words[word_iterator]){

            indices_with_errors_for_page.push(word_iterator)
            amount_of_errors_given_page_int += 1
          }
        }
        indices_with_errors.push(indices_with_errors_for_page)
        amount_of_errors_given_page.push(amount_of_errors_given_page_int)
      }
      // Update the state after calculations
      setIndicesWithErrors(indices_with_errors);

      setAmountOfErrorsGivenPage(amount_of_errors_given_page);
    }
  }, [gramatical_error_story_text])


  const [currentPage, setCurrentPage] = useState(0);
  //const [clickedWords, setClickedWords] = useState([]); // NEW To track clicked words
  // Example for below: if we have 3 pages, below object is instantied like so: [[], [], []]
  const [clickedWords, setClickedWords] = useState(Array.from({ length: story_text.length }, () => []));
  useEffect(() => {
    setClickedWords(Array.from({ length: story_text.length }, () => []));
  }, [story_text.length]); // Re-run effect when story_text.length changes

  const handleWordClick = (word, index) => {

    setClickedWords((prevClickedWords) => { //here prevClickedWords is the current clickedWords state
      // Check if the word at this index has already been clicked
      //const pageKey = `${currentPage}-${index}`; // Unique key based on page and index

      if (!prevClickedWords[currentPage].includes(index)) {// ! is the not operator. So if pageKey not in clickedWords

        if (indicesWithErrors[currentPage].includes(index)){ //this if statement checks to see if the clicked word is the gramaitcally incorrect words
          amountOfErrorsGivenPage[currentPage] -= 1 // if it is subtract from the amount of errors widget on UI.
          const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
          setPopupMessage(randomMessage);
          setShowPopup(true);
          // Hide popup after 2 seconds
          setTimeout(() => {
            setShowPopup(false);
          }, 2000);
        }
        prevClickedWords[currentPage].push(index)
        return [...prevClickedWords]; // Note: I have to add this like so because we need to create a new list for react to re render
      }
      return prevClickedWords; // No action if the word was already clicked
    });
  };


  // Function to handle when a user clicks on the widget that shows where the gramatical error is
  // Bascially, instead of adding one page-index at a time, like the above func does, this just adds all of them,
  //thus showing the user all of the correct and incorrect words via grren and red
  const handleShowError = (word, index) => {
    if (amountOfErrorsGivenPage[currentPage] > 0){
      amountOfErrorsGivenPage[currentPage] -= 1
      var clicked_words = []

      for (let word_iterator = 0; word_iterator < story_text[currentPage].length; word_iterator ++) {

        clicked_words.push(word_iterator)

      clickedWords[currentPage] =  clicked_words
      console.log('aaaaa clickedWords[currentPage]')
      console.log(clickedWords[currentPage])
      setClickedWords([...clickedWords]) // Note: I have to add this like so because we need to create a new list for react to re render

      }
    }
  }


  const nextPage = () => {
    if (currentPage < story_text.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const navigate = useNavigate();

  const redirectToAnotherPage = () => {
    textToSpeechRef.current?.stopSpeech(); // Directly stop speech if ref is set

    navigate('/'); // Replace '/another-page' with your desired route
  };


  // NEW Split the page content into individual words
  const renderSentence = (sentence, correct_sentence) => {
    const correct_sentence_ = correct_sentence.split(' ')
    const words = sentence.split(' ');
    return words.map((word, index) => {
      //const pageKey = `${currentPage}-${index}`; // Unique key based on page and index
      const isClicked = clickedWords[currentPage].includes(index); // here is I index clickedWords, I can make it faster
      //const isClicked = clickedWords.includes(pageKey); // here is I index clickedWords, I can make it faster

      //if (index == 3){
      console.log('abcde', clickedWords)

      // if this is true, no gramatically incorrect page was created
      if (indicesWithErrors.length < 1){
        return (
          <span
            key={index}
            //onClick={() => handleWordClick(word, index)}
            style={{
              cursor: 'pointer',
              color: 'black',
              fontWeight: 'normal',
            }}
          >
            {word}{" "}
          </span>
         );
      }

      else if (indicesWithErrors[currentPage].includes(index)){
        console.log("wooop")
        console.log(isClicked)
        //if (isClicked){
        //  amountOfErrorsGivenPage[currentPage] -= 1
        //  console.log('amountOfErrorsGivenPage[currentPage]')
        //  console.log(amountOfErrorsGivenPage[currentPage])
        //}
        return (
          <span
            key={index}
            onClick={() => handleWordClick(word, index)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              color: isClicked ? '#4CAF50' : 'black',
              fontWeight: isClicked ? 'bold' : 'normal',
            }}
          >

            {isClicked ? correct_sentence_[index] : word}{" "}
            {showPopup && (
              <div
                style={{
                  position: 'absolute',
                  top: '-100px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#FFD700',
                  color: '#FF1493',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontFamily: '"Comic Sans MS", cursive, sans-serif',
                  fontSize: '14px',
                  opacity: 1,
                  animation: 'popFade 2s forwards',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                {popupMessage}
              </div>
            )}
          </span>
        );
       }
       else{
         return (
           <span
             key={index}
             onClick={() => handleWordClick(word, index)}
             style={{
               cursor: 'pointer',
               color: isClicked ? 'red' : 'black',
               fontWeight: isClicked ? 'bold' : 'normal',
             }}
           >
             {isClicked ? word : word}{" "}
           </span>
          );
       }



    });
  };



  // URL to be shared (you might want to replace this with a dynamically generated URL)
  //const shareUrl = window.location.href;
  const shareUrl = `${window.location.origin}/book/${bookId}/${username}`; // Adjust URL to your route logic
  console.log("share url")
  console.log(shareUrl)
  const shareText = story_text ? story_text[currentPage] : "Check out this story I created!";
  console.log(shareText)
  console.log("image_links[0]")
  console.log(image_links[0])
  return (

  <>
  {/* Helmet for setting Open Graph meta tags dynamically */}
  <Helmet>
    <title>{"AdventuReader"}</title>
    <meta property="og:title" content={"adventuReader"} />
    <meta property="og:description" content={"Generate your own childrens story books!"} />
    <meta property="og:image" content={"https://logos-for-company.s3.us-east-1.amazonaws.com/Gemini_Generated_Image_4s596s4s596s4s59.jpg"} />
    <meta property="og:url" content={shareUrl} />
  </Helmet>

    <div className={"body"}>
    {/* Facebook Share Button in the top-left corner */}
      <div className="facebook-share-container">
        <FacebookShareButton url={shareUrl} quote={shareText}>
          <FacebookIcon size={40} round />
        </FacebookShareButton>
      </div>

    <div className={"bookContainer"}>
      <div className={"pageContent"}>
        <img src={image_links[currentPage]} alt="Page" className="pageImage" />

        {thereAreGramaticallyIncorrectPages? (
          <p className="styles.pageText">
            {renderSentence(gramatical_error_story_text[currentPage], story_text[currentPage])}
          </p>
        )
        : (
          <p className="styles.pageText">
            {renderSentence(story_text[currentPage], story_text[currentPage])}
          </p>
          )
        }

      </div>

      <div className="navigation">
        <button onClick={prevPage} disabled={currentPage === 0}>
          Previous
        </button>
        <button onClick={nextPage} disabled={currentPage === story_text.length - 1}>
          Next
        </button>

        <button onClick={redirectToAnotherPage}>
          create another story
        </button>


        <TextToSpeech ref={textToSpeechRef} sampleText={story_text[currentPage]}  />

      </div>
    </div>


    <div>
      {amountOfErrorsGivenPage[currentPage] > 0 && (
        <button className="pageStatusWidget" onClick={handleShowError} >
          Errors in text: {amountOfErrorsGivenPage[currentPage]}
        </button>
      )}
    </div>


  </div>

  </>


  );
}


export default NewPage;
