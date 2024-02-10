"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useCompletion } from "ai/react";

export default function Home() {
  // When a file is dropped in the dropzone, call the `/api/ingest-research` API to train our bot on a new PDF File
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

		setUploading(true);

		try {
      const res = await fetch('/api/ingest-research', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        alert('File uploaded successfully!');
      } else {
        alert('File upload failed!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file.');
    } finally {
      setUploading(false);
    }
  }, []);

  // Configure react-dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  // Vercel AI hook for generating completions through an AI model
  const { completion, input, isLoading, handleInputChange, handleSubmit } =
    useCompletion({
      api: "/api/chat-research",
    });

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1>AI-Powered Research Assistant</h1>
      <div
        {...getRootProps({
          className:
            "dropzone bg-gray-300 border border-gray-800 p-10 rounded-md hover:bg-gray-800 transition-colors duration-200 ease-in-out cursor-pointer",
        })}
      >
        <input {...getInputProps()} />
        <p>Drag 'n' drop a PDF here, or click to select a file</p>
      </div>

      <div className="mx-auto w-full items-center max-w-md py-24 flex flex-col stretch">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className=" w-full max-w-md text-black border border-gray-300 rounded shadow-xl p-2"
            value={input}
            placeholder="Ask a question..."
            onChange={handleInputChange}
          />

          <button
            disabled={isLoading}
            type="submit"
            className="py-2 border rounded-lg bg-gray-300 text-sm px-6"
          >
            Submit
          </button>

          <p className="text-center">
            Completion result: {completion === "" ? "Awaiting response..." : completion}
          </p>
        </form>
      </div>
    </main>
  );
}