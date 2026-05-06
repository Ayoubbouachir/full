export class Project {
    constructor(data = {}) {
        this.idProject = data.idProject || null;
        this.nom = data.nom || '';
        this.dateD = data.dateD ? new Date(data.dateD) : null;
        this.dateF = data.dateF ? new Date(data.dateF) : null;
        this.cout = data.cout || 0.0;
        this.type = data.type || '';
        this.nbArtisan = data.nbArtisan || 0;
        this.maquetteUrl = data.maquetteUrl || '';
        this.idUserEng = data.idUserEng || null;
    }

    getDurationDays() {
        if (this.dateD && this.dateF) {
            const diffTime = Math.abs(this.dateF - this.dateD);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }
}
