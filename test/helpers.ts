import * as assert from 'assert'
import { URI, isRight, isLeft, either } from 'fp-ts/lib/Either'
import * as t from '../src'
import { report } from '../src/util'

export function assertSuccess<A>(validation: t.Validation<A>): void {
  assert.ok(isRight(validation))
}

export function assertFailure<A>(validation: t.Validation<A>, descriptions: Array<string>): void {
  assert.ok(isLeft(validation))
  assert.deepEqual(report(validation), descriptions)
}

export function assertStrictEqual<A>(validation: t.Validation<A>, value: any): void {
  assert.strictEqual(validation.fold<any>(t.identity, t.identity), value)
}

export function assertDeepEqual<A>(validation: t.Validation<A>, value: any): void {
  assert.deepEqual(validation.fold<any>(t.identity, t.identity), value)
}

export const string2 = new t.Type<URI, any, string>(
  'string2',
  (v): v is string => t.string.is(v) && v[1] === '-',
  (s, c) =>
    either.chain(s => {
      if (s.length === 2) {
        return t.success(s[0] + '-' + s[1])
      } else {
        return t.failure(s, c)
      }
    }, t.string.validate(s, c)),
  a => a[0] + a[2]
)

// export const string2 = new t.Type<any, string>(
//   'string2',
//   (v): v is string => t.string.is(v) && v[1] === '-',
//   (s, c) =>
//     t.string.validate(s, c).chain(s => {
//       if (s.length === 2) {
//         return t.success(s[0] + '-' + s[1])
//       } else {
//         return t.failure(s, c)
//       }
//     }),
//   a => a[0] + a[2]
// )

export const DateFromNumber = new t.Type<URI, any, Date>(
  'DateFromNumber',
  (v): v is Date => v instanceof Date,
  (s, c) =>
    either.chain(n => {
      const d = new Date(n)
      return isNaN(d.getTime()) ? t.failure(n, c) : t.success(d)
    }, t.number.validate(s, c)),
  a => a.getTime()
)

// export const DateFromNumber = new t.Type<URI, any, Date>(
//   'DateFromNumber',
//   (v): v is Date => v instanceof Date,
//   (s, c) =>
//     t.validate(s, t.number, c).chain(n => {
//       const d = new Date(n)
//       return isNaN(d.getTime()) ? t.failure(n, c) : t.success(d)
//     }),
//   a => a.getTime()
// )

export const NumberFromString = new t.Type<URI, string, number>(
  'NumberFromString',
  t.number.is,
  (s, c) => {
    const n = parseFloat(s)
    return isNaN(n) ? t.failure(s, c) : t.success(n)
  },
  String
)

// export const NumberFromString = new t.Type<string, number>(
//   'NumberFromString',
//   t.number.is,
//   (s, c) => {
//     const n = parseFloat(s)
//     return isNaN(n) ? t.failure(s, c) : t.success(n)
//   },
//   String
// )

export const IntegerFromString = t.refinement(NumberFromString, t.Integer.is, 'IntegerFromString')
