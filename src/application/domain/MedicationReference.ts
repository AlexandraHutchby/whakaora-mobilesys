import type { MedicationReference } from "@/data/local/sqlite/medicationReference"

export class MedicationReferenceDomain {
  constructor(
    public readonly id: number,
    public readonly medicationName: string,
    public readonly commonName: string,
    public readonly commonUse: string,
    public readonly contraIndication: string,
    public readonly cautions: string,
    public readonly sideEffects: string,
    public readonly patientAdvice: string,
  ) {}

  get displayName(): string {
    return this.commonName && this.commonName !== this.medicationName
      ? `${this.medicationName} (${this.commonName})`
      : this.medicationName
  }

  static fromRow(row: MedicationReference): MedicationReferenceDomain {
    const s = (v: string | null | undefined) => (v ?? "").trim()
    return new MedicationReferenceDomain(
      row.id,
      s(row.medicationName),
      s(row.commonName),
      s(row.commonUse),
      s(row.contraIndication),
      s(row.cautions),
      s(row.sideEffects),
      s(row.patientAdvice),
    )
  }

  toRow(): Omit<MedicationReference, "id"> {
    return {
      medicationName: this.medicationName,
      commonName: this.commonName || null,
      commonUse: this.commonUse || null,
      contraIndication: this.contraIndication || null,
      cautions: this.cautions || null,
      sideEffects: this.sideEffects || null,
      patientAdvice: this.patientAdvice || null,
    }
  }
}
