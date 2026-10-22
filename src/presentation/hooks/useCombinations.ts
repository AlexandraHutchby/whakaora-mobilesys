import { useCallback, useEffect, useState } from "react"

import { MedicationCombination } from "@/application/domain/MedicationCombination"
import {
  addCombination,
  listCombinations,
  removeCombination,
} from "@/application/services/combinationService"

export function useCombinations() {
  const [combinations, setCombinations] = useState<MedicationCombination[]>([])

  const refresh = useCallback(() => {
    setCombinations(listCombinations())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = (a: number, b: number, description?: string, notes?: string) => {
    const id = addCombination(a, b, description ?? null, notes ?? null)
    if (id !== null) refresh()
    return id
  }

  const remove = (id: number) => {
    removeCombination(id)
    refresh()
  }

  return { combinations, add, remove }
}
