import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TextComp from './UserText'; // Your input form component
import NewPage from './NewPage';   // The new page to render after submission
import PaymentPage from './PaymentOptions'
import WritePage from './WritePageYourself'
import PreviouslyGeneratedStories from  './PreviouslyWrittenStories'
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
      <ToastContainer /> {/* Place it here to make it available across all routes */}
        <Routes>
          {/* Define your routes */}
          <Route path="/" element={<TextComp />} />
          <Route path="/book/:bookId/:username" element={<NewPage />} />
          <Route path="/new-page" element={<NewPage />} />
          <Route path="/write-page-yourself" element={<WritePage />} />
          <Route path="/payment-options" element={<PaymentPage />} />
          <Route path="/previously_written_stories" element={<PreviouslyGeneratedStories />} />

        </Routes>
      </Router>
    </HelmetProvider>

  );
}

export default App;
