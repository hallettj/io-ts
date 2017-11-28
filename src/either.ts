import { HKT } from 'fp-ts/lib/HKT'
import { URI, Either, left, right, map, of, ap, chain } from 'fp-ts/lib/Either'
import { MonadType, Type, ValidationError } from './core'

export const zipEither = <A, B, C>(
  f: (a: A, b: B) => C,
  fa: Either<Array<ValidationError>, A>,
  fb: Either<Array<ValidationError>, B>
): Either<Array<ValidationError>, C> =>
  fa.fold(la => fb.fold(lb => left(la.concat(lb)), () => left(la)), a => fb.fold(lb => left(lb), b => right(f(a, b))))

/** Synchronous validation, all errors */
export const all: MonadType<URI> = {
  URI: URI,
  map,
  of,
  ap,
  chain,
  throwError: e => left(e),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: Either<Array<ValidationError>, A> = fa as any
    const lazyfb_: () => Either<Array<ValidationError>, B> = lazyfb as any
    return zipEither(f, fa_, lazyfb_())
  },
  attempt: <A>(fx: HKT<URI, A>, lazyfy: () => HKT<URI, A>): HKT<URI, A> => {
    const fx_: Either<Array<ValidationError>, A> = fx as any
    const lazyfy_: () => Either<Array<ValidationError>, A> = lazyfy as any
    return fx_.fold(lx => lazyfy_().fold(ly => left(lx.concat(ly)), a => right(a)), () => fx_)
  }
}

/** Synchronous validation, first error only */
export const first: MonadType<URI> = {
  URI: URI,
  map,
  of,
  ap,
  chain,
  throwError: e => left(e),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: Either<Array<ValidationError>, A> = fa as any
    const lazyfb_: () => Either<Array<ValidationError>, B> = lazyfb as any
    return fa_.chain(a => lazyfb_().map(b => f(a, b)))
  },
  attempt: <A>(fx: HKT<URI, A>, lazyfy: () => HKT<URI, A>): HKT<URI, A> => {
    const fx_: Either<Array<ValidationError>, A> = fx as any
    const lazyfy_: () => Either<Array<ValidationError>, A> = lazyfy as any
    return fx_.fold(() => lazyfy_(), () => fx)
  }
}

export const validate = <A>(value: any, type: Type<URI, any, A>): Either<Array<ValidationError>, A> =>
  type.validate(value, [{ key: '', type }]) as any
