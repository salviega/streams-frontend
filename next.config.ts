import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	webpack: (config, { isServer }) => {
		// Ignore test files, benchmarks, and other non-production files from thread-stream
		const webpack = require('webpack')
		config.plugins = config.plugins || []
		
		// Ignore test directory and all its contents
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /thread-stream[\\/](test|bench)/,
			})
		)

		// Ignore LICENSE and README files
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /thread-stream[\\/](LICENSE|README\.md)$/,
			})
		)

		// Ignore test files with various extensions
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /\.(test|spec)\.(js|mjs|ts)$/,
				contextRegExp: /thread-stream/,
			})
		)

		return config
	},
	// Mark thread-stream as external for server-side to avoid bundling issues
	serverExternalPackages: ['thread-stream'],
}

export default nextConfig
