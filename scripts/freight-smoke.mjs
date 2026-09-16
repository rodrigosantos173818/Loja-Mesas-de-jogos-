import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { unlink } from 'node:fs/promises'

const bundle = '.freight-smoke-bundle.mjs'
await build({
  entryPoints: ['./api/frete.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: bundle,
})
try {
  const { default: handler } = await import(pathToFileURL(`${process.cwd()}/${bundle}`).href)
  const mockResponse = () => ({
    code: 200,
    body: null,
    setHeader() {},
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  })
  const invalid = mockResponse()
  await handler(
    { method: 'POST', body: { cep: '123', items: [{ id: 'sinuca-pro-08', quantity: 1 }] } },
    invalid,
  )
  assert.equal(invalid.code, 400)

  delete process.env.MELHOR_ENVIO_TOKEN
  delete process.env.MELHOR_ENVIO_ORIGIN_CEP
  const consultation = mockResponse()
  await handler(
    { method: 'POST', body: { cep: '01001000', items: [{ id: 'sinuca-pro-08', quantity: 2 }] } },
    consultation,
  )
  assert.equal(consultation.code, 200)
  assert.equal(consultation.body.consultation, true)

  process.env.MELHOR_ENVIO_TOKEN = 'test-token'
  process.env.MELHOR_ENVIO_ORIGIN_CEP = '01311000'
  const originalFetch = globalThis.fetch
  let requestPayload
  globalThis.fetch = async (_url, options) => {
    requestPayload = JSON.parse(options.body)
    return {
      ok: true,
      json: async () => [
        {
          name: 'Expresso',
          company: { name: 'Transportadora' },
          price: '199.00',
          custom_price: '189.90',
          delivery_time: 8,
          custom_delivery_time: 6,
        },
      ],
    }
  }
  try {
    const quoted = mockResponse()
    await handler(
      {
        method: 'POST',
        body: { cep: '01001000', items: [{ id: 'sinuca-pro-08', quantity: 2, weight: 0 }] },
      },
      quoted,
    )
    assert.equal(quoted.code, 200)
    assert.deepEqual(quoted.body.quotes[0], {
      service: 'Expresso',
      carrier: 'Transportadora',
      price: 189.9,
      deliveryDays: 6,
    })
    assert.equal(requestPayload.products[0].quantity, 2)
    assert.equal(requestPayload.products[0].weight, 180)
    assert.equal(requestPayload.products[0].length, 260)
  } finally {
    globalThis.fetch = originalFetch
  }
  console.log('Frete: validação, consulta e cotação passaram.')
} finally {
  await unlink(bundle)
}
