import * as debug from '@tadashi/debug'
import {uuid} from '@tadashi/common'
import ee from '@tadashi/ee'
import {createYoga, maskError} from 'graphql-yoga'
import schema from './graphql/schema.js'

// prettier-ignore
const {
	APP_ENV,
	LOG_RESOURCE,
} = process.env

/* c8 ignore start */
if (LOG_RESOURCE) {
	await import(LOG_RESOURCE)
}
/* c8 ignore stop */

const yoga = createYoga({
	graphiql: APP_ENV === 'production',
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
		/**
		 * Masks GraphQL errors and logs them for debugging purposes.
		 *
		 * @param {Error} error - The GraphQL error.
		 * @param {string} message - The error message.
		 * @param {boolean} isDev - Indicates if the application is in development mode.
		 * @returns {Object} The masked error object.
		 * @private
		 */
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
	plugins: [],
})

export default yoga
