'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/student.service';

const schema = z.object({
  enrollmentNumber: z.string().min(1, 'Enrollment number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  classSection: z.string().optional(),
  ageGroup: z.enum(['6_8', '9_12', '13_18']),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function NewStudentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { schoolId: ownSchoolId, user } = useAuth();
  const schoolId = searchParams.get('schoolId') ?? ownSchoolId;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  if (!schoolId) {
    return (
      <EmptyState
        title="Select a school first"
        description={
          user?.role === 'ryl_admin'
            ? 'Pick a school from the Schools list, then create a student from there.'
            : 'Your account has no school associated with it.'
        }
      />
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const student = await studentService.create({
        ...values,
        schoolId,
        guardianEmail: values.guardianEmail || undefined,
      });
      router.push(`/dashboard/students/${student.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create student');
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Enrollment Number"
            error={errors.enrollmentNumber?.message}
            {...register('enrollmentNumber')}
          />
          <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
          <Select
            label="Gender"
            placeholder="Select gender"
            error={errors.gender?.message}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            {...register('gender')}
          />
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <Select
            label="Age Group"
            placeholder="Select age group"
            error={errors.ageGroup?.message}
            options={[
              { value: '6_8', label: '6-8 years' },
              { value: '9_12', label: '9-12 years' },
              { value: '13_18', label: '13-18 years' },
            ]}
            {...register('ageGroup')}
          />
          <Input
            label="Grade Level"
            type="number"
            error={errors.gradeLevel?.message}
            {...register('gradeLevel')}
          />
          <Input label="Class Section" error={errors.classSection?.message} {...register('classSection')} />
          <Input label="Guardian Name" error={errors.guardianName?.message} {...register('guardianName')} />
          <Input label="Guardian Phone" error={errors.guardianPhone?.message} {...register('guardianPhone')} />
          <Input
            label="Guardian Email"
            type="email"
            error={errors.guardianEmail?.message}
            {...register('guardianEmail')}
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            Create Student
          </Button>
          <Button
            type="button"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function NewStudentPage() {
  return (
    <DashboardShell title="New Student">
      <Suspense fallback={null}>
        <NewStudentForm />
      </Suspense>
    </DashboardShell>
  );
}
