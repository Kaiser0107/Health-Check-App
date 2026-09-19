import { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import { ZodType } from 'zod';

/**
 * Lightweight, self-contained Zod resolver for React Hook Form.
 * Directly integrates Zod with React Hook Form without external subpath export packages,
 * ensuring 100% compatibility with Expo Snack, local bundlers, and web packagers.
 */
export function zodResolver<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues = TFieldValues
>(
  schema: ZodType<TTransformedValues, any, any>
): Resolver<TFieldValues, TContext, TTransformedValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {} as Record<string, never>,
      };
    }

    const errors: FieldErrors<TFieldValues> = {};
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join('.') as keyof TFieldValues;
      if (fieldPath && !errors[fieldPath]) {
        (errors as any)[fieldPath] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return {
      values: {} as Record<string, never>,
      errors,
    };
  };
}

