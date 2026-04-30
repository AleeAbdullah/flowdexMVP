import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .transform(value => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginSchemaValues = z.output<typeof loginSchema>;
export type SignupSchemaValues = z.output<typeof signupSchema>;
