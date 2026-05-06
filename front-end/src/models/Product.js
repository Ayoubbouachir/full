export class Product {
    constructor(data = {}) {
        this.idProduct = data.idProduct || null;
        this.nomP = data.nomP || '';
        this.prix = data.prix || 0.0;
        this.quantite = data.quantite || 0;
        this.imagePUrl = data.imagePUrl || '';
        this.description = data.description || '';
        this.categorie = data.categorie || '';
    }

    isStockAvailable() {
        return this.quantite > 0;
    }
}
