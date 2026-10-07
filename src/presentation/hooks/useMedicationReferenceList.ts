import { useCallback, useEffect, useState } from "react"

import { MedicationReferenceDomain } from "@/application/domain/MedicationReference"
import {
  getAllMedicationReferenceRows,
  searchMedicationReferenceRowsByName,
  getMedicationReferenceRowsById,
} from "@/application/services/medicationReferenceService"

export function useMedicationReferenceList() {
  const [items, setItems] = useState<MedicationReferenceDomain[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<MedicationReferenceDomain | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    try {
      setLoading(true)
      const result = query.trim()
        ? searchMedicationReferenceRowsByName(query)
        : getAllMedicationReferenceRows()
      setItems(result)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    load()
  }, [load])

  const select = useCallback(
    (id: number) => {
      const found = items.find((item) => item.id === id)
      setSelected(found ?? getMedicationReferenceRowsById(id))
    },
    [items],
  )

  const clearSelection = useCallback(() => {
    setSelected(null)
  }, [])

  return {
    medications: items,
    query,
    setQuery,
    selected,
    select,
    clearSelection,
    refresh,
    loading,
    error,
  }
}
