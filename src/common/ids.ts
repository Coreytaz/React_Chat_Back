import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export function validId(value: string) {
  if (!Types.ObjectId.isValid(value) || !/^[a-f\d]{24}$/i.test(value))
    throw new BadRequestException('Некорректный идентификатор');
  return value;
}
// Existing documents use single-element arrays for user references.
export function referenceId(value: unknown): string {
  if (Array.isArray(value)) return referenceId(value[0]);
  return value == null ? '' : String(value);
}
