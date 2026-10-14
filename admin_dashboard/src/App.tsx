import Overview from './components/Overview'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-5 py-8 sm:px-10 sm:py-12">
        <Overview />
      </main>
    </div>
  )
}

export default App
