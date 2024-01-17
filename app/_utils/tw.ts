'use client'
import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type ClassName = ClassValue

export const cn = (...inputs: ClassValue[]) =>
  twMerge(clsx(inputs.filter((input) => input !== undefined)))
