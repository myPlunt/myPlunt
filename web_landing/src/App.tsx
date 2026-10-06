import CareTogether from './components/CareTogether'
import Features from './components/Features'
import Hero from './components/Hero'
import HighlightsStrip from './components/HighlightsStrip'
import LivingGarden from './components/LivingGarden'
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
        <Features />
        <LivingGarden />
        <CareTogether />
      </main>
    </div>
  )
}

export default App
