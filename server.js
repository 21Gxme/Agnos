const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// In-memory storage for patient data (replace with database in production)
let patients = []

// In-memory storage for active form sessions
const activeForms = new Map()

// Make these available globally
global.patients = patients
global.activeForms = activeForms

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Configure Socket.IO with CORS enabled
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your actual domain
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
    // Enable all transports (WebSocket, polling)
    transports: ["websocket", "polling"],
  })

  // Make io available globally
  global.socketIo = io

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Send existing patients to newly connected client
    socket.emit("initial-patients", patients)

    // Handle real-time form updates
    socket.on("form:update", (formData) => {
      // Store the form data with the socket ID as the key
      activeForms.set(socket.id, formData)

      // Broadcast to staff clients only
      socket.broadcast.emit("form:live-update", {
        socketId: socket.id,
        formData: formData,
      })
    })

    // Handle new patient submission
    socket.on("patient:submit", (patientData) => {
      console.log("New patient submitted:", patientData.id)

      const newPatient = {
        ...patientData,
        id: patientData.id || Date.now().toString(),
        status: patientData.status || "submitted",
        submittedAt: patientData.submittedAt || new Date().toISOString(),
      }

      // Add to in-memory storage
      patients.push(newPatient)

      // Remove from active forms
      activeForms.delete(socket.id)

      // Broadcast to all clients
      io.emit("patient:new", newPatient)
    })

    // Handle patient status update
    socket.on("patient:update", (updatedPatient) => {
      console.log("Patient updated:", updatedPatient.id)

      // Update in-memory storage
      patients = patients.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient))

      // Update global reference
      global.patients = patients

      // Broadcast to all clients
      io.emit("patient:updated", updatedPatient)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)

      // Remove from active forms when disconnected
      activeForms.delete(socket.id)

      // Notify staff that this form is no longer active
      io.emit("form:inactive", socket.id)
    })
  })

  server.listen(3000, (err) => {
    if (err) throw err
    console.log("> Ready on http://localhost:3000")
  })
})

