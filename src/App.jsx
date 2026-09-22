import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hometwo from './pages/Hometwo'
import ScrollTop from './components/ScollTop'
import ScrollToTopOnRouteChange from './components/Scrolltotoponroutechange'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-white">
        <div
          aria-hidden
          className="fixed inset-0 z-[45] pointer-events-none"
          style={{
            background:
              "radial-gradient(130% 105% at 50% 42%, transparent 64%, rgba(6,26,28,0.035) 86%, rgba(6,26,28,0.09) 100%)",
          }}
        />

        <ScrollToTopOnRouteChange />
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="*" element={<Hometwo />} />
          </Routes>
        </main>

        <Footer />
        <ScrollTop />
      </div>
    </BrowserRouter>
  )
}
