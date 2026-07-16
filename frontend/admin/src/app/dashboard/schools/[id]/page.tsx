'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, StatCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { schoolService } from '@/services/school.service';
import Link from 'next/link';

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

export default function SchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isRylAdmin = user?.role === 'ryl_admin';

  const [refreshKey, setRefreshKey] = useState(0);
  const school = useAsync(() => schoolService.getById(params.id), [params.id, refreshKey]);
  const metrics = useAsync(() => schoolService.getMetrics(params.id), [params.id, refreshKey]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (school.data) {
      reset({
        name: school.data.name,
        district: school.data.district,
        state: school.data.state ?? '',
        city: school.data.city ?? '',
        cityTier: school.data.cityTier ?? undefined,
        boardType: school.data.boardType ?? undefined,
        studentCount: school.data.studentCount ?? undefined,
        staffCount: school.data.staffCount ?? undefined,
        principalName: school.data.principalName ?? '',
        principalPhone: school.data.principalPhone ?? '',
        principalEmail: school.data.principalEmail ?? '',
      });
    }
  }, [school.data, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await schoolService.update(params.id, { ...values, principalEmail: values.principalEmail || undefined });
      setSubmitSuccess(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update school');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this school? This can be reversed later via the API.')) return;
    await schoolService.deactivate(params.id);
    setRefreshKey((k) => k + 1);
  };

  if (school.error) {
    return (
      <DashboardShell title="School">
        <EmptyState
          title="Could not load this school"
          description={
            school.error.message.includes('403')
              ? "You don't have permission to view this school."
              : school.error.message
          }
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={school.data?.name ?? 'School'}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Students" value={metrics.data?.studentCount ?? '—'} isLoading={metrics.isLoading} />
          <StatCard label="Staff" value={metrics.data?.staffCount ?? '—'} isLoading={metrics.isLoading} />
          <StatCard
            label="Status"
            value={school.data ? (school.data.isActive ? 'Active' : 'Inactive') : '—'}
            isLoading={school.isLoading}
          />
          <div className="flex items-center justify-center">
            <Link href={`/dashboard/students?schoolId=${params.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
              View students →
            </Link>
          </div>
        </div>

        <Card>
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
            {submitSuccess && <p className="text-sm text-green-600">School updated successfully.</p>}

            <div className="flex items-center justify-between">
              <Button type="submit" className="w-auto" isLoading={isSubmitting}>
                Save Changes
              </Button>
              {isRylAdmin && school.data?.isActive && (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Deactivate School
                </button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
