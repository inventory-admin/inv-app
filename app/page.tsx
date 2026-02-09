import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">NGO Inventory Management</h1>
          <p className="text-gray-600 text-lg">Manage schools and track device inventory efficiently</p>
        </div>
        
        {/* View Dashboards Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            View Dashboards
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboards/school-health"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-green-500"
            >
              <div className="text-4xl mb-3">🏫</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">School Health</h3>
              <p className="text-gray-600 text-sm">Monitor school performance</p>
            </Link>

            <Link
              href="/dashboards/maintenance"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-orange-500"
            >
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Maintenance</h3>
              <p className="text-gray-600 text-sm">Track defective items</p>
            </Link>

            <Link
              href="/dashboards/inventory-health"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-purple-500"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Inventory Health</h3>
              <p className="text-gray-600 text-sm">Analyze problem areas</p>
            </Link>

            <Link
              href="/dashboards/overview"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-blue-500"
            >
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Overview</h3>
              <p className="text-gray-600 text-sm">Key metrics and totals</p>
            </Link>

            <Link
              href="/inventory"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-indigo-500"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">View All Inventory</h3>
              <p className="text-gray-600 text-sm">Browse all devices</p>
            </Link>

            <Link
              href="/schools"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-teal-500"
            >
              <div className="text-4xl mb-3">🏫</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">View All Schools</h3>
              <p className="text-gray-600 text-sm">Browse all schools</p>
            </Link>

            <Link
              href="/issues"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 border-t-4 border-pink-500"
            >
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">View All Issues</h3>
              <p className="text-gray-600 text-sm">Track reported issues</p>
            </Link>
          </div>
        </div>

        {/* Manage Inventory Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">🔧</span>
            Manage Inventory
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/schools/new"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <div className="text-4xl mb-3">🏫</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Onboard School</h3>
              <p className="text-gray-600 text-sm">Add new school to system</p>
            </Link>

            <Link
              href="/inventory/update"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Update Inventory</h3>
              <p className="text-gray-600 text-sm">Update status and location</p>
            </Link>

            <Link
              href="/issues/new"
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <div className="text-4xl mb-3">🚨</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Report Issue</h3>
              <p className="text-gray-600 text-sm">Report defective items</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
