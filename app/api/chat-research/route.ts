import { NextRequest, NextResponse } from "next/server";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { CallbackManager } from "langchain/callbacks";

export async function POST(request: NextRequest) {
  // Parse the JSON body from the request
  const body = await request.json();

  // Initialize the Pinecone Client
  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: "us-east-1-aws",
  });
  const index = pineconeClient.Index(process.env.PINECONE_INDEX_NAME);

  // Prepare the vector store with the Pinecone index
  const vectorStore = new PineconeStore(new OpenAIEmbeddings(), { index });

  // Set up the OpenAI model
  const openAIModel = new OpenAI({
    modelName: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a Langchain chain for Q&A
  const chain = new VectorDBQAChain(openAIModel, vectorStore);

  // Process the query and generate a response
  const response = await chain.call({ query: body.prompt });

  return NextResponse.json({ response });
}