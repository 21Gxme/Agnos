import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 bg-blue-600">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Patient Information System</h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex flex-col items-center justify-center py-16 mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome to the Patient Information System</h2>
            <p className="mt-4 text-lg text-gray-500">A real-time system for managing patient information</p>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link
              href="/patient-form"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Patient Form
            </Link>
            <Link
              href="/staff-view"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Staff View
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}