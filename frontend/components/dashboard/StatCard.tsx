interface StatCardProps {
  title: string
  value: string | number
  change: string
  icon: string
}

export default function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change.startsWith('+')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p
            className={`text-sm font-medium mt-2 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change} from last month
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}
