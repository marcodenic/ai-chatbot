/** @type {import('next').NextConfig} */
module.exports = {
  webpack: config => {
    config.ignoreWarnings = [
      // https://webpack.js.org/configuration/other-options/#ignorewarnings
      {
        module: /node-fetch/,
        message: /.*Can't resolve 'encoding'.*/
      }
    ]

    return config
  },

  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  }
}
