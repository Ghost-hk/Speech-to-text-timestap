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
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getPauseDuration = (word: string, nextWord: string | null): number => {
    // Pause after punctuation marks
    if (word.endsWith(".")) return 0.5; // Longer pause for end of sentences
    if (word.endsWith(",")) return 0.25; // Medium pause for commas
    if (word.endsWith(";") || word.endsWith(":")) return 0.35; // Medium-long pause for semicolons
    if (word.endsWith("?") || word.endsWith("!")) return 0.5; // Longer pause for questions/exclamations

    // Check for natural phrase boundaries
    if (nextWord && isPhraseBoundary(word, nextWord)) return 0.2;

    // Short pause between words
    return 0.1;
  };

  const isPhraseBoundary = (word: string, nextWord: string): boolean => {
    // Common conjunctions and prepositions that often indicate phrase boundaries
    const boundaryWords = [
      "and",
      "but",
      "or",
      "nor",
      "for",
      "yet",
      "so",
      "after",
      "before",
      "while",
    ];
    return boundaryWords.includes(nextWord.toLowerCase());
  };

  const getWordTiming = (word: string): number => {
    // Base timing on syllables instead of just characters
    const syllables = countSyllables(word);
    // Average syllable duration (typical speech is 4-6 syllables per second)
    const baseDuration = syllables * 0.15;

    // Adjust for word complexity
    if (word.length > 8) return baseDuration * 1.2; // Longer words need more time
    if (word.length <= 2) return baseDuration * 0.8; // Short words are quicker

    return baseDuration;
  };

  const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Remove punctuation
    word = word.replace(/[.,!?;:]/, "");

    // Count vowel groups as syllables
    const vowels = "aeiouy";
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) count++;
      previousWasVowel = isVowel;
    }

    // Handle silent e
    if (word.endsWith("e")) count--;

    // Handle special cases
    if (
      word.endsWith("le") &&
      word.length > 2 &&
      !vowels.includes(word[word.length - 3])
    )
      count++;

    return count || 1;
  };

  const processText = () => {
    if (!text) return;

    const startTime = performance.now();
    const wordsArray = text.split(/\s+/);
    const audioDuration = audioRef.current?.duration || 0;

    let currentTime = 0;
    const timings = wordsArray.map((word, index) => {
      const nextWord =
        index < wordsArray.length - 1 ? wordsArray[index + 1] : null;

      // Calculate word duration based on syllables and complexity
      const wordDuration = getWordTiming(word);

      // Add pause after the word
      const pauseDuration = getPauseDuration(word, nextWord);

      const timing = {
        word,
        start: currentTime,
        end: currentTime + wordDuration,
        duration: wordDuration,
        pause: pauseDuration,
        characters: word.length,
        syllables: countSyllables(word),
      };

      currentTime += wordDuration + pauseDuration;
      return timing;
    });

    // Scale timings to match audio duration
    const totalCalculatedDuration = currentTime;
    const scaleFactor = audioDuration / totalCalculatedDuration;

    const scaledTimings = timings.map((timing) => ({
      ...timing,
      start: timing.start * scaleFactor,
      end: timing.end * scaleFactor,
      duration: timing.duration * scaleFactor,
      pause: timing.pause * scaleFactor,
    }));

    const endTime = performance.now();
    setMetrics({
      totalTime: endTime - startTime,
      wordsProcessed: wordsArray.length,
      averageTimePerWord: (endTime - startTime) / wordsArray.length,
      totalDuration: audioDuration,
      averageWordDuration: audioDuration / wordsArray.length,
      /* totalSyllables: timings.reduce((sum, t) => sum + t.syllables, 0) */
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
      <audio
        ref={audioRef}
        controls
        onLoadedData={handleAudioLoad}
        onTimeUpdate={handleTimeUpdate}
        className='w-full'
        src={audioUrl}
      />

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
