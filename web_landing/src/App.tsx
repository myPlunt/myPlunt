import CareTogether from './components/CareTogether'
import DownloadCta from './components/DownloadCta'
import Faq from './components/Faq'
import Features from './components/Features'
import Footer from './components/Footer'
import Hero from './components/Hero'
import HighlightsStrip from './components/HighlightsStrip'
import HowItWorks from './components/HowItWorks'
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
        <HowItWorks />
        <Faq />
        <DownloadCta />
      </main>
      <Footer />
    </div>
  )
}

export default App
