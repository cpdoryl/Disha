'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { schoolService } from '@/services/school.service';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().optional(),
  city: z.string().optional(),
  cityTier: z.enum(['tier_1', 'tier_2', 'tier_3']).optional(),
  boardType: z.enum(['cbse', 'icse', 'ib', 'state', 'other']).optional(),
  studentCount: z.coerce.number().int().min(0).optional(),
  staffCount: z.coerce.number().int().min(0).optional(),
  principalName: z.string().optional(),
  principalPhone: z.string().optional(),
  principalEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export default function NewSchoolPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const school = await schoolService.create({
        ...values,
        principalEmail: values.principalEmail || undefined,
      });
      router.push(`/dashboard/schools/${school.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create school');
    }
  };

  return (
    <DashboardShell title="New School">
      <Card className="mx-auto max-w-2xl">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="School Name" error={errors.name?.message} {...register('name')} />
            <Input label="District" error={errors.district?.message} {...register('district')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Select
              label="City Tier"
              placeholder="Select a tier"
              error={errors.cityTier?.message}
              options={[
                { value: 'tier_1', label: 'Tier 1' },
                { value: 'tier_2', label: 'Tier 2' },
                { value: 'tier_3', label: 'Tier 3' },
              ]}
              {...register('cityTier')}
            />
            <Select
              label="Board Type"
              placeholder="Select a board"
              error={errors.boardType?.message}
              options={[
                { value: 'cbse', label: 'CBSE' },
                { value: 'icse', label: 'ICSE' },
                { value: 'ib', label: 'IB' },
                { value: 'state', label: 'State Board' },
                { value: 'other', label: 'Other' },
              ]}
              {...register('boardType')}
            />
            <Input
              label="Student Count"
              type="number"
              error={errors.studentCount?.message}
              {...register('studentCount')}
            />
            <Input
              label="Staff Count"
              type="number"
              error={errors.staffCount?.message}
              {...register('staffCount')}
            />
            <Input
              label="Principal Name"
              error={errors.principalName?.message}
              {...register('principalName')}
            />
            <Input
              label="Principal Phone"
              error={errors.principalPhone?.message}
              {...register('principalPhone')}
            />
            <Input
              label="Principal Email"
              type="email"
              error={errors.principalEmail?.message}
              {...register('principalEmail')}
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Create School
            </Button>
            <Button type="button" className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
