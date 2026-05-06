/**
 * Line Item (used in Order and Panier)
 */
export class Line {
    constructor(data = {}) {
        this.idLine = data.idLine || null;
        this.idProduct = data.idProduct || null;
        this.product = data.product || null; // Optional: nested Product object
        this.qnt = data.qnt || 0;
        this.unitPrice = data.unitPrice || 0.0;
        this.total = data.total || 0.0;
    }

    calculateTotal() {
        this.total = this.qnt * this.unitPrice;
        return this.total;
    }
}

/**
 * Order Class
 */
export class Order {
    constructor(data = {}) {
        this.idOrder = data.idOrder || null;
        this.dateArrivage = data.dateArrivage ? new Date(data.dateArrivage) : null;
        this.dateLivraison = data.dateLivraison ? new Date(data.dateLivraison) : null;
        this.status = data.status || 'pending';

        // Relationship: Order has many Lines
        this.lines = (data.lines || []).map(lineData => new Line(lineData));
    }
}

/**
 * Panier (Shopping Cart)
 */
export class Panier {
    constructor(data = {}) {
        this.idPanier = data.idPanier || null;
        this.somme = data.somme || 0.0;

        // Relationship: Panier has many Lines
        this.lines = (data.lines || []).map(lineData => new Line(lineData));
    }

    calculateSum() {
        this.somme = this.lines.reduce((acc, line) => acc + line.total, 0);
        return this.somme;
    }
}

/**
 * Facture (Invoice)
 */
export class Facture {
    constructor(data = {}) {
        this.idFacture = data.idFacture || null;
        this.idUser1 = data.idUser1 || null; // Seller/Provider ??
        this.idUser2 = data.idUser2 || null; // Buyer
        this.idOrder = data.idOrder || null;
        this.order = data.order ? new Order(data.order) : null;
    }
}
