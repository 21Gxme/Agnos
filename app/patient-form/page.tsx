"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSocket } from "@/lib/useSocket"

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function PatientFormPage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const emitFormUpdate = (data: any) => {
    if (socket && isConnected) {
      socket.emit("form:update", data)
    }
  }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
    address: "",
    preferredLanguage: "",
    nationality: "",
    emergencyContact: "",
    religion: "",
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [originalPatient, setOriginalPatient] = useState<any>(null)

  // Check if we're editing an existing patient
  useEffect(() => {
    // Check URL for patient ID
    const searchParams = new URLSearchParams(window.location.search)
    const id = searchParams.get("id")

    if (id) {
      setIsEditing(true)
      setPatientId(id)

      // Fetch patient data
      const fetchPatient = async () => {
        try {
          // Try to get from localStorage first
          const storedPatients = JSON.parse(localStorage.getItem("patients") || "[]")
          const patient = storedPatients.find((p: any) => p.id === id)

          if (patient) {
            setOriginalPatient(patient)
            setFormData({
              firstName: patient.firstName || "",
              middleName: patient.middleName || "",
              lastName: patient.lastName || "",
              dateOfBirth: patient.dateOfBirth || "",
              gender: patient.gender || "",
              phoneNumber: patient.phoneNumber || "",
              email: patient.email || "",
              address: patient.address || "",
              preferredLanguage: patient.preferredLanguage || "",
              nationality: patient.nationality || "",
              emergencyContact: patient.emergencyContact || "",
              religion: patient.religion || "",
              termsAccepted: true,
            })
            return
          }

          // If not in localStorage, try API
          const response = await fetch(`/api/patients/${id}`)
          if (response.ok) {
            const patient = await response.json()
            setOriginalPatient(patient)
            setFormData({
              firstName: patient.firstName || "",
              middleName: patient.middleName || "",
              lastName: patient.lastName || "",
              dateOfBirth: patient.dateOfBirth || "",
              gender: patient.gender || "",
              phoneNumber: patient.phoneNumber || "",
              email: patient.email || "",
              address: patient.address || "",
              preferredLanguage: patient.preferredLanguage || "",
              nationality: patient.nationality || "",
              emergencyContact: patient.emergencyContact || "",
              religion: patient.religion || "",
              termsAccepted: true,
            })
          }
        } catch (error) {
          console.error("Error fetching patient data:", error)
        }
      }

      fetchPatient()
    }
  }, [])

  // Emit form updates in real-time
  useEffect(() => {
    // Only emit if we have some data and we're not just initializing
    if (isConnected && formData.firstName && !isEditing) {
      emitFormUpdate({
        ...formData,
        isLiveUpdate: true,
        timestamp: new Date().toISOString(),
      })
    }
  }, [formData, isConnected, emitFormUpdate, isEditing])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // If editing, also emit updates in real-time
    if (isEditing && isConnected && name) {
      emitFormUpdate({
        ...formData,
        [name]: value,
        isLiveUpdate: true,
        isEditing: true,
        patientId: patientId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // If editing, also emit updates in real-time
    if (isEditing && isConnected && name) {
      emitFormUpdate({
        ...formData,
        [name]: checked,
        isLiveUpdate: true,
        isEditing: true,
        patientId: patientId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Handle radio change
  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }))

    // Clear error when field is edited
    if (errors.gender) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.gender
        return newErrors
      })
    }

    // If editing, also emit updates in real-time
    if (isEditing && isConnected) {
      emitFormUpdate({
        ...formData,
        gender: value,
        isLiveUpdate: true,
        isEditing: true,
        patientId: patientId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters."
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters."
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required."
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required."
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = "Phone number must be at least 10 characters."
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address."
    }

    if (!formData.address || formData.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters."
    }

    if (!formData.preferredLanguage) {
      newErrors.preferredLanguage = "Preferred language is required."
    }

    if (!formData.nationality) {
      newErrors.nationality = "Nationality is required."
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare patient data
      const patientData: any = {
        ...formData,
        submittedAt: new Date().toISOString(),
      }

      // If editing, keep the existing ID and status
      if (isEditing && patientId && originalPatient) {
        patientData.id = patientId
        // Keep the original status when editing
        patientData.status = originalPatient.status || "submitted"
      } else {
        // New submission
        patientData.id = Date.now().toString()
        patientData.status = "submitted"
      }

      let submitted = false

      // Try WebSocket first
      if (socket && isConnected) {
        try {
          if (isEditing) {
            console.log("Updating patient via socket:", patientData.id)
            socket.emit("patient:update", patientData)
          } else {
            console.log("Submitting patient via socket:", patientData.id)
            socket.emit("patient:submit", patientData)
          }

          // Wait for acknowledgement or timeout
          await new Promise((resolve) => setTimeout(resolve, 1000))
          submitted = true
        } catch (wsError) {
          console.error("WebSocket submission failed:", wsError)
          // Will fall back to HTTP
        }
      }

      // If WebSocket failed or not connected, try HTTP
      if (!submitted) {
        try {
          console.log(`${isEditing ? "Updating" : "Submitting"} patient via HTTP fallback:`, patientData.id)

          const url = isEditing ? `/api/patients/${patientId}` : "/api/patients"

          const method = isEditing ? "PUT" : "POST"

          const response = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(patientData),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.warning) {
            console.log("Warning from API:", result.warning)
          }

          submitted = true
        } catch (httpError) {
          console.error("HTTP submission failed:", httpError)
          // Will fall back to localStorage
        }
      }

      // If both WebSocket and HTTP failed, use localStorage
      if (!submitted) {
        console.log("Socket and HTTP not available, using localStorage fallback")
        const existingPatients = JSON.parse(localStorage.getItem("patients") || "[]")

        if (isEditing) {
          // Update existing patient
          const updatedPatients = existingPatients.map((p: any) => (p.id === patientId ? patientData : p))
          localStorage.setItem("patients", JSON.stringify(updatedPatients))
        } else {
          // Add new patient
          existingPatients.push(patientData)
          localStorage.setItem("patients", JSON.stringify(existingPatients))
        }
      }

      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "",
          phoneNumber: "",
          email: "",
          address: "",
          preferredLanguage: "",
          nationality: "",
          emergencyContact: "",
          religion: "",
          termsAccepted: false,
        })
      }

      // Redirect to thank you page or back to staff view
      if (isEditing) {
        router.push("/staff-view?updated=true")
      } else {
        router.push("/thank-you")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("There was an error submitting your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {isEditing ? "Update Patient Information" : "Patient Information Form"}
              </h2>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow-md">
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Somchai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label htmlFor="middleName" className="block mb-1 text-sm font-medium text-gray-700">
                        Middle Name (optional)
                      </label>
                      <input
                        type="text"
                        id="middleName"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        placeholder="Chai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Rakchart"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label htmlFor="dateOfBirth" className="block mb-1 text-sm font-medium text-gray-700">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                    </div>
                  </div>

                  <div>
                    <span className="block mb-1 text-sm font-medium text-gray-700">Gender *</span>
                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="male"
                          name="gender"
                          checked={formData.gender === "male"}
                          onChange={() => handleRadioChange("male")}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="male" className="ml-2 text-sm text-gray-700">
                          Male
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="female"
                          name="gender"
                          checked={formData.gender === "female"}
                          onChange={() => handleRadioChange("female")}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="female" className="ml-2 text-sm text-gray-700">
                          Female
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="other"
                          name="gender"
                          checked={formData.gender === "other"}
                          onChange={() => handleRadioChange("other")}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="other" className="ml-2 text-sm text-gray-700">
                          Other
                        </label>
                      </div>
                    </div>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="phoneNumber" className="block mb-1 text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+66 12-345-6789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="somchai.r@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block mb-1 text-sm font-medium text-gray-700">
                      Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State, Zip Code"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="preferredLanguage" className="block mb-1 text-sm font-medium text-gray-700">
                        Preferred Language *
                      </label>
                      <select
                        id="preferredLanguage"
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          Select language
                        </option>
                        <option value="thai">Thai</option>
                        <option value="english">English</option>
                        <option value="chinese">Chinese</option>
                        <option value="japanese">Japanese</option>
                        <option value="burmese">Burmese</option>
                        <option value="cambodian">Cambodian</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.preferredLanguage && (
                        <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="nationality" className="block mb-1 text-sm font-medium text-gray-700">
                        Nationality *
                      </label>
                      <input
                        type="text"
                        id="nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        placeholder="American"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="emergencyContact" className="block mb-1 text-sm font-medium text-gray-700">
                        Emergency Contact (optional)
                      </label>
                      <input
                        type="text"
                        id="emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        placeholder="Somying Rakjing: +66 12-345-6789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Name and phone number of emergency contact</p>
                    </div>

                    <div>
                      <label htmlFor="religion" className="block mb-1 text-sm font-medium text-gray-700">
                        Religion (optional)
                      </label>
                      <input
                        type="text"
                        id="religion"
                        name="religion"
                        value={formData.religion}
                        onChange={handleChange}
                        placeholder="Buddhist"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="termsAccepted" className="text-sm font-medium text-gray-700">
                        I agree to the terms and conditions and privacy policy
                      </label>
                      <p className="text-xs text-gray-500">
                        By submitting this form, you agree to share your information with healthcare providers.
                      </p>
                      {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : isEditing ? "Update Information" : "Submit Information"}
                  </button>
                </form>
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
