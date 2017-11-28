// import * as assert from 'assert'
import { getTypeSystem } from '../src/core'
import { all, validate } from '../src/taskEither'
import { assertSuccess, assertFailure } from './helpers'

const t = getTypeSystem(all)

describe('union (async)', () => {
  it('should succeed validating a valid value', () => {
    const T = t.union([t.string, t.number])
    validate('s', T)
      .run()
      .then(assertSuccess)
    validate(1, T)
      .run()
      .then(assertSuccess)
  })

  it('should fail validating an invalid value', () => {
    const T = t.union([t.string, t.number])
    validate(true, T)
      .run()
      .then(validation =>
        assertFailure(validation, [
          'Invalid value true supplied to : (string | number)/0: string',
          'Invalid value true supplied to : (string | number)/1: number'
        ])
      )
  })
})
