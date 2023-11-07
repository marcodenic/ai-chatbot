// pages/api/duffel.ts
// import type { NextApiRequest, NextApiResponse } from 'next'
import { Duffel } from '@duffel/api'

// Duffel API endpoint
const DUFFEL_ENDPOINT = 'https://api.duffel.com/air/offer_requests'

// In our API, you create an offer request in order to search for flights.

// To build the payload you'll need the flight itinerary - which should include the origin(s), destination(s) and departure date(s) - and some basic information about the passengers.

// Set your flight itinerary and click “Create offer request” to continue.

const offerRequest = await duffel.offerRequests.create({
  slices: [
    {
      origin: 'LHR',
      destination: 'JFK',
      departure_date: '2024-05-06T23:31:10.518Z'
    }
  ],
  passengers: [{ 'passengers.type': 'adult' }],
  cabin_class: null
})

const offers = await duffel.offers.list(offerRequest.data.id)

export default async function handler(req, res) {
  try {
    // Destructure or access the data you need from the request object
    const { data } = req.body

    console.log('duffel request', data)
    // Configure your headers with your Duffel API access token
    const headers = {
      Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
      'Duffel-Version': 'beta',
      'Content-Type': 'application/json'
    }

    // Make an API request to Duffel
    const response = await fetch(DUFFEL_ENDPOINT, {
      method: 'POST', // or 'GET' depending on the operation
      headers: headers,
      body: JSON.stringify(data) // if you are sending a request body
    })

    // Convert the response data to JSON
    const result = await response.json()

    // Send back the result as JSON
    res.status(200).json(result)
  } catch (error) {
    if (error instanceof Error) {
      // Now TypeScript knows 'error' is of type Error.
      res.status(500).json({ statusCode: 500, message: error.message })
    } else {
      // Here you can handle the case where it's not an Error instance
      res
        .status(500)
        .json({ statusCode: 500, message: 'An unexpected error occurred' })
    }
  }
}
