import { describe, expect, it, jest } from "@jest/globals"

import { seedMedicationReference, useFreshDatabase as setupFreshDatabase } from "./setupdb"
import {
  addUserMedication,
  deleteUserMedication,
  getAllUserMedications,
  getUserMedicationWithReference,
  updateUserMedication,
  userMedicationExists,
  getUserMedicationById,
} from "../src/data/local/sqlite/userMedication"

jest.mock("../src/data/local/sqlite/database", () => require("./db"))

setupFreshDatabase()

const add = (medicationName: string, overrides = {}) =>
  addUserMedication({
    medicationReferenceId: null,
    medicationName,
    customName: null,
    ...overrides,
  })

describe("add user medication", () => {
  it("inserts a row and returns its id", () => {
    const id = add("Paracetamol", { customName: "Panadol" })

    expect(id).toBeGreaterThan(0)
    expect(getUserMedicationById(id)).toEqual({
      id,
      medicationReferenceId: null,
      medicationName: "Paracetamol",
      customName: "Panadol",
    })
  })

  it("gives each row a new id", () => {
    expect(add("A")).not.toBe("B")
  })

  it("links to a reference medication", () => {
    const referenceId = seedMedicationReference()
    const id = add("Paracetamol", { medicationReferenceId: referenceId })

    expect(getUserMedicationById(id)?.medicationReferenceId).toBe(referenceId)
  })
})

describe("get all user medications", () => {
  it("returns an empty list when there are none", () => {
    expect(getAllUserMedications()).toEqual([])
  })

  it("is sorted by medication name", () => {
    add("Paracetamol")
    add("Aspirin")
    add("Ibuprofen")

    expect(getAllUserMedications().map((m) => m.medicationName)).toEqual([
      "Aspirin",
      "Ibuprofen",
      "Paracetamol",
    ])
  })
})

describe("get user medication by id", () => {
  it("returns the matching row", () => {
    add("Aspirin")
    const id = add("Ibuprofen")

    expect(getUserMedicationById(id)?.medicationName).toBe("Ibuprofen")
  })

  it("returns null when there is no such row", () => {
    expect(getUserMedicationById(999)).toBeNull()
  })
})

describe("get user medication with reference", () => {
  it("joins the reference details", () => {
    const referenceId = seedMedicationReference("Paracetamol")
    const id = add("Paracetamol", { medicationReferenceId: referenceId })

    expect(getUserMedicationWithReference(id)).toEqual({
      id,
      medicationName: "Paracetamol",
      medicationReferenceId: referenceId,
      commonName: "Panadol",
      commonUse: "Pain",
      contraIndication: "Liver disease",
      cautions: "Avoid overdose",
      sideEffects: "Nausea",
      patientAdvice: "Take with water",
    })
  })

  it("still returns the medication, with null reference fields, when it is not linked", () => {
    const id = add("Custom tonic")

    expect(getUserMedicationWithReference(id)).toEqual({
      id,
      medicationName: "Custom tonic",
      medicationReferenceId: null,
      commonName: null,
      commonUse: null,
      contraIndication: null,
      cautions: null,
      sideEffects: null,
      patientAdvice: null,
    })
  })

  it("returns null when there is no such medication", () => {
    expect(getUserMedicationWithReference(999)).toBeNull()
  })
})

describe("user medication exists", () => {
  it("is true when a medication is linked to the reference", () => {
    const referenceId = seedMedicationReference()
    add("Paracetamol", { medicationReferenceId: referenceId })

    expect(userMedicationExists(referenceId)).toBe(true)
  })

  it("is false when no medication is linked to the reference", () => {
    const referenceId = seedMedicationReference()
    add("Unlinked")

    expect(userMedicationExists(referenceId)).toBe(false)
  })
})

describe("update user medication", () => {
  it("changes only the fields it is given", () => {
    const id = add("Paracetamol", { customName: "Old" })
    updateUserMedication(id, { customName: "New" })
    expect(getUserMedicationById(id)).toMatchObject({
      medicationName: "Paracetamol",
      customName: "New",
    })
  })

  it("can set a field to null", () => {
    const id = add("Paracetamol", { customName: "Panadol" })
    updateUserMedication(id, { customName: null })
    expect(getUserMedicationById(id)?.customName).toBeNull()
  })

  it("only changes the row with that id", () => {
    const first = add("First")
    const second = add("Second")

    updateUserMedication(first, { medicationName: "Changed" })
    expect(getUserMedicationById(second)?.medicationName).toBe("Second")
  })

  it("does nothing when there is nothing to update", () => {
    const id = add("Paracetamol")
    expect(() => updateUserMedication(id, {})).not.toThrow()
    expect(getUserMedicationById(id)?.medicationName).toBe("Paracetamol")
  })
})

describe("delete user medication", () => {
  it("removes only that row", () => {
    const keep = add("Keep")
    const remove = add("Remove")

    deleteUserMedication(remove)
    expect(getUserMedicationById(remove)).toBeNull()
    expect(getUserMedicationById(keep)).not.toBeNull()
  })

  it("does not fail for an unknown id", () => {
    expect(() => deleteUserMedication(999)).not.toThrow()
  })
})
