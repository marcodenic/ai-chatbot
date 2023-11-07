import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }
  const currentYear = new Date().getFullYear()

  // Define your system prompt message
  const systemPrompt = {
    role: 'system',
    content:
      'Extract travel details from the user\'s input, including origin, destination, and dates. Then, convert the locations to their closest airport code and structure the information in a JSON object with the keys "origin", "destination", "departure_date", and "return_date". The returned dates should always ' +
      currentYear +
      ' unless otherwise stated.'
  }
  // Define a message to instruct the model to format the output as JSON
  const jsonFormatInstruction = {
    role: 'system',
    content: '{"type": "json_object"}'
  }

  // Prepend the system prompt and JSON format instruction to the messages array
  const messagesWithSystemPrompt = [
    systemPrompt,
    jsonFormatInstruction,
    ...json.messages
  ]
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messagesWithSystemPrompt,
    temperature: 0,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages
          // {
          //   content: completion,
          //   role: 'assistant'
          // }
        ]
      }
      // await kv.hmset(`chat:${id}`, payload)
      // await kv.zadd(`user:chat:${userId}`, {
      //   score: createdAt,
      //   member: `chat:${id}`
      // })

      console.log('AI Response:', completion)
      // Assuming completion is already a JSON object with the required fields
      // Extract the data from the AI's completion
      const completionObj =
        typeof completion === 'string' ? JSON.parse(completion) : completion

      // Now, extract the travel details from the parsed object
      const { origin, destination, departure_date, return_date } = completionObj

      // Now, you'll need to pass this information to your Duffel API route
      // Here, we construct the payload for the Duffel API based on the extracted data
      const duffelPayload = {
        slices: [
          {
            origin, // e.g., 'LHR'
            destination, // e.g., 'JFK'
            departure_date // e.g., '2024-05-06'
          }
          // If there's a return flight, you'd add another object here for that slice
        ],
        passengers: [{ type: 'adult' }],
        cabin_class: null // Or whichever class is required
      }

      // Send the payload to your /search API route
      // This should be the full URL of your API route
      const API_HOST =
        process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:3000' // Example host, adjust as needed

      // Send the payload to your /search API route using the full URL
      const duffelResponse = await fetch(`${API_HOST}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duffelPayload)
      })

      // Handle the Duffel response as needed
      const searchResults = await duffelResponse.json()
      // ... further processing or storage ...
      console.log('Duffel response:', searchResults)
    }
  })

  return new StreamingTextResponse(stream)
}
