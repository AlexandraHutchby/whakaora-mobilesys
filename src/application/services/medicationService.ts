import { UserMedication } from "../domain/UserMedication";
import { addUserMedication, getAllUserMedications, deleteUserMedication, NewUserMedication } from "@/data/local/sqlite/userMedication";

export function listUserMedications(): UserMedication[] {
    const rows = getAllUserMedications();
    return rows.map(UserMedication.fromRow);
}

export function createUserMedication(data: NewUserMedication): number {
    return addUserMedication(data);
}

export function removeUserMedication(id: number): void {
    deleteUserMedication(id);
}