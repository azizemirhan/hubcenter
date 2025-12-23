/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disable to prevent double API calls in dev
    output: 'standalone', // Required for Docker production builds
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true, // Set to false if the redirect is temporary
            },
        ];
    },
    sassOptions: {
        quietDeps: true, // Suppresses warnings from dependencies
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
    },
};

export default nextConfig;