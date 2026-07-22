export function Footer() {
  return (
    <footer className="border-t border-gray-800/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>⚡</span>
            <span>Pokédex — powered by <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">PokeAPI</a></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Built with deepseek-v4-flash</span>
            <span>·</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
