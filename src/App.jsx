import { useState } from 'react'
import KeyMapperViewer from './components/KeyMapperViewer'
import AIQueryIterator from './components/AIQueryIterator'

function App() {
  const [devMode, setDevMode] = useState(false)

  return (
    <>
      {devMode ? (
        <KeyMapperViewer />
      ) : (
        <AIQueryIterator onDevModeToggle={() => setDevMode(true)} />
      )}
    </>
  )
}

export default App
