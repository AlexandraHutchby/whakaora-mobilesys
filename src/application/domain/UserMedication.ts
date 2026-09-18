export class UserMedication {
    constructor(
        public id: number,
        public medicationName: string,
        public medicationReferenceId: number | null
    ) { }

    static fromRow(row: any): UserMedication {
        return new UserMedication(
            row.id,
            row.medicationName,
            row.medicationReferenceId
        );
    }

    isLinkedToReference(): boolean {
        return this.medicationReferenceId !== null;
    }
}