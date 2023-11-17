import {createServer} from 'node:http'
import * as debug from '@tadashi/debug'
import {createYoga, maskError} from 'graphql-yoga'
import {createInMemoryCache, useResponseCache} from '@graphql-yoga/plugin-response-cache'
import {uuid} from '@tadashi/common'
import ee from '@tadashi/ee'
import schema from './graphql/schema.js'

// prettier-ignore
const {
	LOG_RESOURCE,
} = process.env

/* c8 ignore start */
if (LOG_RESOURCE) {
	await import(LOG_RESOURCE)
}
/* c8 ignore stop */

const cache = createInMemoryCache()

const yoga = createYoga({
	schema,
	graphqlEndpoint: '/gql',
	healthCheckEndpoint: '/live',
	batching: true,
	cors(request) {
		const requestOrigin = request.headers.get('origin')
		return {
			origin: requestOrigin,
			credentials: true,
		}
	},
	maskedErrors: {
		maskError(error, message, isDev) {
			debug.error({
				error: error?.extensions,
				error_message: error.message,
				message,
				isDev,
			})

			/* c8 ignore start */
			const _log = {
				level: 'error',
				extensions_status_code: error?.extensions?.http?.status,
				extensions_message: error?.extensions?.message,
				message: error.message,
				tracking_error: uuid(false),
				isDev,
			}
			ee.emit('logger', _log)
			/* c8 ignore stop */

			return maskError(error, message, isDev)
		},
	},
	plugins: [
		useResponseCache({
			cache,
			ttl: 2000,
			session: () => undefined,
		}),
	],
})

const app = createServer(yoga)

export default app
