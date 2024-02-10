import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { NextRequest, NextResponse } from "next/server";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function POST(request: NextRequest) {
  // Extract FormData from the request
  const data = await request.formData();
  // Extract the uploaded PDF file
  const file = data.get("file") as File;

  // Ensure a file is provided
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" });
  }

  // Confirm the file is a PDF
  if (file.type !== "application/pdf") {
    return NextResponse.json({ success: false, error: "File is not a PDF" });
  }

  //Load the PDF and split it into smaller documents
  const pdfLoader = new PDFLoader(file);
	  const textSplitter = new RecursiveCharacterTextSplitter({
	  chunkSize: 1000,
	  chunkOverlap: 200,
	  });
  const splitDocuments = await pdfLoader.loadAndSplit(textSplitter);
	
// Create embeddings for the documents

// Initialize the Pinecone client
  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
  apiKey: process.env.PINECONE_API_KEY ?? "",
  environment: "us-east-1-aws",
  });
  const index = pineconeClient.Index(process.env.PINECONE_INDEX_NAME);

// Store the processed documents in Pinecone 
  await PineconeStore.fromDocuments(splitDocuments, new OpenAIEmbeddings(), {
  pineconeIndex,
  maxConcurrency: 5,
  namespace: filename,
  textKey: 'text'
  });

  const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocuments, embeddings);

  // Set up the RAG model
  const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", openAIApiKey: process.env.OPENAI_API_KEY });
  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  // Generate a summary of the research document
  const response = await chain.call({
    query: "Summarize the primary arguments or findings in this research document, and format the output with likely questions as headers and answers as paragraphs in Markdown",
  });

  return NextResponse.json({ success: true, summary: response.text });
}