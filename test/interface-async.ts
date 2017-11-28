import * as assert from 'assert'
import { isRight } from 'fp-ts/lib/Either'
import { getTypeSystem } from '../src/core'
import { all, validate } from '../src/taskEither'
import { assertSuccess } from './helpers'

const t = getTypeSystem(all)

describe('interface (async)', () => {
  it('should succeed validating a valid value', () => {
    const T = t.type({ a: t.string })
    return validate({ a: 's' }, T)
      .run()
      .then(validation => assertSuccess(validation))
  })

  it('should keep unknown properties', () => {
    const T = t.type({ a: t.string })
    validate({ a: 's', b: 1 }, T)
      .run()
      .then(validation => {
        if (isRight(validation)) {
          assert.deepEqual(validation.value, { a: 's', b: 1 })
        } else {
          assert.ok(false)
        }
      })
  })

  // TODO
  // it.skip('should return the same reference if validation succeeded and nothing changed', () => {
  //   const T = t.type({ a: t.string })
  //   const value = { a: 's' }
  //   assertStrictEqual(validate(value, T), value)
  // })

  // it('should return the a new reference if validation succeeded and something changed', () => {
  //   const T = t.type({ a: DateFromNumber, b: t.number })
  //   assertDeepEqual(validate({ a: 1, b: 2 }, T), { a: new Date(1), b: 2 })
  // })

  // it('should fail validating an invalid value', () => {
  //   const T = t.type({ a: t.string })
  //   assertFailure(validate(1, T), ['Invalid value 1 supplied to : { a: string }'])
  //   assertFailure(validate({}, T), ['Invalid value undefined supplied to : { a: string }/a: string'])
  //   assertFailure(validate({ a: 1 }, T), ['Invalid value 1 supplied to : { a: string }/a: string'])
  // })

  // it('should support the alias `type`', () => {
  //   const T = t.type({ a: t.string })
  //   assertSuccess(validate({ a: 's' }, T))
  // })

  // it('should serialize a deserialized', () => {
  //   const T = t.type({ a: DateFromNumber })
  //   assert.deepEqual(T.serialize({ a: new Date(0) }), { a: 0 })
  // })

  // it('should return the same reference when serializing', () => {
  //   const T = t.type({ a: t.number })
  //   assert.strictEqual(T.serialize, t.identity)
  // })

  // it('should type guard', () => {
  //   const T1 = t.type({ a: t.number })
  //   assert.strictEqual(T1.is({ a: 0 }), true)
  //   assert.strictEqual(T1.is(undefined), false)
  //   const T2 = t.type({ a: DateFromNumber })
  //   assert.strictEqual(T2.is({ a: new Date(0) }), true)
  //   assert.strictEqual(T2.is({ a: 0 }), false)
  //   assert.strictEqual(T2.is(undefined), false)
  // })
})
