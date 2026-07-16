export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  );
}
