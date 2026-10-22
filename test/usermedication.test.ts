import { describe, expect, it } from "@jest/globals"

import { UserMedication } from "../src/application/domain/UserMedication"

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  medicationName: "Paracetamol",
  medicationReferenceId: 5,
  customName: "My painkiller",
  ...overrides,
})

describe("User medication from row", () => {
  it("maps every column", () => {
    expect(UserMedication.fromRow(row())).toMatchObject({
      id: 1,
      medicationName: "Paracetamol",
      medicationReferenceId: 5,
      customName: "My painkiller",
    })
  })

  it("uses null for a missing custom name", () => {
    expect(UserMedication.fromRow(row({ customName: undefined })).customName).toBeNull()
    expect(UserMedication.fromRow(row({ customName: null })).customName).toBeNull()
  })

  it("keeps a null reference id", () => {
    expect(
      UserMedication.fromRow(row({ medicationReferenceId: null })).medicationReferenceId,
    ).toBeNull()
  })
})

describe("User medication display name", () => {
  it("prefers the custom name", () => {
    expect(UserMedication.fromRow(row()).displayName).toBe("My painkiller")
  })

  it("falls back to the medication name when there is no custom name", () => {
    expect(UserMedication.fromRow(row({ customName: null })).displayName).toBe("Paracetamol")
  })

  it("falls back to the medication name when the custom name is empty", () => {
    expect(UserMedication.fromRow(row({ customName: "" })).displayName).toBe("Paracetamol")
  })
})

describe("User Medication is linked to reference", () => {
  it("is true when a reference id is set", () => {
    expect(new UserMedication(1, "Paracetamol", 5, null).isLinkedToReference()).toBe(true)
  })

  it("is false when the reference id is null", () => {
    expect(new UserMedication(1, "Paracetamol", null, null).isLinkedToReference()).toBe(false)
  })

  it("treats a reference id of 0 as linked", () => {
    expect(new UserMedication(1, "Paracetamol", 0, null).isLinkedToReference()).toBe(true)
  })
})
