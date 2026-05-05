// Declarações de tipos globais para o BetAnalytics

// Permite importar ficheiros CSS em TypeScript
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
