import { createContext, useContext, useState } from 'react'

const PatientContext = createContext(null)

export function PatientProvider({ children }) {
  const [patientType, setPatientType] = useState(null)
  const [prefillData, setPrefillData] = useState(null)

  const setPatient = (type, data) => {
    setPatientType(type)
    setPrefillData(data)
  }

  const clearPatient = () => {
    setPatientType(null)
    setPrefillData(null)
  }

  return (
    <PatientContext.Provider value={{ patientType, prefillData, setPatient, clearPatient }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  return useContext(PatientContext)
}
