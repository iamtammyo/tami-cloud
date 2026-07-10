/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // libsodium-wrappers' ESM build doesn't survive webpack bundling;
    // load it from node_modules at runtime instead.
    serverComponentsExternalPackages: ["libsodium-wrappers"],
  },
};

export default nextConfig;
