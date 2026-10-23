export class MedicationCombination {
  constructor(
    public id: number,
    public userMedicationId: number,
    public interactingMedicationId: number,
    public description: string | null,
    public notes: string | null,
    public dateRecorded: string,
  ) {}

  static fromRow(row: any): MedicationCombination {
    return new MedicationCombination(
      row.id,
      row.userMedicationId,
      row.interactingMedicationId,
      row.description ?? null,
      row.notes ?? null,
      row.dateRecorded,
    )
  }

  involves(medicationId: number): boolean {
    return this.userMedicationId === medicationId || this.interactingMedicationId === medicationId
  }

  otherMedicationId(medicationId: number): number {
    return this.userMedicationId === medicationId
      ? this.interactingMedicationId
      : this.userMedicationId
  }
}
