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
      goSearch(completion)
    }
  })

  const goSearch = async (completion: string) => {
    const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:3000'
    console.log('API_HOST', API_HOST)

    // Convert your completion object to match the expected API structure
    const comp = JSON.parse(completion)
    const requestBody = {
      slices: [
        {
          origin: comp.origin,
          destination: comp.destination,
          departure_date: comp.departure_date

          // Any other slice-related information needed by the API
        }
        // ... handle return slice if needed
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: null // or any other class as per your completion object or defaults
    }

    //console.log('completion', completion)
    console.log('requestBody', requestBody)
    //console.log('JSON.stringify(requestBody)', JSON.stringify(requestBody))
    const res = await fetch(`${API_HOST}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    const data = await res.json()
    console.log('data', data)
  }

  return new StreamingTextResponse(stream)
}
