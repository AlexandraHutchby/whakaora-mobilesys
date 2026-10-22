import { beforeEach, describe, expect, it, jest } from "@jest/globals"

import { UserMedication } from "../src/application/domain/UserMedication"
import {
  createUserMedication,
  listUserMedications,
  removeUserMedication,
  saveUserMedication,
} from "../src/application/services/medicationService"
import {
  addUserMedication,
  deleteUserMedication,
  getAllUserMedications,
  updateUserMedication,
} from "../src/data/local/sqlite/userMedication"

jest.mock("../src/data/local/sqlite/userMedication", () => ({
  addUserMedication: jest.fn(),
  deleteUserMedication: jest.fn(),
  getAllUserMedications: jest.fn(),
  updateUserMedication: jest.fn(),
}))

const addMed = addUserMedication as jest.Mock
const deleteMed = deleteUserMedication as jest.Mock
const getAll = getAllUserMedications as jest.Mock
const updateMed = updateUserMedication as jest.Mock

const userMedRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  medicationName: "Paracetamol",
  medicationReferenceId: 5,
  customName: null,
  ...overrides,
})

beforeEach(() => {
  jest.resetAllMocks()
})

describe("list user medications", () => {
  it("maps rows to user medication objects", () => {
    getAll.mockReturnValue([
      userMedRow({ id: 1 }),
      userMedRow({ id: 2, medicationName: "Ibuprofen", customName: "Nurofen" }),
    ])

    const result = listUserMedications()

    expect(result).toHaveLength(2)
    expect(result[0]).toBeInstanceOf(UserMedication)
    expect(result.map((m) => m.displayName)).toEqual(["Paracetamol", "Nurofen"])
  })

  it("returns an empty list when the user has no medications", () => {
    getAll.mockReturnValue([])
    expect(listUserMedications()).toEqual([])
  })
})

describe("create user medication", () => {
  const data = {
    medicationName: "Paracetamol",
    medicationReferenceId: 5,
    customName: null,
  } as Parameters<typeof createUserMedication>[0]

  it("passes the data to the databse and returns the new id", () => {
    addMed.mockReturnValue(7)

    expect(createUserMedication(data)).toBe(7)
    expect(addMed).toHaveBeenCalledWith(data)
  })

  it("returns null when the database does not create a row", () => {
    addMed.mockReturnValue(null)

    expect(createUserMedication(data)).toBeNull()
  })
})

describe("save user medication", () => {
  const fields = {
    medicationReferenceId: 5,
    medicationName: "Paracetamol",
    customName: "Panadol",
  }

  it("updates an existing medication when an id is given", () => {
    const id = saveUserMedication({ id: 3, ...fields })

    expect(id).toBe(3)
    expect(updateMed).toHaveBeenCalledWith(3, fields)
    expect(addMed).not.toHaveBeenCalled()
  })

  it("does not send the id as part of the updated fields", () => {
    saveUserMedication({ id: 3, ...fields })
    expect(updateMed.mock.calls[0][1]).not.toHaveProperty("id")
  })

  it("adds a new medication when there is no id and returns the new id", () => {
    addMed.mockReturnValue(9)

    const id = saveUserMedication(fields)

    expect(id).toBe(9)
    expect(addMed).toHaveBeenCalledWith(fields)
    expect(updateMed).not.toHaveBeenCalled()
  })

  it("supports medications that are not linked to a reference", () => {
    addMed.mockReturnValue(10)

    saveUserMedication({
      medicationReferenceId: null,
      medicationName: "Custom tonic",
      customName: null,
    })

    expect(addMed).toHaveBeenCalledWith({
      medicationReferenceId: null,
      medicationName: "Custom tonic",
      customName: null,
    })
  })
})

describe("remove user medication", () => {
  it("deletes the medication by id", () => {
    removeUserMedication(4)

    expect(deleteMed).toHaveBeenCalledTimes(1)
    expect(deleteMed).toHaveBeenCalledWith(4)
  })
})
