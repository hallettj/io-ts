import { HKT } from 'fp-ts/lib/HKT'
import { Monad } from 'fp-ts/lib/Monad'
import { Predicate } from 'fp-ts/lib/function'

export interface ContextEntry {
  readonly key: string
  readonly type: Any
}

export type Context = Array<ContextEntry>

export interface ValidationError {
  readonly value: any
  readonly context: Context
}

export interface MonadThrow<E, M> extends Monad<M> {
  throwError: <A>(e: E) => HKT<M, A>
}

export interface MonadType<M> extends MonadThrow<Array<ValidationError>, M> {
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<M, A>, lazyfb: () => HKT<M, B>) => HKT<M, C>
  attempt: <A>(fx: HKT<M, A>, lazyfy: () => HKT<M, A>) => HKT<M, A>
}

export type Is<A> = (v: any) => v is A
export type Validate<M, S, A> = (s: S, context: Context) => HKT<M, A>
export type Serialize<S, A> = (a: A) => S

/**
 * Laws:
 * 1. validate(x).fold(() => x, serialize) = x
 * 2. validate(serialize(x)) = Right(x)
 */
export class Type<M, S, A> {
  readonly _A: A
  readonly _S: S
  readonly _M: M
  constructor(
    readonly name: string,
    readonly is: Is<A>,
    readonly validate: Validate<M, S, A>,
    readonly serialize: Serialize<S, A>
  ) {}
}

export const identity = <A>(a: A): A => a

export const getFunctionName = (f: any): string => f.displayName || f.name || `<function${f.length}>`

export type Any = Type<any, any, any>

export type MonadOf<RT extends Any> = RT['_M']

export type InputOf<RT extends Any> = RT['_S']

export type TypeOf<RT extends Any> = RT['_A']

//
// basic types
//

export class NullType<M> extends Type<M, any, null> {
  readonly _tag: 'NullType' = 'NullType'
  constructor(M: MonadType<M>) {
    super(
      'null',
      (v): v is null => v === null,
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getNullType = <M>(M: MonadType<M>): NullType<M> => new NullType(M)

export class UndefinedType<M> extends Type<M, any, undefined> {
  readonly _tag: 'UndefinedType' = 'UndefinedType'
  constructor(M: MonadType<M>) {
    super(
      'undefined',
      (v): v is undefined => v === void 0,
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getUndefinedType = <M>(M: MonadType<M>): UndefinedType<M> => new UndefinedType(M)

export class AnyType<M> extends Type<M, any, any> {
  readonly _tag: 'AnyType' = 'AnyType'
  constructor(M: MonadType<M>) {
    super('any', (_): _ is any => true, M.of, identity)
  }
}

export const getAnyType = <M>(M: MonadType<M>): AnyType<M> => new AnyType(M)

export class NeverType<M> extends Type<M, any, never> {
  readonly _tag: 'NeverType' = 'NeverType'
  constructor(M: MonadType<M>) {
    super(
      'never',
      (_): _ is never => false,
      (s, c) => M.throwError([{ value: s, context: c }]),
      () => {
        throw new Error('cannot serialize never')
      }
    )
  }
}

export const getNeverType = <M>(M: MonadType<M>): NeverType<M> => new NeverType(M)

export class StringType<M> extends Type<M, any, string> {
  readonly _tag: 'StringType' = 'StringType'
  constructor(M: MonadType<M>) {
    super(
      'string',
      (v): v is string => typeof v === 'string',
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getStringType = <M>(M: MonadType<M>): StringType<M> => new StringType(M)

export class NumberType<M> extends Type<M, any, number> {
  readonly _tag: 'NumberType' = 'NumberType'
  constructor(M: MonadType<M>) {
    super(
      'number',
      (v): v is number => typeof v === 'number',
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getNumberType = <M>(M: MonadType<M>): NumberType<M> => new NumberType(M)

export class BooleanType<M> extends Type<M, any, boolean> {
  readonly _tag: 'BooleanType' = 'BooleanType'
  constructor(M: MonadType<M>) {
    super(
      'boolean',
      (v): v is boolean => typeof v === 'boolean',
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getBooleanType = <M>(M: MonadType<M>): BooleanType<M> => new BooleanType(M)

export class ObjectType<M> extends Type<M, any, object> {
  readonly _tag: 'ObjectType' = 'ObjectType'
  constructor(anyDictionaryType: AnyDictionaryType<M>) {
    super('object', anyDictionaryType.is, anyDictionaryType.validate, identity)
  }
}

export const getObjectType = <M>(anyDictionaryType: AnyDictionaryType<M>): ObjectType<M> =>
  new ObjectType(anyDictionaryType)

export class FunctionType<M> extends Type<M, any, Function> {
  readonly _tag: 'FunctionType' = 'FunctionType'
  constructor(M: MonadType<M>) {
    super(
      'Function',
      (v): v is Function => typeof v === 'function',
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getFunctionType = <M>(M: MonadType<M>): FunctionType<M> => new FunctionType(M)

export class AnyArrayType<M> extends Type<M, any, Array<any>> {
  readonly _tag: 'AnyArrayType' = 'AnyArrayType'
  constructor(M: MonadType<M>) {
    super(
      'Array',
      (v): v is Array<any> => Array.isArray(v),
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getAnyArrayType = <M>(M: MonadType<M>): AnyArrayType<M> => new AnyArrayType(M)

export class AnyDictionaryType<M> extends Type<M, any, { [key: string]: any }> {
  readonly _tag: 'AnyDictionaryType' = 'AnyDictionaryType'
  constructor(M: MonadType<M>) {
    super(
      'Dictionary',
      (v): v is { [key: string]: any } => v !== null && typeof v === 'object',
      (s, c) => (this.is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
      identity
    )
  }
}

export const getAnyDictionaryType = <M>(M: MonadType<M>): AnyDictionaryType<M> => new AnyDictionaryType(M)

//
// refinements
//

export class RefinementType<M, RT extends Any> extends Type<M, InputOf<RT>, TypeOf<RT>> {
  readonly _tag: 'RefinementType' = 'RefinementType'
  constructor(
    name: string,
    is: RefinementType<M, RT>['is'],
    validate: RefinementType<M, RT>['validate'],
    serialize: RefinementType<M, RT>['serialize'],
    readonly type: RT,
    readonly predicate: Predicate<TypeOf<RT>>
  ) {
    super(name, is, validate, serialize)
  }
}

export const getRefinement = <M>(M: MonadType<M>) => <RT extends Any>(
  type: RT,
  predicate: Predicate<TypeOf<RT>>,
  name: string = `(${type.name} | ${getFunctionName(predicate)})`
): RefinementType<M, RT> => {
  return new RefinementType(
    name,
    (v): v is TypeOf<RT> => type.is(v) && predicate(v),
    (s, c) => M.chain(a => (predicate(a) ? M.of(a) : M.throwError([{ value: a, context: c }])), type.validate(s, c)),
    type.serialize,
    type,
    predicate
  )
}

//
// literals
//

export class LiteralType<M, V extends string | number | boolean> extends Type<M, any, V> {
  readonly _tag: 'LiteralType' = 'LiteralType'
  constructor(
    name: string,
    is: LiteralType<M, V>['is'],
    validate: LiteralType<M, V>['validate'],
    serialize: LiteralType<M, V>['serialize'],
    readonly value: V
  ) {
    super(name, is, validate, serialize)
  }
}

export const getLiteral = <M>(M: MonadType<M>) => <V extends string | number | boolean>(
  value: V,
  name: string = JSON.stringify(value)
): LiteralType<M, V> => {
  const is = (v: any): v is V => v === value
  return new LiteralType(
    name,
    is,
    (s, c) => (is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])),
    identity,
    value
  )
}

//
// keyof
//

export class KeyofType<M, D extends { [key: string]: any }> extends Type<M, any, keyof D> {
  readonly _tag: 'KeyofType' = 'KeyofType'
  constructor(
    name: string,
    is: KeyofType<M, D>['is'],
    validate: KeyofType<M, D>['validate'],
    serialize: KeyofType<M, D>['serialize'],
    readonly keys: D
  ) {
    super(name, is, validate, serialize)
  }
}

export const getKeyof = <M>(M: MonadType<M>) => (string: StringType<M>) => <D extends { [key: string]: any }>(
  keys: D,
  name: string = `(keyof ${JSON.stringify(Object.keys(keys))})`
): KeyofType<M, D> => {
  const is = (v: any): v is keyof D => string.is(v) && keys.hasOwnProperty(v)
  return new KeyofType(name, is, (s, c) => (is(s) ? M.of(s) : M.throwError([{ value: s, context: c }])), identity, keys)
}

//
// recursive types
//

export class RecursiveType<M, A> extends Type<M, any, A> {
  readonly _tag: 'RecursiveType' = 'RecursiveType'
  // prettier-ignore
  readonly 'type': Any
  constructor(name: string, is: Is<A>, validate: Validate<M, any, A>, serialize: Serialize<any, A>) {
    super(name, is, validate, serialize)
  }
}

export const getRecursion = <M>(M: MonadType<M>) => <A>(
  name: string,
  definition: (self: Any) => Any
): RecursiveType<M, A> => {
  const Self: any = new RecursiveType<M, A>(name, (v): v is A => type.is(v), (s, c) => type.validate(s, c), identity)
  const type = definition(Self)
  Self.type = type
  Self.serialize = type.serialize
  return Self
}

//
// arrays
//

export class ArrayType<M, RT extends Type<M, any, any>> extends Type<M, any, Array<TypeOf<RT>>> {
  readonly _tag: 'ArrayType' = 'ArrayType'
  constructor(
    name: string,
    is: ArrayType<M, RT>['is'],
    validate: ArrayType<M, RT>['validate'],
    serialize: ArrayType<M, RT>['serialize'],
    readonly type: RT
  ) {
    super(name, is, validate, serialize)
  }
}

export const getArray = <M>(M: MonadType<M>) => (anyArrayType: Type<M, any, Array<any>>) => <
  RT extends Type<M, any, any>
>(
  type: RT,
  name: string = `Array<${type.name}>`
): ArrayType<M, RT> => {
  type A = TypeOf<RT>
  return new ArrayType(
    name,
    (v): v is Array<A> => anyArrayType.is(v) && v.every(type.is),
    (s, c) =>
      M.chain(xs => {
        let r: HKT<M, Array<A>> = M.of([])
        const f = M.zipWith((a: Array<A>, b: A) => a.concat([b]))
        for (let i = 0; i < xs.length; i++) {
          r = f(r, () => type.validate(xs[i], c.concat({ key: String(i), type })))
        }
        return r
      }, anyArrayType.validate(s, c)),
    type.serialize === identity ? identity : a => a.map(type.serialize),
    type
  )
}

//
// interfaces
//

export type Props<M> = { [key: string]: Type<M, any, any> }

export type InterfaceOf<P extends Props<any>> = { [K in keyof P]: TypeOf<P[K]> }

export class InterfaceType<M, P extends Props<M>> extends Type<M, any, InterfaceOf<P>> {
  readonly _tag: 'InterfaceType' = 'InterfaceType'
  constructor(
    name: string,
    is: InterfaceType<M, P>['is'],
    validate: InterfaceType<M, P>['validate'],
    serialize: InterfaceType<M, P>['serialize'],
    readonly props: P
  ) {
    super(name, is, validate, serialize)
  }
}

const getNameFromProps = (props: Props<any>): string =>
  `{ ${Object.keys(props)
    .map(k => `${k}: ${props[k].name}`)
    .join(', ')} }`

const useIdentity = (props: Props<any>): boolean => {
  for (let k in props) {
    if (props[k].serialize !== identity) {
      return false
    }
  }
  return true
}

export const getType = <M>(M: MonadType<M>) => (anyDictionaryType: Type<M, any, { [key: string]: any }>) => <
  P extends Props<M>
>(
  props: P,
  name: string = getNameFromProps(props)
): InterfaceType<M, P> =>
  new InterfaceType(
    name,
    (v): v is InterfaceOf<P> => {
      if (!anyDictionaryType.is(v)) {
        return false
      }
      for (let k in props) {
        if (!props[k].is(v[k])) {
          return false
        }
      }
      return true
    },
    (s, c) =>
      M.chain(o => {
        let r: HKT<M, any> = M.of({ ...o })
        const f = M.zipWith((a: { [key: string]: any }, b: { k: string; v: any }) => ({ ...a, [b.k]: b.v }))
        for (let k in props) {
          const type = props[k]
          r = f(r, () => M.map(v => ({ k, v }), type.validate(o[k], c.concat({ key: k, type }))))
        }
        return r
      }, anyDictionaryType.validate(s, c)),
    useIdentity(props)
      ? identity
      : a => {
          const s: { [x: string]: any } = { ...(a as any) }
          for (let k in props) {
            s[k] = props[k].serialize(a[k])
          }
          return s
        },
    props
  )

//
// unions
//

export class UnionType<M, RTS, A> extends Type<M, any, A> {
  readonly _tag: 'UnionType' = 'UnionType'
  constructor(
    name: string,
    is: UnionType<M, RTS, A>['is'],
    validate: UnionType<M, RTS, A>['validate'],
    serialize: UnionType<M, RTS, A>['serialize'],
    readonly types: RTS
  ) {
    super(name, is, validate, serialize)
  }
}

declare global {
  interface Array<T> {
    _A: T
  }
}

export const getUnion = <M>(M: MonadType<M>) => <RTS extends Array<Any>>(
  types: RTS,
  name: string = `(${types.map(type => type.name).join(' | ')})`
): UnionType<M, RTS, TypeOf<RTS['_A']>> => {
  return new UnionType(
    name,
    (v): v is TypeOf<RTS['_A']> => types.some(type => type.is(v)),
    (s, c) => {
      if (types.length > 0) {
        let type = types[0]
        let r: HKT<M, TypeOf<RTS['_A']>> = type.validate(s, c.concat({ key: String(0), type }))
        for (let i = 1; i < types.length; i++) {
          type = types[i]
          r = M.attempt(r, () => type.validate(s, c.concat({ key: String(i), type })))
        }
        return r
      } else {
        return M.throwError([{ value: s, context: c }])
      }
    },
    types.every(type => type.serialize === identity)
      ? identity
      : a => {
          for (let i = 0; i < types.length; i++) {
            const type = types[i]
            if (type.is(a)) {
              return type.serialize(a)
            }
          }
          return a
        },
    types
  )
}

//
// partials
//

export type PartialOf<P extends Props<any>> = { [K in keyof P]?: TypeOf<P[K]> }

export class PartialType<M, P extends Props<M>> extends Type<M, any, PartialOf<P>> {
  readonly _tag: 'PartialType' = 'PartialType'
  constructor(
    name: string,
    is: PartialType<M, P>['is'],
    validate: PartialType<M, P>['validate'],
    serialize: PartialType<M, P>['serialize'],
    readonly props: P
  ) {
    super(name, is, validate, serialize)
  }
}

export const getPartial = <M>(M: MonadType<M>) => (
  union: <RTS extends Array<Any>>(types: RTS, name?: string) => UnionType<M, RTS, TypeOf<RTS['_A']>>,
  undefinedType: UndefinedType<M>,
  type: <P extends Props<M>>(props: P, name?: string) => InterfaceType<M, P>
) => <P extends Props<M>>(props: P, name: string = `PartialType<${getNameFromProps(props)}>`): PartialType<M, P> => {
  const partials: Props<M> = {}
  for (let k in props) {
    partials[k] = union([props[k], undefinedType])
  }
  const partial = type(partials)
  return new PartialType(
    name,
    (v): v is PartialOf<P> => partial.is(v),
    (s, c) => partial.validate(s, c) as any,
    useIdentity(props)
      ? identity
      : a => {
          const s: { [key: string]: any } = {}
          for (let k in props) {
            const ak = a[k]
            if (ak !== undefined) {
              s[k] = props[k].serialize(ak)
            }
          }
          return s
        },
    props
  )
}

//
// dictionaries
//

export class DictionaryType<M, D extends Any, C extends Any> extends Type<M, any, { [K in TypeOf<D>]: TypeOf<C> }> {
  readonly _tag: 'DictionaryType' = 'DictionaryType'
  constructor(
    name: string,
    is: DictionaryType<M, D, C>['is'],
    validate: DictionaryType<M, D, C>['validate'],
    serialize: DictionaryType<M, D, C>['serialize'],
    readonly domain: D,
    readonly codomain: C
  ) {
    super(name, is, validate, serialize)
  }
}

export const getDictionary = <M>(M: MonadType<M>) => (anyDictionaryType: AnyDictionaryType<M>) => <
  D extends Any,
  C extends Any
>(
  domain: D,
  codomain: C,
  name: string = `{ [K in ${domain.name}]: ${codomain.name} }`
): DictionaryType<M, D, C> =>
  new DictionaryType(
    name,
    (v): v is { [K in TypeOf<D>]: TypeOf<C> } =>
      anyDictionaryType.is(v) && Object.keys(v).every(k => domain.is(k) && codomain.is(v[k])),
    (s, c) =>
      M.chain(o => {
        let r: HKT<M, any> = M.of({})
        const f = M.zipWith((a: { [key: string]: any }, b: { k: string; v: any }) => ({ ...a, [b.k]: b.v }))
        for (let k in o) {
          r = f(r, () =>
            M.chain(
              kk => M.map(v => ({ k: kk, v }), codomain.validate(o[k], c.concat({ key: k, type: codomain }))),
              domain.validate(k, c.concat({ key: k, type: domain }))
            )
          )
        }
        return r
      }, anyDictionaryType.validate(s, c)),
    domain.serialize === identity && codomain.serialize === identity
      ? identity
      : a => {
          const s: { [key: string]: any } = {}
          for (let k in a) {
            s[domain.serialize(k)] = codomain.serialize((a as any)[k])
          }
          return s
        },
    domain,
    codomain
  )

export interface TypeSystem<M> {
  nullType: NullType<M>
  undefined: UndefinedType<M>
  any: AnyType<M>
  never: NeverType<M>
  string: StringType<M>
  number: NumberType<M>
  boolean: BooleanType<M>
  object: ObjectType<M>
  Function: FunctionType<M>
  Array: AnyArrayType<M>
  Dictionary: AnyDictionaryType<M>
  refinement: <RT extends Any>(type: RT, predicate: Predicate<TypeOf<RT>>, name?: string) => RefinementType<M, RT>
  Integer: RefinementType<M, NumberType<M>>
  literal: <V extends string | number | boolean>(value: V, name?: string) => LiteralType<M, V>
  keyof: <D extends { [key: string]: any }>(keys: D, name?: string) => KeyofType<M, D>
  recursion: <A>(name: string, definition: (self: Any) => Any) => RecursiveType<M, A>
  array: <RT extends Type<M, any, any>>(type: RT, name?: string) => ArrayType<M, RT>
  type: <P extends Props<M>>(props: P, name?: string) => InterfaceType<M, P>
  union: <RTS extends Array<Any>>(types: RTS, name?: string) => UnionType<M, RTS, TypeOf<RTS['_A']>>
  partial: <P extends Props<M>>(props: P, name?: string) => PartialType<M, P>
  dictionary: <D extends Any, C extends Any>(domain: D, codomain: C, name?: string) => DictionaryType<M, D, C>
}

export const getTypeSystem = <M>(M: MonadType<M>): TypeSystem<M> => {
  const anyArrayType = getAnyArrayType(M)
  const anyDictionaryType = getAnyDictionaryType(M)
  const refinement = getRefinement(M)
  const number = getNumberType(M)
  const string = getStringType(M)
  const undefinedType = getUndefinedType(M)
  const Integer = refinement(number, n => n % 1 === 0, 'Integer')
  const type = getType(M)(anyDictionaryType)
  const union = getUnion(M)
  return {
    nullType: getNullType(M),
    undefined: undefinedType,
    any: getAnyType(M),
    never: getNeverType(M),
    string,
    number,
    boolean: getBooleanType(M),
    object: getObjectType(anyDictionaryType),
    Function: getFunctionType(M),
    Array: anyArrayType,
    Dictionary: anyDictionaryType,
    refinement,
    Integer,
    literal: getLiteral(M),
    keyof: getKeyof(M)(string),
    recursion: getRecursion(M),
    array: getArray(M)(anyArrayType),
    type,
    union,
    partial: getPartial(M)(union, undefinedType, type),
    dictionary: getDictionary(M)(anyDictionaryType)
  }
}
