import Hero from './components/Hero'
import HighlightsStrip from './components/HighlightsStrip'
import Navigation from './components/Navigation'
import Problem from './components/Problem'

function App() {
  return (
    <div id="top">
      <Navigation />
      <main>
        <Hero />
        <HighlightsStrip />
        <Problem />
      </main>
    </div>
  )
}

export default App
