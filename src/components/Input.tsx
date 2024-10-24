"use client";

import React, { useState } from "react";
import SpeechTiming from "./Test";

const TestPage: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState("");

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  return (
    <div className='p-4 max-w-2xl mx-auto space-y-6 text-black'>
      <div>
        <label className='block mb-2 font-medium text-black'>
          Upload Audio File:
        </label>
        <input
          type='file'
          accept='audio/*'
          onChange={handleAudioUpload}
          className='block w-full text-white
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100'
        />
      </div>

      <div>
        <label className='block mb-2 font-medium text-black'>
          Text Content:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className='w-full px-3 py-2 border rounded-md text-black bg-white'
          rows={4}
          placeholder='Enter the text that matches the audio...'
        />
      </div>

      {audioFile && text && (
        <SpeechTiming audioUrl={URL.createObjectURL(audioFile)} text={text} />
      )}
    </div>
  );
};

export default TestPage;
