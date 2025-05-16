import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
//import './styles.css';
import styles from './styles.modules.css';
import { useNavigate } from 'react-router-dom';

// to do 1. get rid of anything in [brackets]   2. ensure both sentences have same length(might wanna fo this on backend) 3. put widget saying how many errors are on page

function NewPage() {

  const [thereAreGramaticallyIncorrectPages, setThereAreGramaticallyIncorrectPages] = useState(false);

  const location = useLocation();
  //const { inputVal, inputVal2, story_text, image_links, gramatical_error_story_text, credits_to_subtract} = location.state || {};
  const { username, bookId} = location.state || {};



  const [story_text, setStoryText] = useState(["waiting on story"]);
  const [image_links, setImageLinks] = useState([]);
  const [gramatical_error_story_text, setGramaticalErrorStoryText] = useState(["waiting on story"]);
  // #######################################
  useEffect(() => {
    const fetchDataFromDynamoDB = async () => {
      try {

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
        console.log("printing res")
        console.log(res)

        if (res["page 0"]){
          console.log("page exist!")
          setStoryText((prevStoryText) => { //here prevStoryText is the current story_text state
            prevStoryText.push(res["page 0"])
            return [...prevStoryText]; // Note: I have to add this like so because we need to create a new list for react to re render
          })
          setImageLinks((prevImageLinks) => { //here prevStoryText is the current story_text state
            prevImageLinks.push(res["image 0"])
            return [...prevImageLinks]; // Note: I have to add this like so because we need to create a new list for react to re render
          })
        }
        if (res["grammatical_error_page 0"]){
          setGramaticalErrorStoryText((prevGramaticalErrorStoryText) => { //here prevStoryText is the current story_text state
            prevGramaticalErrorStoryText.push(res["grammatical_error_page 0"])
            return [...prevGramaticalErrorStoryText]; // Note: I have to add this like so because we need to create a new list for react to re render
          })
        }

        //image_links = res["image 0"]

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchDataFromDynamoDB(); // Call once on mount

    // Polling every X seconds
    const interval = setInterval(fetchDataFromDynamoDB, 5000); // Adjust the interval (e.g., 5000ms = 5 seconds)

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Block rendering until data is loaded
  //if (!isDataLoaded) {
  //  return <div>Loading...</div>;
  //}
  // #######################################



  console.log('gramatical_error_story_text', gramatical_error_story_text)
  console.log('story_text', story_text)

  const [amountOfErrorsGivenPage, setAmountOfErrorsGivenPage] = useState(new Array(story_text.length).fill(0));
  const [indicesWithErrors, setIndicesWithErrors] = useState([]);

  // I would like to move this to the backend if possible
  useEffect(() => {
  // here we simply loop through both story_text and gramatical_error_story_text, and as soon as a word or character is different
  // in gramatical_error_story_text, we keep track of the indices of those characters.
    var amount_of_errors_given_page = []
    var indices_with_errors = []
    console.log('length', gramatical_error_story_text.length)
    // if this is true, create a gramatical error must hav e been checked
    if (gramatical_error_story_text.length > 0){
      setThereAreGramaticallyIncorrectPages(true)
      //var there_are_gramatically_incorrect_pages = true
      for (let page_iterator = 0; page_iterator < story_text.length; page_iterator ++) {
        //Example of story_text_words and gramatical_error_story_text_words = [the, dog, ran]
        console.log("woooooootttttyyyyy")
        console.log(story_text)
        console.log(gramatical_error_story_text)
        var story_text_words = story_text[page_iterator].split(' ')
        var gramatical_error_story_text_words = gramatical_error_story_text[page_iterator].split(' ')

        var indices_with_errors_for_page = []
        var amount_of_errors_given_page_int = 0
        for (let word_iterator = 0; word_iterator < story_text_words.length; word_iterator++){

          if (story_text_words[word_iterator] != gramatical_error_story_text_words[word_iterator]){
            console.log('qqqqqqq', story_text_words[word_iterator])
            console.log('ppppppp', gramatical_error_story_text_words[word_iterator])
            indices_with_errors_for_page.push(word_iterator)
            amount_of_errors_given_page_int += 1
          }
        }
        indices_with_errors.push(indices_with_errors_for_page)
        amount_of_errors_given_page.push(amount_of_errors_given_page_int)
      }
      // Update the state after calculations
      setIndicesWithErrors(indices_with_errors);
      console.log('indices_with_errors', indices_with_errors)
      setAmountOfErrorsGivenPage(amount_of_errors_given_page);
    }
  }, [story_text, gramatical_error_story_text])


  const pages = story_text


  const [currentPage, setCurrentPage] = useState(0);
  //const [clickedWords, setClickedWords] = useState([]); // NEW To track clicked words
  // Example for below: if we have 3 pages, below object is instantied like so: [[], [], []].   I actually can just instante with [] since i'm changing code
  const [clickedWords, setClickedWords] = useState(Array.from({ length: story_text.length }, () => []));
  useEffect(() => {
    setClickedWords((prev) => [...prev, []]); // Appends the new value
  }, [story_text]);

  const handleWordClick = (word, index) => {

    setClickedWords((prevClickedWords) => { //here prevClickedWords is the current clickedWords state
      // Check if the word at this index has already been clicked
      //const pageKey = `${currentPage}-${index}`; // Unique key based on page and index
      console.log('prevClickedWords[currentPage]')
      console.log(prevClickedWords[currentPage])
      console.log('clickedWords[currentPage]')
      console.log(clickedWords[currentPage])
      if (!prevClickedWords[currentPage].includes(index)) {// ! is the not operator. So if pageKey not in clickedWords

        if (indicesWithErrors[currentPage].includes(index)){ //this if statement checks to see if the clicked word is the gramaitcally incorrect words
          amountOfErrorsGivenPage[currentPage] -= 1 // if it is subtract from the amount of errors widget on UI.
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
    if (currentPage < pages.length - 1) {
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
    navigate('/'); // Replace '/another-page' with your desired route
  };


  // NEW Split the page content into individual words
  const renderSentence = (sentence, correct_sentence) => {

    const correct_sentence_ = correct_sentence.split(' ')
    const words = sentence.split(' ');
    //const correct_sentence_ = ["we", "are"]
    //const words = ["we", "are"]




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
              cursor: 'pointer',
              color: isClicked ? 'green' : 'black',
              fontWeight: isClicked ? 'bold' : 'normal',
            }}
          >
            {isClicked ? correct_sentence_[index] : word}{" "}
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


  return (

    <div className={"body"}>
    <div className={"bookContainer"}>
      <div className={"pageContent"}>
        <img src={image_links[currentPage]} alt="Page" className="pageImage" />

        {thereAreGramaticallyIncorrectPages? (
          <p className="styles.pageText">
            {renderSentence(gramatical_error_story_text[currentPage], pages[currentPage])}
          </p>
        )
        : (
          <p className="styles.pageText">
            {renderSentence(pages[currentPage], pages[currentPage])}
          </p>
          )
        }

      </div>

      <div className="navigation">
        <button onClick={prevPage} disabled={currentPage === 0}>
          Previous
        </button>
        <button onClick={nextPage} disabled={currentPage === pages.length - 1}>
          Next
        </button>

        <button onClick={redirectToAnotherPage}>
          create another story
        </button>

      </div>
    </div>


    <div>
      <button className="pageStatusWidget" onClick={handleShowError}>
        Errors in text: {amountOfErrorsGivenPage[currentPage]}
      </button>
    </div>


    </div>


  );
}

//<div className="pageStatusWidget">
//  <span>errors in text: {amountOfErrorsGivenPage[currentPage]} </span>
//</div>

export default NewPage;
