import { useState, useEffect, useCallback } from "react"

import { UserMedication } from "@/application/domain/UserMedication"
import { listUserMedications, removeUserMedication } from "@/application/services/medicationService"

export function useMedicationList() {
  const [medications, setMedications] = useState<UserMedication[]>([])
  const refresh = useCallback(() => {
    setMedications(listUserMedications())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const deleteMedication = (id: number) => {
    removeUserMedication(id)
    refresh()
  }

  return { medications, deleteMedication }
}
