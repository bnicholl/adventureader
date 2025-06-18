import React, { useState, useRef, useEffect } from 'react';

import { useAuth } from "react-oidc-context";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function FreeLibrary() {
  console.log('book_objects')
  const times_we_query_books = useRef(0);
  const booksRef = useRef([]); // this stores all books where the amount of generated pages equals teh amount of pages teh book should be
  const allBooksRef = useRef([]); // this stoes all most recent books
  const [username, setUsername] = useState("google_117577597431720546451");

  const [books, setBooks] = useState([]);
  const navigate = useNavigate();
  const auth = useAuth();


  console.log('book_objects')

  //const username = auth.user.profile.username // i create a cont, username here because the below
  //setUsername(auth.user.profile.username) // setUsername wont set until after the below code runs

  useEffect(() => {
    const fetchDataFromDynamoDB = async () => {

      toast.info('loading free books!!',{
      });

      try {

        const data = { client_reference_id: username };
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
        const book_objects = res["Items"]

        //const noErrorList = book_objects.filter(item => item.error === "none");

        console.log('book_objects')

        // Sort the data by date in descending order
        book_objects.sort((a, b) => new Date(b.last_save) - new Date(a.last_save));

        // Extract the 10 most recent dates
        let nine_most_recent_books = book_objects.slice(0, 30)

        for (let i = 0; i < nine_most_recent_books.length; i++) {

          if (times_we_query_books.current === 0){
            allBooksRef.current.push(nine_most_recent_books[i].book_id);
          }

          let pages_in_book = Number(nine_most_recent_books[i]['pages_in_book'])

          // If I really want to, I can get rid of nine_most_recent_books and loop through book_objects, then put another if statement inside the below if statement, and check if i < max_amount_of_books_on_ui.
          if (!booksRef.current.includes(nine_most_recent_books[i].book_id) && nine_most_recent_books[i][`page ${pages_in_book - 1}`] && nine_most_recent_books[i][`error`] === 'none' && nine_most_recent_books[i][`pages_in_book`]>= 5){

              //////////
              const response = await fetch("https://ihwc8lc6n4.execute-api.us-east-1.amazonaws.com/createUrlForImage", {
                method: 'POST',
                mode: 'cors', // this cannot be 'no-cors'
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({image_s3_paths_for_story_in_list : [nine_most_recent_books[i]["image 0"]] }),
              });
              const temp_url_ = await response.json();
              const temp_url = temp_url_["urls"]
              /////////////
              setBooks((prevBooks) => {

                nine_most_recent_books[i]['temporary_url'] = temp_url
                booksRef.current.push(nine_most_recent_books[i].book_id);

                prevBooks.push(nine_most_recent_books[i])
                return [...prevBooks];

              })
            }
          }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
      console.log(times_we_query_books.current)
      console.log('times_we_query_books')
      times_we_query_books.current += 1

    }

    fetchDataFromDynamoDB()
  }, [])


  const handleImageClick = async (book_data) => {

    const book_id = book_data['book_id']

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



    //const response = await fetch("https://ihwc8lc6n4.execute-api.us-east-1.amazonaws.com/createUrlForImage", {
    //  method: 'POST',
    //  mode: 'cors', // this cannot be 'no-cors'
    //  headers: {
    //      'Accept': 'application/json',
    //      'Content-Type': 'application/json',
    //  },
    //  body: JSON.stringify({image_s3_paths_for_story_in_list : imageS3Paths }),
    //});
    //const temp_images_urls = await response.json();
    //
    //console.log('temp_images_urls', temp_images_urls)
    //navigate(`/book/${book_id}/${username}`, { state:  {story_text: pages, image_links : temp_images_urls, gramatical_error_story_text: grammaticalErrorPages}  });
    navigate(`/book/${book_id}/${username}`, { state:  {story_text: pages, gramatical_error_story_text: grammaticalErrorPages}  });

    //alert(`You clicked on: ${book_data}`);
  };

  return (
    <div className="background-wrapper">
    <div className="gallery-container">
        <div className="auth-buttons">
          <button onClick={() => navigate('/')}>Create Another Story</button>
        </div>

        {books.map((image) => (
          <img
            key={image.book_id}
            src={image.temporary_url}
            alt={image.last_save}
            className="image"
            onClick={() => handleImageClick(image)}
          />
        ))}
    </div>
    </div>
  );

}

export default FreeLibrary;
