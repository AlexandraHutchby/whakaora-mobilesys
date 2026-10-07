export class UserMedication {
  constructor(
    public id: number,
    public medicationName: string,
    public medicationReferenceId: number | null,
    public customName: string | null,
  ) {}

  static fromRow(row: any): UserMedication {
    return new UserMedication(
      row.id,
      row.medicationName,
      row.medicationReferenceId,
      row.customName ?? null,
    )
  }

  get displayName(): string {
    return this.customName || this.medicationName
  }

  isLinkedToReference(): boolean {
    return this.medicationReferenceId !== null
  }
}
