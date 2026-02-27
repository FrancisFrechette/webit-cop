/** @type {import('next').NextConfig} */ 
const nextConfig = { 
  reactStrictMode: true, 
  transpilePackages: ['undici', 'firebase'], 
  experimental: { 
    serverComponentsExternalPackages: [ 
      'firebase-admin', 
      '@google-cloud/firestore', 
      'google-gax', 
    ], 
  }, 
}; 
export default nextConfig;
