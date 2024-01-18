import {promisify} from 'node:util'
import {createServer} from 'node:http'
import listen from 'test-listen'
import yoga from '../../server/yoga.js'

export async function start() {
	const server = createServer(yoga)
	const prefixUrl = await listen(server)
	return {
		server,
		prefixUrl,
	}
}

export async function stop(server) {
	await promisify(server.close.bind(server))()
}
