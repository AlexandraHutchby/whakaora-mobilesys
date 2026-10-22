import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals"

import { MedicationCombination } from "../src/application/domain/MedicationCombination"
import {
  addCombination,
  getCombinationsFor,
  listCombinations,
  removeCombination,
  removeCombinationsForMedication,
} from "../src/application/services/combinationService"
import {
  regenerateSchedule,
  removeSchedulesForMedication,
} from "../src/application/services/medicationScheduleService"
import {
  addInteractionRecord,
  deleteInteractionRecord,
  getAllInteractionRecords,
} from "../src/data/local/sqlite/interactionRecord"

jest.mock("../src/data/local/sqlite/interactionRecord", () => ({
  addInteractionRecord: jest.fn(),
  deleteInteractionRecord: jest.fn(),
  getAllInteractionRecords: jest.fn(),
}))
jest.mock("../src/application/services/medicationScheduleService", () => ({
  regenerateSchedule: jest.fn(),
}))

const getAll = getAllInteractionRecords as jest.Mock
const addRecord = addInteractionRecord as jest.Mock
const deleteRecord = deleteInteractionRecord as jest.Mock
const regenerate = regenerateSchedule as jest.Mock

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userMedicationId: 10,
  interactingMedicationId: 20,
  description: null,
  notes: null,
  dateRecorded: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const ROWS = [
  record({ id: 1, userMedicationId: 10, interactingMedicationId: 20 }),
  record({ id: 2, userMedicationId: 20, interactingMedicationId: 30 }),
  record({ id: 3, userMedicationId: 40, interactingMedicationId: 50 }),
]

const firstCallOrder = (fn: jest.Mock) => fn.mock.invocationCallOrder[0]

beforeEach(() => {
  jest.resetAllMocks()
  getAll.mockReturnValue([])
})

describe("list combinations", () => {
  it("maps rows to medication combination objects", () => {
    getAll.mockReturnValue(ROWS)

    const result = listCombinations()

    expect(result).toHaveLength(3)
    expect(result[0]).toBeInstanceOf(MedicationCombination)
    expect(result.map((c) => c.id)).toEqual([1, 2, 3])
  })

  it("returns an empty list when nothing is recorded", () => {
    expect(listCombinations()).toEqual([])
  })
})

describe("get combinations for", () => {
  beforeEach(() => {
    getAll.mockReturnValue(ROWS)
  })

  it("returns combinations where the medication is on either side", () => {
    expect(getCombinationsFor(20).map((c) => c.id)).toEqual([1, 2])
  })

  it("returns a single combination when only one involves the medication", () => {
    expect(getCombinationsFor(10).map((c) => c.id)).toEqual([1])
    expect(getCombinationsFor(50).map((c) => c.id)).toEqual([3])
  })

  it("returns nothing for an unrelated medication", () => {
    expect(getCombinationsFor(99)).toEqual([])
  })
})

describe("add combination", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-03-15T10:00:00.000Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("rejects a medication combined with itself", () => {
    expect(addCombination(10, 10)).toBeNull()
    expect(addRecord).not.toHaveBeenCalled()
    expect(regenerate).not.toHaveBeenCalled()
  })

  it("rejects a duplicate in the same direction", () => {
    getAll.mockReturnValue([record({ userMedicationId: 10, interactingMedicationId: 20 })])

    expect(addCombination(10, 20)).toBeNull()
    expect(addRecord).not.toHaveBeenCalled()
    expect(regenerate).not.toHaveBeenCalled()
  })

  it("rejects a duplicate in the opposite direction", () => {
    getAll.mockReturnValue([record({ userMedicationId: 10, interactingMedicationId: 20 })])
    expect(addCombination(20, 10)).toBeNull()
    expect(addRecord).not.toHaveBeenCalled()
  })

  it("allows a new pair that only shares one medication with an existing parir", () => {
    getAll.mockReturnValue([record({ userMedicationId: 10, interactingMedicationId: 20 })])
    addRecord.mockReturnValue(5)

    expect(addCombination(10, 30)).toBe(5)
    expect(addCombination(30, 20)).toBe(5)
  })

  it("records a new combination with a timestamp and returns its id", () => {
    addRecord.mockReturnValue(42)

    const id = addCombination(10, 30, "May cause drowsiness", "Space doses apart")

    expect(id).toBe(42)
    expect(addRecord).toHaveBeenCalledTimes(1)
    expect(addRecord).toHaveBeenCalledWith({
      userMedicationId: 10,
      interactingMedicationId: 30,
      description: "May cause drowsiness",
      notes: "Space doses apart",
      dateRecorded: "2026-03-15T10:00:00.000Z",
    })
  })

  it("defaults description and notes to null", () => {
    addRecord.mockReturnValue(1)
    addCombination(10, 30)
    expect(addRecord).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, notes: null }),
    )
  })

  it("regenerates the schedule after adding", () => {
    addRecord.mockReturnValue(1)
    addCombination(10, 30)
    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(addRecord)).toBeLessThan(firstCallOrder(regenerate))
  })
})

describe("remove combination", () => {
  it("deletes the record and then regenerates the schedule", () => {
    removeCombination(7)
    expect(deleteRecord).toHaveBeenCalledWith(7)
    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(deleteRecord)).toBeLessThan(firstCallOrder(regenerate))
  })
})

describe("remove combinations for medication", () => {
  it("deletes every combination involving the mediccation and nothing else", () => {
    getAll.mockReturnValue(ROWS)
    removeCombinationsForMedication(20)

    expect(deleteRecord).toHaveBeenCalledTimes(2)
    expect(deleteRecord).toHaveBeenCalledWith(1)
    expect(deleteRecord).toHaveBeenCalledWith(2)
    expect(deleteRecord).not.toHaveBeenCalledWith(3)
  })

  it("regenrates once after deleteing", () => {
    getAll.mockReturnValue(ROWS)

    removeCombinationsForMedication(20)

    expect(regenerate).toHaveBeenCalledTimes(1)
    expect(firstCallOrder(deleteRecord)).toBeLessThan(firstCallOrder(regenerate))
  })

  it("still regenerates when nothing matched", () => {
    getAll.mockReturnValue(ROWS)

    removeCombinationsForMedication(99)

    expect(deleteRecord).not.toHaveBeenCalled()
    expect(regenerate).toHaveBeenCalledTimes(1)
  })
})
