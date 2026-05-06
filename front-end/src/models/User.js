/**
 * Base User Class
 */
export class User {
    constructor(data = {}) {
        this.idUser = data.idUser || null;
        this.nom = data.nom || '';
        this.prenom = data.prenom || '';
        this.numTele = data.numTele || '';
        this.address = data.address || '';
        this.cin = data.cin || '';
        this.email = data.email || '';
        this.imageUrl = data.imageUrl || '';
        this.role = data.role || '';
    }

    getFullName() {
        return `${this.prenom} ${this.nom}`;
    }
}

/**

 * Artisan extends User
 */
export class Artisan extends User {

    constructor(data = {}) {
        super(data);
        this.cv = data.cv || '';
        this.speciality = data.speciality || '';

        this.position = data.position || '';

    }
}

/**
 * Supplier extends User
 */
export class Supplier extends User {
    constructor(data = {}) {
        super(data);
        this.companyName = data.companyName || '';
        this.companyType = data.companyType || '';
    }
}

/**
 * Delivery extends User
 */
export class Delivery extends User {
    constructor(data = {}) {
        super(data);
        this.carPlate = data.carPlate || '';
    }
}

/**
 * Engineer extends User
 */
export class Engineer extends User {
    constructor(data = {}) {
        super(data);
        this.deplome = data.deplome || '';
    }
}
