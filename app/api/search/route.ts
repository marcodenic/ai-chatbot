// import { Duffel } from '@duffel/api'

// const duffelAccessToken = process.env.DUFFEL_ACCESS_TOKEN

// export async function POST(req: Request, res: Response) {
//   const data = await req.json()
//   console.log(data)

//   try {
//     console.log('duffelAccessToken: ', duffelAccessToken)
//     if (!duffelAccessToken) {
//       throw new Error(
//         'The Duffel access token is not set in the environment variables'
//       )
//     }

//     // Initialize the Duffel API with your access token
//     const duffel = new Duffel({ token: duffelAccessToken })
//     // Ensure this API endpoint is only called with a POST request
//     // if (req.method !== 'POST') {
//     //   res.setHeader('Allow', ['POST'])
//     //   return res.status(405).end(`Method ${req.method} Not Allowed`)
//     // }

//     // Destructure or access the data you need from the request object
//     const { slices, passengers, cabin_class } = data
//     console.log('slices: ', slices)
//     console.log('passengers: ', passengers)
//     console.log('cabin_class: ', cabin_class)
//     // Create an offer request with Duffel's API
//     const offerRequest = await duffel.offerRequests.create({
//       slices: slices,
//       passengers: passengers,
//       cabin_class: cabin_class
//     })

//     // Get the offers from Duffel's API
//     const offers = await duffel.offers.list({
//       offer_request_id: offerRequest.data.id
//     })

//     // Send back the offers as JSON
//     //res.status(200).json(offers.data)
//     console.log('OFFERS: ', offers.data)
//   } catch (error) {
//     console.error('Duffel API error:', error)
//     // res.status(500).json({
//     //   statusCode: 500,
//     //   message: 'An error occurred with the Duffel API'
//     // })
//   }

//   //return new Response('Hello, Next.js!')
// }

// Assuming you're using Node.js 18+ where fetch API is available globally
// If you're on an older version of Node.js, you might need to import `node-fetch`

const duffelAccessToken = process.env.DUFFEL_ACCESS_TOKEN

export async function POST(req: Request, res: Response) {
  const data = await req.json()
  console.log(data)

  try {
    console.log('duffelAccessToken:', duffelAccessToken)
    if (!duffelAccessToken) {
      throw new Error(
        'The Duffel access token is not set in the environment variables'
      )
    }

    const offerRequestData = {
      data: {
        slices: data.slices,
        passengers: data.passengers,
        cabin_class: data.cabin_class
      }
    }

    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Duffel-Version': 'v1',
        'Accept-Encoding': 'gzip',
        Accept: 'application/json',
        Authorization: `Bearer ${duffelAccessToken}`
      },
      body: JSON.stringify(offerRequestData)
    })

    if (!response.ok) {
      // If the response is not ok, throw an error
      const errorData = await response.json()
      console.error('Duffel API error:', errorData)
      // res.status(response.status).json({
      //   statusCode: response.status,
      //   message: errorData.errors?.map(e => e.message).join(', ')
      // })

      return Response.json({ errorData })
    }

    const offers = await response.json()
    console.log('OFFERS:', offers.data)
    // res.status(200).json(offers.data);
    return new Response(JSON.stringify(offers.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    const errorData = {
      statusCode: 500,
      message: 'An error occurred'
    }

    return new Response(JSON.stringify({ errorData }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
    // res.status(500).json({
    //   statusCode: 500,
    //   message: 'An error occurred'
    // });
  }
}
