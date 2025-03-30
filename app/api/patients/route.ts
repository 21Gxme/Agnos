import { type NextRequest, NextResponse } from "next/server"

// Get all patients
export async function GET() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let patients: any[] = []

  if (typeof global !== "undefined" && global.patients) {
    patients = global.patients
  } else {
    console.log("Using empty patients array as fallback")
  }

  return NextResponse.json(patients)
}

// POST handler for submitting patient data
export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json()

    const newPatient = {
      ...patientData,
      id: patientData.id || Date.now().toString(),
      status: patientData.status || "submitted",
      submittedAt: patientData.submittedAt || new Date().toISOString(),
    }

    // Add to global patients array if available
    if (typeof global !== "undefined" && Array.isArray(global.patients)) {
      global.patients.push(newPatient)

      // Try to broadcast via WebSocket if available
      if (global.socketIo) {
        global.socketIo.emit("patient:new", newPatient)
      }
    } else {
      console.log("Could not access global patients array, client will use localStorage")
    }

    return NextResponse.json({ success: true, patient: newPatient })
  } catch (error) {
    console.error("Error processing patient data:", error)
    return NextResponse.json({ error: "Failed to process patient data" }, { status: 500 })
  }
}

// PUT handler for updating patient data
export async function PUT(request: NextRequest) {
  try {
    const patientData = await request.json()

    let updated = false

    // Update patient in global array if available
    if (typeof global !== "undefined" && Array.isArray(global.patients)) {
      global.patients = global.patients.map((patient) => (patient.id === patientData.id ? patientData : patient))

      // Try to broadcast via WebSocket if available
      if (global.socketIo) {
        global.socketIo.emit("patient:updated", patientData)
      }

      updated = true
    }

    if (updated) {
      return NextResponse.json({ success: true, patient: patientData })
    } else {
      return NextResponse.json({
        success: true,
        patient: patientData,
        warning: "Used client-side storage",
      })
    }
  } catch (error) {
    console.error("Error updating patient data:", error)
    return NextResponse.json({ error: "Failed to update patient data" }, { status: 500 })
  }
}

