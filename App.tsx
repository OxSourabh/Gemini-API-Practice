import React, { useState, useCallback, ChangeEvent } from 'react';
import { generatePoster } from './services/geminiService';

// --- Helper Components (defined outside App to prevent re-creation on re-renders) ---

const Spinner: React.FC = () => (
  <div className="border-4 border-gray-600 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 15m0 0l-.813.904M9.813 15.904L10.627 15m-1.624-.904L9 14.125m0 0l.813-.904M9 14.125L8.187 15m1.624-.904L10.627 14.125m-1.624.904L9 13.25m0 0l-.813.904M9 13.25L8.187 14.125m1.624.904L10.627 13.25M5 3l14 14-4 4-4-4-4 4-4-4 4-4z"
    />
  </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
    />
  </svg>
);

const Footer: React.FC = () => (
  <footer className="text-center py-4 mt-8 text-gray-500">
    <p>made with ❤️‍🔥 by Sourabh</p>
  </footer>
);

// --- Main App Component ---

export default function App() {
  const initialPrompt = `Create a cinematic professional football (soccer) poster featuring the person in the foreground of the uploaded image (wearing the white shirt). Keep his original face, hair, shape, and angle exactly as in the image. Show the person in three perspectives: a super close-up portrait wearing a Manchester United away jersey 25/26, a side profile view wearing a Manchester United away jersey 25/26 with the name "Sourabh" on the back, and a full-body shot in a full football kit (Manchester United away jersey 25/26, shorts, socks, and cleats) with sponsor logos.

At the bottom, place a dynamic action scene of the player performing a powerful kick with motion blur and flying grass around. The jersey must clearly display the number "01" on the front, back, and shorts.

Use a bold dark blue stadium background with a large number "05" and the name "Sourabh" glowing behind the character. The overall style should be ultra-realistic, high-resolution, cinematic, and professional sports poster vibes.`;

  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInputFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedImageUrl(null);
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!inputFile || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const generatedImageBase64 = await generatePoster(prompt, inputFile);
      if (generatedImageBase64) {
        setGeneratedImageUrl(`data:image/png;base64,${generatedImageBase64}`);
      } else {
        throw new Error('The API did not return an image. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [inputFile, prompt]);
  
  const handleShare = useCallback(async () => {
    if (!generatedImageUrl || !navigator.share) {
      setError("Sharing is not supported on this device or no image is available.");
      return;
    }
  
    try {
      // Convert data URL to Blob
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'football-poster.png', { type: blob.type });
  
      // Check if the browser can share these files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Cinematic Football Poster',
          text: 'Check out this awesome football poster I created with AI!',
        });
      } else {
        setError("This poster can't be shared from this browser.");
      }
    } catch (err: any) {
      // Ignore AbortError which is thrown when the user cancels the share dialog
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        setError('Something went wrong while trying to share.');
      }
    }
  }, [generatedImageUrl]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">
            Cinematic Football Poster Generator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Upload a photo, describe your vision, and let AI create a stunning poster.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- Controls Panel --- */}
          <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div>
              <label className="text-lg font-semibold text-gray-200 mb-2 block">1. Upload Your Photo</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {inputImageUrl ? (
                    <img src={inputImageUrl} alt="Input preview" className="mx-auto h-48 w-auto rounded-md shadow-md" />
                  ) : (
                    <>
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
                    </>
                  )}
                  <div className="flex text-sm text-gray-500 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500 px-3 py-1 mt-2">
                      <span>{inputFile ? 'Change image' : 'Select an image'}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="prompt" className="text-lg font-semibold text-gray-200 mb-2 block">2. Describe the Poster</label>
              <textarea
                id="prompt"
                rows={10}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-200 placeholder-gray-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputFile}
              className="w-full flex items-center justify-center gap-3 py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition duration-300 ease-in-out"
            >
              {isLoading ? (
                <>
                  <Spinner /> Generating...
                </>
              ) : (
                <>
                  <WandIcon className="w-6 h-6" /> Generate Poster
                </>
              )}
            </button>
          </div>

          {/* --- Output Panel --- */}
          <div className="flex items-center justify-center p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 min-h-[50vh] lg:min-h-full">
            {isLoading && (
              <div className="text-center">
                <Spinner />
                <p className="mt-4 text-gray-400">Conjuring up your masterpiece... this may take a moment.</p>
              </div>
            )}
            {error && (
              <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg">
                <p className="font-bold">An error occurred:</p>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && generatedImageUrl && (
              <div className="w-full h-full flex flex-col items-center gap-4">
                 <img src={generatedImageUrl} alt="Generated football poster" className="w-full h-full object-contain rounded-lg shadow-2xl" />
                 {navigator.share && ( // Only show button if Web Share API is available
                    <button
                      onClick={handleShare}
                      className="mt-4 w-full max-w-xs flex items-center justify-center gap-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-md font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition duration-300 ease-in-out"
                    >
                      <ShareIcon className="w-5 h-5" />
                      Share Poster
                    </button>
                 )}
              </div>
            )}
            {!isLoading && !error && !generatedImageUrl && (
              <div className="text-center text-gray-500">
                <p className="text-xl">Your generated poster will appear here.</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}