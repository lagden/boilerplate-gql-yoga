import {promisify} from 'node:util'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import got from 'got'
import run from './helper/server.js'

const source = {}
source.hello = `
query Hello($name: String!) {
	hello(name: $name)
}
`

source.obj = `
query Obj($c: String) {
	obj(c: $c) {
		a
		b
		c
	}
}
`

test('app', async t => {
	const {baseUrl, server} = run()

	t.after(async () => {
		await promisify(server.close.bind(server))()
	})

	await t.test('hello', async () => {
		const json = {}
		json.query = source.hello
		json.variables = {name: 'Sabrina'}
		json.operationName = 'Hello'
		const r = await got.post(`${baseUrl}/gql`, {
			throwHttpErrors: false,
			responseType: 'json',
			json,
		})

		const {hello} = r.body.data

		assert.equal(r.statusCode, 200)
		assert.equal(hello, 'Hello Sabrina')
	})

	await t.test('obj', async () => {
		const json = {}
		json.query = source.obj
		json.variables = {c: 'Bar'}
		json.operationName = 'Obj'
		const r = await got.post(`${baseUrl}/gql`, {
			throwHttpErrors: false,
			responseType: 'json',
			json,
		})

		assert.equal(r.statusCode, 200)
		assert.equal(r.body.data.obj.c.c, 'Bar')
	})

	await t.test('error', async () => {
		const json = {}
		json.query = source.hello
		json.variables = {name: 'Sabrina'}
		json.operationName = 'Nope'
		const r = await got.post(`${baseUrl}/gql`, {
			throwHttpErrors: false,
			responseType: 'json',
			json,
		})

		assert.equal(r.statusCode, 400)
		assert.equal(r.body.errors[0].message, 'Could not determine what operation to execute.')
	})

	await t.test('live', async () => {
		const r = await got.get(`${baseUrl}/live`, {
			throwHttpErrors: false,
		})

		assert.equal(r.statusCode, 200)
		assert.equal(r.body, '')
	})
})
