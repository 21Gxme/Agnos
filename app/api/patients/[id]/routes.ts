import { type NextRequest, NextResponse } from "next/server"

// Extend the global type to include the patients property
/* eslint-enable no-var */
declare global {
  var patients: any[] | undefined
  var socketIo: any | undefined
}

// Get a specific patient by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  // Access the global patients array
  let patients: any[] = []

  // Try to get from localStorage on the client side
  // For server-side, we'll use the global variable
  if (typeof global !== "undefined" && global.patients) {
    patients = global.patients
  } else {
    // This is a fallback for when we can't access the global variable
    // In production, you would use a database instead
    console.log("Using empty patients array as fallback")
  }

  // Find the patient
  const patient = patients.find((p) => p.id === id)

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  return NextResponse.json(patient)
}

// Update a specific patient
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const updatedData = await request.json()

    // Access the global patients array
    let patients: any[] = []
    let updated = false

    if (typeof global !== "undefined" && global.patients) {
      patients = global.patients

      // Update the patient in the global array
      global.patients = patients.map((patient) => (patient.id === id ? { ...patient, ...updatedData } : patient))

      // Try to broadcast via WebSocket if available
      if (global.socketIo) {
        const updatedPatient = global.patients.find((p) => p.id === id)
        global.socketIo.emit("patient:updated", updatedPatient)
      }

      updated = true
    }

    if (updated) {
      return NextResponse.json({ success: true, patient: updatedData })
    } else {
      // If we couldn't update the global array, return a 200 anyway
      // The client will handle the update in localStorage
      console.log("Could not update global patients array, client will use localStorage")
      return NextResponse.json({ success: true, patient: updatedData, warning: "Used client-side storage" })
    }
  } catch (error) {
    console.error("Error updating patient:", error)
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

