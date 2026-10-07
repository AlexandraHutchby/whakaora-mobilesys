import {
  addUserMedication,
  getAllUserMedications,
  deleteUserMedication,
  NewUserMedication,
  updateUserMedication,
} from "@/data/local/sqlite/userMedication"

import { UserMedication } from "../domain/UserMedication"

export function listUserMedications(): UserMedication[] {
  const rows = getAllUserMedications()
  return rows.map(UserMedication.fromRow)
}

export function createUserMedication(data: NewUserMedication): number | null {
  return addUserMedication(data)
}

export function saveUserMedication(data: {
  id?: number
  medicationReferenceId: number | null
  medicationName: string
  customName: string | null
}): number {
  if (data.id) {
    updateUserMedication(data.id, {
      medicationReferenceId: data.medicationReferenceId,
      medicationName: data.medicationName,
      customName: data.customName,
    })

    return data.id
  }

  return addUserMedication(data)
}

export function removeUserMedication(id: number): void {
  deleteUserMedication(id)
}
