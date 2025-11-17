import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <header className="flex items-center justify-between mb-16">
            <h1 className="text-3xl font-bold gradient-text">ML Insights</h1>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="jungle" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </header>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center space-y-8 py-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Train Machine Learning Models
              <span className="gradient-text block mt-2">Without Writing Code</span>
            </h2>

            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Upload your data, select an algorithm, and get insights in minutes.
              Perfect for data scientists, analysts, and business professionals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/auth/signup">
                <Button variant="jungle" size="lg">
                  Start Training Models
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="max-w-6xl mx-auto py-24">
            <h3 className="text-3xl font-bold text-center text-white mb-12">
              Everything You Need for ML Success
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Easy Data Upload</h4>
                <p className="text-white/70">
                  Upload CSV files up to 100MB. Automatic data validation and preprocessing included.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">5 ML Algorithms</h4>
                <p className="text-white/70">
                  Choose from Logistic Regression, Random Forest, Gradient Boosting, Linear Regression, and KNN.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Visual Insights</h4>
                <p className="text-white/70">
                  Interactive charts, confusion matrices, feature importance, and more visualization tools.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Fast Training</h4>
                <p className="text-white/70">
                  Most models train in under 5 minutes. Real-time progress tracking included.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Model Comparison</h4>
                <p className="text-white/70">
                  Train multiple models and compare them side-by-side to find the best performer.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="card text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">Export Predictions</h4>
                <p className="text-white/70">
                  Make predictions on new data and download results as CSV files.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto text-center py-16 space-y-6">
            <h3 className="text-4xl font-bold text-white">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-white/70">
              Join data scientists and analysts using ML Insights to unlock the power of machine learning.
            </p>
            <Link href="/auth/signup">
              <Button variant="jungle" size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
