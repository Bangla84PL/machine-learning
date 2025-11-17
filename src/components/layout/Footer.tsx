export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto bg-black/30 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-4 text-center">
        <p className="text-white/80 text-sm">
          © Created with{' '}
          <span className="text-red-400">❤️</span> by{' '}
          <a
            href="https://smartcamp.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-emerald-500 transition-colors font-medium"
          >
            SmartCamp.AI
          </a>
        </p>
      </div>
    </footer>
  )
}
