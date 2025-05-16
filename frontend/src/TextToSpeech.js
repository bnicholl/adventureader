import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const TextToSpeech = forwardRef(({ sampleText, stopSpeechTrigger }, ref) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null); // Reference to track the utterance

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      console.log('availableVoices', availableVoices);
      const englishVoices = availableVoices.filter(voice =>
        ['Samantha', 'Fred'].includes(voice.name) && voice.lang === 'en-US')
        .filter((value, index, self) =>
          index === self.findIndex((v) => v.name === value.name && v.lang === value.lang)
        );
      setVoices(englishVoices);
      setSelectedVoice(englishVoices[1]); // Default to a common voice
    };

    speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
  }, []);

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      stopSpeech(); // Stop any ongoing speech before starting a new one

      const speech = new SpeechSynthesisUtterance(sampleText);
      speech.voice = selectedVoice;
      speech.rate = 1;
      speech.pitch = 1;
      speech.volume = 1;

      utteranceRef.current = speech;
      window.speechSynthesis.speak(speech);
      setIsSpeaking(true);

      speech.onend = () => setIsSpeaking(false);
    } else {
      alert("Your browser does not support text-to-speech.");
    }
  };

  const stopSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Stop speech when `stopSpeechTrigger` changes (e.g., user navigates pages)
  useEffect(() => {
    stopSpeech();
  }, [stopSpeechTrigger]);

  // Expose the stopSpeech function to the parent component via ref
  useImperativeHandle(ref, () => ({
    stopSpeech
  }));

  return (
    <div>
      <button onClick={handleSpeech} disabled={isSpeaking}>
        {isSpeaking ? "Reading..." : "Read Text Aloud"}
      </button>
      <button onClick={stopSpeech} disabled={!isSpeaking}>
        Stop
      </button>

      <div>
        <label>
          Select Voice:
          <select
            value={selectedVoice?.name || ""}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              setSelectedVoice(voice);
            }}
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
});

export default TextToSpeech;
