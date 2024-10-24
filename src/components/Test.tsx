"use client";

import React, { useState, useRef } from "react";

interface WordTiming {
  word: string;
  start: number;
  end: number;
  duration: number;
  characters: number;
}

interface Props {
  audioUrl: string;
  text: string;
}

interface ProcessingMetrics {
  totalTime: number;
  wordsProcessed: number;
  averageTimePerWord: number;
  totalDuration: number;
  averageWordDuration: number;
}

const SpeechTiming: React.FC<Props> = ({ audioUrl, text }) => {
  const [words, setWords] = useState<WordTiming[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const processText = () => {
    if (!text) return;

    const startTime = performance.now();

    const wordsArray = text.split(/\s+/);
    const audioDuration = audioRef.current?.duration || 0;

    const totalCharacters = wordsArray.reduce(
      (sum, word) => sum + word.length,
      0
    );
    const averageTimePerChar = audioDuration / totalCharacters;

    let currentTime = 0;
    const timings = wordsArray.map((word) => {
      const wordDuration = word.length * averageTimePerChar;
      const timing = {
        word,
        start: currentTime,
        end: currentTime + wordDuration,
        duration: wordDuration,
        characters: word.length,
      };
      currentTime += wordDuration;
      return timing;
    });

    const scaleFactor = audioDuration / currentTime;
    const scaledTimings = timings.map((timing) => ({
      ...timing,
      start: timing.start * scaleFactor,
      end: timing.end * scaleFactor,
      duration: timing.duration * scaleFactor,
    }));

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    setMetrics({
      totalTime: processingTime,
      wordsProcessed: wordsArray.length,
      averageTimePerWord: processingTime / wordsArray.length,
      totalDuration: audioDuration,
      averageWordDuration: audioDuration / wordsArray.length,
    });

    setWords(scaledTimings);
  };

  const handleAudioLoad = () => {
    if (audioRef.current) {
      processText();
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime;
    const wordElements = document.querySelectorAll(".word");

    words.forEach((word, index) => {
      const element = wordElements[index] as HTMLElement;
      if (element) {
        if (currentTime >= word.start && currentTime <= word.end) {
          element.classList.add("bg-blue-200");
          element.classList.add("text-black");
        } else {
          element.classList.remove("bg-blue-200");
          element.classList.remove("text-black");
        }
      }
    });
  };

  return (
    <div className='p-4 space-y-4 text-black'>
      {/* Audio player */}
      <audio
        ref={audioRef}
        controls
        onLoadedData={handleAudioLoad}
        onTimeUpdate={handleTimeUpdate}
        className='w-full'
        src={audioUrl}
      />

      {/* Processing Metrics */}
      {metrics && (
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h3 className='font-bold mb-2 text-black'>Processing Metrics:</h3>
          <div className='grid grid-cols-2 gap-4 text-sm text-black'>
            <div>
              <p>Processing Time: {metrics.totalTime.toFixed(2)}ms</p>
              <p>Words Processed: {metrics.wordsProcessed}</p>
              <p>
                Average Processing Time per Word:{" "}
                {metrics.averageTimePerWord.toFixed(2)}ms
              </p>
            </div>
            <div>
              <p>Total Audio Duration: {metrics.totalDuration.toFixed(2)}s</p>
              <p>
                Average Word Duration: {metrics.averageWordDuration.toFixed(3)}s
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Words display */}
      <div className='p-4 border rounded-lg bg-white shadow-sm'>
        <div className='flex flex-wrap gap-2'>
          {words.map((word, index) => (
            <span
              key={index}
              className='word px-2 py-1 rounded transition-colors duration-200 text-black hover:bg-gray-100'
              title={`Duration: ${word.duration.toFixed(3)}s`}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>

      {/* Word timings table */}
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-4 py-2 text-left text-black font-semibold'>
                Word
              </th>
              <th className='px-4 py-2 text-left text-black font-semibold'>
                Characters
              </th>
              <th className='px-4 py-2 text-left text-black font-semibold'>
                Start (s)
              </th>
              <th className='px-4 py-2 text-left text-black font-semibold'>
                End (s)
              </th>
              <th className='px-4 py-2 text-left text-black font-semibold'>
                Duration (s)
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {words.map((word, index) => (
              <tr key={index} className='hover:bg-gray-50'>
                <td className='px-4 py-2 text-black'>{word.word}</td>
                <td className='px-4 py-2 text-black'>{word.characters}</td>
                <td className='px-4 py-2 text-black'>
                  {word.start.toFixed(3)}
                </td>
                <td className='px-4 py-2 text-black'>{word.end.toFixed(3)}</td>
                <td className='px-4 py-2 text-black'>
                  {word.duration.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpeechTiming;
