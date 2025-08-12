import { useState } from 'react'
import KeyMapperViewer from './components/KeyMapperViewer'
import AIQueryIterator from './components/AIQueryIterator'
import ChatbotQueryExecutor from './components/ChatbotQueryExecutor'

function App() {
  const [devMode, setDevMode] = useState(false)

  return (
    <>
      <KeyMapperViewer />
    </>
  )
}

export default App
