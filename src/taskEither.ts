import { HKT } from 'fp-ts/lib/HKT'
import { Either, left, right } from 'fp-ts/lib/Either'
import { Task } from 'fp-ts/lib/Task'
import { TaskEither, URI, map, of, ap, chain, fromEither } from 'fp-ts/lib/TaskEither'
import { MonadType, Type, ValidationError } from './core'
import { zipEither } from './either'

/** Asynchronous validation, all errors */
export const all: MonadType<URI> = {
  URI: URI,
  map: map,
  of: of,
  ap: ap,
  chain: chain,
  throwError: e => fromEither(left(e)),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: TaskEither<Array<ValidationError>, A> = fa as any
    const lazyfb_: () => TaskEither<Array<ValidationError>, B> = lazyfb as any
    return new TaskEither(
      new Task(() => Promise.all([fa_.run(), lazyfb_().run()]).then(([fa, fb]) => zipEither(f, fa, fb)))
    )
  },
  attempt: <A>(fx: HKT<URI, A>, lazyfy: () => HKT<URI, A>): HKT<URI, A> => {
    const fx_: TaskEither<Array<ValidationError>, A> = fx as any
    const lazyfy_: () => TaskEither<Array<ValidationError>, A> = lazyfy as any
    return new TaskEither(
      new Task(() =>
        fx_.run().then(ex =>
          ex.fold(
            lx =>
              lazyfy_()
                .run()
                .then(ey => ey.fold<Either<Array<ValidationError>, A>>(ly => left(lx.concat(ly)), a => right(a))),
            () => Promise.resolve(ex)
          )
        )
      )
    )
  }
}

/** Asynchronous validation, first error only */
export const first: MonadType<URI> = {
  URI: URI,
  map: map,
  of: of,
  ap: ap,
  chain: chain,
  throwError: e => fromEither(left(e)),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: TaskEither<Array<ValidationError>, A> = fa as any
    const lazyfb_: () => TaskEither<Array<ValidationError>, B> = lazyfb as any
    return fa_.chain(a => lazyfb_().map(b => f(a, b)))
  },
  attempt: all.attempt
}

export const validate = <A>(value: any, type: Type<URI, any, A>): TaskEither<Array<ValidationError>, A> =>
  type.validate(value, [{ key: '', type }]) as any
