import './App.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import AES from 'crypto-js/aes'

type TPeers = {
  name: string
  index: string
}

function App() {
  const socketRef = useRef<WebSocket>()

  const inputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')

  const idRef = useRef('')

  const [peers, setPeers] = useState<TPeers[]>([])

  // @ts-ignore
  const setMessageEvent = useCallback(() => {
    if (socketRef.current?.onopen === null) {
      socketRef.current?.addEventListener('open', event => {
        start()
      })
    }
    if (socketRef.current?.onclose === null) {
      socketRef.current?.addEventListener('close', event => {
        initSocket()
      })
    }
    if (socketRef.current?.onerror === null) {
      socketRef.current?.addEventListener('error', event => {
        initSocket()
      })
    }
    if (socketRef.current?.onmessage === null) {
      socketRef.current?.addEventListener('message', event => {
        const passed = JSON.parse(event.data)
        const value: Record<string, string> = passed
        const keys = Object.keys(value)
        if (!keys.includes('do')) {
          return
        }
        switch (value.do) {
          case 'peers':
            const found = (passed.peers as TPeers[]).find(one => one.index === idRef.current)
            const sentName = found && found.name ? found.name : ''
            if (name !== sentName) setName(sentName)
            setPeers(passed.peers)
            break
          case 'pong':
            break
          case 'reset':
            newId('')
            socketSend(
              JSON.stringify({
                do: 'reset',
                index: idRef.current,
                room: passed.room,
              })
            )
            break
        }
      })
    }
  })

  // @ts-ignore
  const initSocket = useCallback(() => {
    if (!socketRef.current || socketRef.current?.readyState > 1) {
      try {
        socketRef.current = new WebSocket('ws://localhost:8100/websockets')
        if (socketRef.current) setMessageEvent()
      } catch (Error) {
        console.error('WebSocket not available')
      }
      return true
    }
    return false
    // @ts-ignore
  }, [setMessageEvent])

  const newId = async (name: string) => {
    const useName = name !== '' ? name : undefined
    const id = AES.encrypt(
      useName || Math.floor(Math.random() * 1000).toString(16),
      Math.ceil(Date.now() / Math.random()).toString()
    ).toString()
    idRef.current = id
  }

  const socketSend = useCallback(
    (message: string) => {
      if (!socketRef.current || socketRef.current?.readyState > 1) {
        initSocket()
      }

      if (socketRef.current?.readyState === 1) {
        socketRef.current?.send(message)
      }
    },
    [initSocket]
  )

  const start = useCallback(async () => {
    if (idRef.current === '') await newId(name)
    socketSend(JSON.stringify({ do: 'ping', index: idRef.current }))
  }, [socketSend])

  useEffect(() => {
    initSocket()
  }, [])

  return (
    <div className='App'>
      {name === '' && (
        <form
          onSubmit={event => {
            event.preventDefault()
            setName(inputRef.current?.value || '')
            socketSend(
              JSON.stringify({
                do: 'nick',
                index: idRef.current,
                name: inputRef.current?.value || '',
              })
            )
          }}
        >
          <label htmlFor='nick'>Jméno: </label>
          <input name='nick' type='text' ref={inputRef} data-testid='input' />
          <button type='submit' data-testid='button'>
            použít
          </button>
        </form>
      )}
      {peers.map((one, idx) => (
        <div key={idx}>{one.name}</div>
      ))}
    </div>
  )
}

export default App
