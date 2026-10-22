import { useCallback, useEffect, useState } from "react"

import { medicationScheduleEntry } from "@/application/domain/MedicationScheduleEntry"
import { ScheduleResult } from "@/application/domain/Scheduler"
import {
  SaveScheduleInput,
  listMedicationSchedules,
  previewSchedule,
  regenerateSchedule,
  removeMedicationSchedule,
  saveMedicationSchedule,
  setScheduleEnabled,
} from "@/application/services/medicationScheduleService"

export function useMedicationSchedule() {
  const [entries, setEntries] = useState<medicationScheduleEntry[]>([])
  const [suggested, setSuggested] = useState<ScheduleResult>({ doses: [], warnings: [] })

  const refresh = useCallback(() => {
    setEntries(listMedicationSchedules())
    setSuggested(previewSchedule())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = (input: SaveScheduleInput) => {
    const id = saveMedicationSchedule(input)
    refresh()
    return id
  }

  const remove = (id: number) => {
    removeMedicationSchedule(id)
    refresh()
  }

  const toggle = (id: number, enabled: boolean) => {
    setScheduleEnabled(id, enabled)
    refresh()
  }

  const regenerate = () => {
    regenerateSchedule()
    refresh()
  }

  return { entries, suggested, save, remove, toggle, regenerate, refresh }
}
