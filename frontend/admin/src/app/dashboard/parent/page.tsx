'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { useAsync } from '@/hooks/useAsync';
import { studentService } from '@/services/student.service';
import { feeService } from '@/services/fee.service';
import { notificationService } from '@/services/notification.service';
import { communicationService } from '@/services/communication.service';
import type { Notification } from '@/types/notification';
import type { CommunicationEntry } from '@/types/org';

export default function ParentDashboardPage() {
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const children = useAsync(() => studentService.getMyChildren(), []);
  const childIds = children.data?.map((c) => c.id).join(',') ?? '';

  const feeSummaries = useAsync(
    () => Promise.all((children.data ?? []).map((c) => feeService.getFeeLedgerByStudent(c.id))),
    [childIds],
    Boolean(children.data?.length),
  );

  const outstandingFees = (feeSummaries.data ?? [])
    .flat()
    .filter((entry) => entry.status !== 'paid' && entry.status !== 'waived').length;

  const notifications = useAsync(
    () => notificationService.getMyNotifications(),
    [notificationRefreshKey],
  );
  const unreadNotifications = notifications.data?.filter((n) => !n.isRead).length ?? 0;

  const messages = useAsync(() => communicationService.getMyMessages(), []);
  const pendingMessages = messages.data?.filter((m) => m.status === 'pending').length ?? 0;

  const handleMarkAsRead = async (id: string) => {
    setMarkingReadId(id);
    try {
      await notificationService.markAsRead(id);
      setNotificationRefreshKey((k) => k + 1);
    } finally {
      setMarkingReadId(null);
    }
  };

  const notificationColumns: DataTableColumn<Notification>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      sortValue: (n) => n.createdAt,
      render: (n) => new Date(n.createdAt).toLocaleDateString(),
    },
    { key: 'title', header: 'Title', render: (n) => n.title },
    { key: 'message', header: 'Message', render: (n) => n.message },
    {
      key: 'isRead',
      header: 'Status',
      render: (n) =>
        n.isRead ? (
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Read
          </span>
        ) : (
          <Button
            className="w-auto px-2 py-1 text-xs"
            isLoading={markingReadId === n.id}
            onClick={() => handleMarkAsRead(n.id)}
          >
            Mark as read
          </Button>
        ),
    },
  ];

  const messageColumns: DataTableColumn<CommunicationEntry>[] = [
    {
      key: 'queryDate',
      header: 'Date',
      sortable: true,
      sortValue: (m) => m.queryDate,
      render: (m) => new Date(m.queryDate).toLocaleDateString(),
    },
    { key: 'queryTopic', header: 'Topic', render: (m) => m.queryTopic },
    { key: 'queryChannel', header: 'Channel', render: (m) => m.queryChannel },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {m.status}
        </span>
      ),
    },
  ];

  return (
    <DashboardShell title="Parent Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="My Children"
            value={children.data?.length ?? '—'}
            isLoading={children.isLoading}
          />
          <StatCard
            label="Outstanding Fee Entries"
            value={children.data?.length ? outstandingFees : '—'}
            isLoading={feeSummaries.isLoading}
          />
          <StatCard
            label="Notifications"
            value={notifications.data ? unreadNotifications : '—'}
            hint="Unread"
            isLoading={notifications.isLoading}
          />
          <StatCard
            label="Messages"
            value={messages.data ? pendingMessages : '—'}
            hint="Awaiting a response"
            isLoading={messages.isLoading}
          />
        </div>

        {children.error ? (
          <EmptyState
            title="Could not load your children"
            description="Your account may not be linked to a student record yet — contact your school admin to have it linked."
          />
        ) : (
          <StudentTable students={children.data ?? []} title="My Children" />
        )}

        <Card>
          <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Notifications</p>
          {notifications.error ? (
            <EmptyState title="Could not load notifications" description={notifications.error.message} />
          ) : (
            <DataTable
              columns={notificationColumns}
              rows={notifications.data ?? []}
              rowKey={(n) => n.id}
              emptyMessage="No notifications yet."
            />
          )}
        </Card>

        <Card>
          <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Messages</p>
          {messages.error ? (
            <EmptyState title="Could not load messages" description={messages.error.message} />
          ) : (
            <DataTable
              columns={messageColumns}
              rows={messages.data ?? []}
              rowKey={(m) => m.id}
              emptyMessage="No messages logged yet."
            />
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
