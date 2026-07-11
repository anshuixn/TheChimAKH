import { z } from 'zod';

// Allowed brick variants list
export const ALLOWED_BRICK_VARIANTS = [
  'traditional-red-clay',
  'traditional-red-clay-ii',
] as const;

export const ContactRequestSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .max(100, { message: 'Name must not exceed 100 characters.' }),
  phone: z
    .string()
    .min(1, { message: 'Phone number is required.' })
    .regex(/^[0-9+\s-]{8,20}$/, {
      message: 'Invalid phone number format. Must be 8 to 20 digits, spaces, hyphens, or plus.',
    }),
  email: z
    .string()
    .email({ message: 'Invalid email address format.' })
    .max(254)
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(150, { message: 'Company name must not exceed 150 characters.' })
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(1, { message: 'Message content is required.' })
    .max(3000, { message: 'Message must not exceed 3000 characters.' }),
  submissionId: z
    .string()
    .uuid({ message: 'Submission identifier must be a valid UUID.' }),
  turnstileToken: z
    .string()
    .min(1, { message: 'Security token challenge is required.' }),
  consentCaptured: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Explicit consent is mandatory under data protection guidelines.',
    }),
  _hp: z.string().max(100).optional(),
});

export const QuoteRequestSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required.' })
    .max(100, { message: 'Name must not exceed 100 characters.' }),
  phone: z
    .string()
    .min(1, { message: 'Phone number is required.' })
    .regex(/^[0-9+\s-]{8,20}$/, {
      message: 'Invalid phone number format. Must be 8 to 20 digits.',
    }),
  email: z
    .string()
    .email({ message: 'Invalid email address format.' })
    .max(254)
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(150, { message: 'Company name must not exceed 150 characters.' })
    .optional()
    .or(z.literal('')),
  projectLocation: z
    .string()
    .min(1, { message: 'Delivery coordinate location is required.' })
    .max(250, { message: 'Address must not exceed 250 characters.' }),
  estimatedQty: z
    .string()
    .min(1, { message: 'Quantity is required.' })
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Quantity must be a positive number greater than 0.' }
    ),
  qtyUnit: z
    .string()
    .min(1, { message: 'Quantity unit is required.' })
    .max(50),
  requiredBy: z
    .string()
    .max(30)
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .max(3000, { message: 'Reinforcement message must not exceed 3000 characters.' })
    .optional()
    .or(z.literal('')),
  brickVariant: z
    .enum(ALLOWED_BRICK_VARIANTS, {
      message: 'Selected brick variant classification is invalid.',
    }),
  submissionId: z
    .string()
    .uuid({ message: 'Submission identifier must be a valid UUID.' }),
  turnstileToken: z
    .string()
    .min(1, { message: 'Security token challenge is required.' }),
  consentCaptured: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Explicit consent is mandatory under data protection guidelines.',
    }),
  _hp: z.string().max(100).optional(),
});
