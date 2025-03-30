"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

// Global socket instance to be shared across components
let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection if it doesn't exist
    if (!socket) {
      // In development, connect to the local server
      // In production on Vercel, this will connect to the same domain
      const socketUrl = process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3000"

      socket = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      })

      console.log("Socket initialized")
    }

    // Set up event listeners
    const onConnect = () => {
      setIsConnected(true)
      console.log("Socket connected")
    }

    const onDisconnect = () => {
      setIsConnected(false)
      console.log("Socket disconnected")
    }

    const onError = (error: Error) => {
      console.error("Socket error:", error)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onError)

    // If socket is already connected, set state accordingly
    if (socket.connected) {
      setIsConnected(true)
    }

    // Clean up event listeners on unmount
    return () => {
      socket?.off("connect", onConnect)
      socket?.off("disconnect", onDisconnect)
      socket?.off("connect_error", onError)
    }
  }, [])

  return { socket, isConnected }
}

