import { Context, getFunctionName, ValidationError } from './core'
import { Either } from 'fp-ts/lib/Either'

const stringify = (v: any): string => {
  return typeof v === 'function' ? getFunctionName(v) : JSON.stringify(v)
}

const getContextPath = (context: Context): string => {
  return context.map(({ key, type }) => `${key}: ${type.name}`).join('/')
}

const getMessage = (v: any, context: Context): string => {
  return `Invalid value ${stringify(v)} supplied to ${getContextPath(context)}`
}

export const failure = (es: Array<ValidationError>): Array<string> => {
  return es.map(e => getMessage(e.value, e.context))
}

export const success = (): Array<string> => {
  return ['No errors!']
}

export const report = (validation: Either<Array<ValidationError>, any>): Array<string> => {
  return validation.fold(failure, success)
}
