import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 bg-blue-600">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">
            <Link href="/" className="hover:underline">
              Patient Information System
            </Link>
          </h1>
        </div>
      </header>
      <main className="flex items-center justify-center flex-1">
        <div className="container py-8 mx-auto">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold">Thank You!</h2>
            <p className="mb-6 text-gray-500">
              Your information has been submitted successfully. Our staff will
              review your information and contact you if needed.
            </p>
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return Home
              </Link>
              <Link
                href="/patient-form"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Another Form
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="px-6 py-4 border-t bg-gray-50">
        <div className="container mx-auto text-sm text-center text-gray-500">
          &copy; {new Date().getFullYear()} Patient Information System
        </div>
      </footer>
    </div>
  );
}