"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSocket } from "@/lib/useSocket"

// Define patient data type
type PatientData = {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: string
  phoneNumber: string
  email: string
  address: string
  preferredLanguage: string
  nationality: string
  emergencyContact?: string
  religion?: string
  status: "submitted" | "active" | "inactive"
  submittedAt: string
}

// Define live form update type
type LiveFormData = {
  socketId: string
  formData: any
  timestamp?: string
}

export default function StaffViewPage() {
  const { socket, isConnected } = useSocket()
  const [patients, setPatients] = useState<PatientData[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [liveForms, setLiveForms] = useState<Record<string, any>>({})
  const [showLiveForms, setShowLiveForms] = useState(true)
  const [lastUpdatedField, setLastUpdatedField] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load from localStorage first as a fallback
    try {
      const storedPatients = localStorage.getItem("patients")
      if (storedPatients) {
        const parsedPatients = JSON.parse(storedPatients)
        setPatients(parsedPatients)
        console.log("Loaded patients from localStorage:", parsedPatients.length)
      }
    } catch (error) {
      console.error("Error loading patients from localStorage:", error)
    }

    // If no socket connection, try to fetch patients from API
    if (!socket || !isConnected) {
      fetch("/api/patients")
        .then((response) => {
          if (response.ok) return response.json()
          throw new Error("Failed to fetch patients")
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setPatients(data)
            console.log("Loaded patients from API:", data.length)
          }
        })
        .catch((error) => {
          console.error("Error fetching patients from API:", error)
        })
    }

    if (!socket) return

    // Set up socket event handlers
    const onInitialPatients = (initialPatients: PatientData[]) => {
      console.log("Received initial patients:", initialPatients.length)
      if (initialPatients.length > 0) {
        setPatients(initialPatients)
      }
    }

    const onNewPatient = (newPatient: PatientData) => {
      console.log("Received new patient:", newPatient.id)
      setPatients((prev) => {
        // Check if patient already exists to avoid duplicates
        const exists = prev.some((p) => p.id === newPatient.id)
        if (exists) return prev
        return [...prev, newPatient]
      })

      // Remove from live forms if it was there
      setLiveForms((prev) => {
        const newForms = { ...prev }
        // Find by email or other identifying info
        Object.keys(newForms).forEach((key) => {
          if (newForms[key].email === newPatient.email) {
            delete newForms[key]
          }
        })
        return newForms
      })
    }

    const onPatientUpdated = (updatedPatient: PatientData) => {
      console.log("Received updated patient:", updatedPatient.id)
      setPatients((prev) => prev.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient)))
    }

    // Handle real-time form updates
    const onFormLiveUpdate = (data: LiveFormData) => {
      console.log("Received live form update from:", data.socketId)

      // Find which field was updated
      if (liveForms[data.socketId]) {
        const oldForm = liveForms[data.socketId]
        const newForm = data.formData

        // Compare old and new form data to find what changed
        Object.keys(newForm).forEach((key) => {
          if (oldForm[key] !== newForm[key]) {
            setLastUpdatedField((prev) => ({
              ...prev,
              [data.socketId]: key,
            }))
          }
        })
      }

      setLiveForms((prev) => ({
        ...prev,
        [data.socketId]: {
          ...data.formData,
          lastUpdated: data.timestamp || new Date().toISOString(),
        },
      }))
    }

    // Handle form becoming inactive
    const onFormInactive = (socketId: string) => {
      console.log("Form became inactive:", socketId)
      setLiveForms((prev) => {
        const newForms = { ...prev }
        delete newForms[socketId]
        return newForms
      })

      // Also remove from lastUpdatedField
      setLastUpdatedField((prev) => {
        const newFields = { ...prev }
        delete newFields[socketId]
        return newFields
      })
    }

    socket.on("initial-patients", onInitialPatients)
    socket.on("patient:new", onNewPatient)
    socket.on("patient:updated", onPatientUpdated)
    socket.on("form:live-update", onFormLiveUpdate)
    socket.on("form:inactive", onFormInactive)

    // Clean up event listeners
    return () => {
      socket.off("initial-patients", onInitialPatients)
      socket.off("patient:new", onNewPatient)
      socket.off("patient:updated", onPatientUpdated)
      socket.off("form:live-update", onFormLiveUpdate)
      socket.off("form:inactive", onFormInactive)
    }
  }, [socket, isConnected, liveForms])

  // Filter patients based on active tab
  const filteredPatients = patients.filter((patient) => {
    if (activeTab === "all") return true
    return patient.status === activeTab
  })

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-500"
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  // Get field label
  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      firstName: "First Name",
      middleName: "Middle Name",
      lastName: "Last Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      phoneNumber: "Phone Number",
      email: "Email",
      address: "Address",
      preferredLanguage: "Preferred Language",
      nationality: "Nationality",
      emergencyContact: "Emergency Contact",
      religion: "Religion",
      termsAccepted: "Terms Accepted",
    }
    return labels[fieldName] || fieldName
  }

  // Handle status change
  const handleStatusChange = (patientId: string, newStatus: "submitted" | "active" | "inactive") => {
    const patientToUpdate = patients.find((p) => p.id === patientId)

    if (!patientToUpdate) return

    const updatedPatient = { ...patientToUpdate, status: newStatus }

    if (socket && isConnected) {
      // Send update via WebSocket
      socket.emit("patient:update", updatedPatient)
    } else {
      // Fallback to localStorage
      const updatedPatients = patients.map((patient) => (patient.id === patientId ? updatedPatient : patient))

      setPatients(updatedPatients)
      localStorage.setItem("patients", JSON.stringify(updatedPatients))
    }
  }

  // Handle edit patient
  const handleEditPatient = (patientId: string) => {
    window.location.href = `/patient-form?id=${patientId}`
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 bg-blue-600">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">
            <Link href="/" className="hover:underline">
              Patient Information System
            </Link>
          </h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8 mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="mb-6 text-2xl font-bold">Staff View - Patient Monitoring</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Patient Monitoring Dashboard</h3>
                  <p className="text-sm text-gray-500">View and manage patient information in real-time</p>
                </div>
              </div>

              <div className="border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "all"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    All Patients
                  </button>
                  <button
                    onClick={() => setActiveTab("submitted")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "submitted"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Submitted
                  </button>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "active"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setShowLiveForms(!showLiveForms)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      showLiveForms
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Live Forms {Object.keys(liveForms).length > 0 && `(${Object.keys(liveForms).length})`}
                  </button>
                </nav>
              </div>

              {/* Live Forms Section */}
              {showLiveForms && Object.keys(liveForms).length > 0 && (
                <div className="mb-8">
                  <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="mb-2 text-lg font-medium text-blue-800">Live Form Updates</h3>
                    <p className="mb-4 text-sm text-blue-600">
                      These forms are currently being filled out by patients in real-time.
                    </p>

                    <div className="space-y-4">
                      {Object.entries(liveForms).map(([socketId, formData]) => (
                        <div key={socketId} className="p-4 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              {formData.firstName || "Anonymous"} {formData.lastName || "Patient"}
                            </h4>
                            <div className="flex items-center">
                              <span className="mr-2 text-xs text-blue-500">
                                {lastUpdatedField[socketId]
                                  ? `Typing in ${getFieldLabel(lastUpdatedField[socketId])}...`
                                  : "Typing..."}
                              </span>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Personal Information</p>
                              <div className="mt-2 space-y-2">
                                {/* First Name */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">First Name</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "firstName" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.firstName || "—"}
                                  </p>
                                </div>

                                {/* Last Name */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Last Name</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "lastName" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.lastName || "—"}
                                  </p>
                                </div>

                                {/* Date of Birth */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Date of Birth</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "dateOfBirth" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.dateOfBirth || "—"}
                                  </p>
                                </div>

                                {/* Gender */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Gender</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "gender" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.gender
                                      ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
                                      : "—"}
                                  </p>
                                </div>

                                {/* Nationality */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Nationality</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "nationality" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.nationality || "—"}
                                  </p>
                                </div>

                                {/* Language */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Preferred Language</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "preferredLanguage" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.preferredLanguage
                                      ? formData.preferredLanguage.charAt(0).toUpperCase() +
                                        formData.preferredLanguage.slice(1)
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700">Contact Information</p>
                              <div className="mt-2 space-y-2">
                                {/* Phone */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Phone Number</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "phoneNumber" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.phoneNumber || "—"}
                                  </p>
                                </div>

                                {/* Email */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "email" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.email || "—"}
                                  </p>
                                </div>

                                {/* Address */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Address</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "address" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.address || "—"}
                                  </p>
                                </div>

                                {/* Emergency Contact */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Emergency Contact</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "emergencyContact" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.emergencyContact || "—"}
                                  </p>
                                </div>

                                {/* Religion */}
                                <div className="p-2 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-500">Religion</p>
                                  <p
                                    className={`text-sm ${lastUpdatedField[socketId] === "religion" ? "font-bold text-blue-600" : ""}`}
                                  >
                                    {formData.religion || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-hidden bg-white rounded-lg shadow">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Patient List</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filteredPatients.length} patients {activeTab !== "all" ? `with ${activeTab} status` : "in total"}
                  </p>
                </div>

                <div className="px-4 py-5 sm:p-6">
                  {filteredPatients.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-gray-500">No patients found</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[600px]">
                      <div className="space-y-4">
                        {filteredPatients.map((patient) => (
                          <div key={patient.id} className="overflow-hidden bg-white border rounded-lg shadow-sm">
                            <div className="flex flex-col md:flex-row">
                              <div className="flex items-center p-4 space-x-4 border-b md:w-1/3 md:border-b-0 md:border-r">
                                <div
                                  className={`h-12 w-12 rounded-full flex items-center justify-center text-white ${getStatusColor(patient.status)}`}
                                >
                                  {getInitials(patient.firstName, patient.lastName)}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {patient.firstName} {patient.middleName ? `${patient.middleName.charAt(0)}. ` : ""}
                                    {patient.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500">{patient.email}</p>
                                  <div className="flex mt-2 space-x-2">
                                    <select
                                      value={patient.status}
                                      onChange={(e) => handleStatusChange(patient.id, e.target.value as any)}
                                      className="p-1 text-xs border border-gray-300 rounded-md"
                                    >
                                      <option value="submitted">Submitted</option>
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>

                                    <button
                                      onClick={() => handleEditPatient(patient.id)}
                                      className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2">
                                <div>
                                  <p className="text-sm font-medium">Personal Information</p>
                                  <ul className="mt-2 space-y-1 text-sm">
                                    <li>
                                      <span className="text-gray-500">DOB:</span> {patient.dateOfBirth}
                                    </li>
                                    <li>
                                      <span className="text-gray-500">Gender:</span>{" "}
                                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                                    </li>
                                    <li>
                                      <span className="text-gray-500">Nationality:</span> {patient.nationality}
                                    </li>
                                    <li>
                                      <span className="text-gray-500">Language:</span>{" "}
                                      {patient.preferredLanguage.charAt(0).toUpperCase() +
                                        patient.preferredLanguage.slice(1)}
                                    </li>
                                  </ul>
                                </div>

                                <div>
                                  <p className="text-sm font-medium">Contact Information</p>
                                  <ul className="mt-2 space-y-1 text-sm">
                                    <li>
                                      <span className="text-gray-500">Phone:</span> {patient.phoneNumber}
                                    </li>
                                    <li>
                                      <span className="text-gray-500">Address:</span> {patient.address}
                                    </li>
                                    {patient.emergencyContact && (
                                      <li>
                                        <span className="text-gray-500">Emergency:</span> {patient.emergencyContact}
                                      </li>
                                    )}
                                    <li>
                                      <span className="text-gray-500">Submitted:</span>{" "}
                                      {formatDate(patient.submittedAt)}
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="px-6 py-4 border-t bg-gray-50">
        <div className="container mx-auto text-sm text-center text-gray-500">
          &copy; {new Date().getFullYear()} Patient Information System
        </div>
      </footer>
    </div>
  )
}

