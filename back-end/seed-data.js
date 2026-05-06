const { MongoClient, ObjectId } = require('mongodb');

async function seedDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('fullstackers');

        // Clear existing data
        await db.collection('product').deleteMany({});
        await db.collection('project').deleteMany({});
        await db.collection('user').deleteMany({});
        await db.collection('order').deleteMany({});

        console.log('Cleared existing data');

        // Seed Users
        const users = await db.collection('user').insertMany([
            {
                nom: 'Smith',
                prenom: 'John',
                numTele: '0612345678',
                address: '123 Main St',
                cin: 'AB123456',
                email: 'admin@example.com',
                password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // hashed password
                imageUrl: '/assets/images/team/tean-1.jpg',
                role: 'Admin'
            },
            {
                nom: 'Doe',
                prenom: 'Jane',
                numTele: '0623456789',
                address: '456 Oak Ave',
                cin: 'CD789012',
                email: 'engineer@example.com',
                password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
                imageUrl: '/assets/images/team/tean-2.jpg',
                role: 'Engineer',
                deplome: 'Civil Engineering Degree'
            },
            {
                nom: 'Wilson',
                prenom: 'Mike',
                numTele: '0634567890',
                address: '789 Pine Rd',
                cin: 'EF345678',
                email: 'worker@example.com',
                password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
                imageUrl: '/assets/images/team/tean-3.jpg',
                role: 'Worker',
                speciality: 'Carpentry'
            }
        ]);

        console.log(`Inserted ${users.insertedCount} users`);

        // Seed Products
        const products = await db.collection('product').insertMany([
            {
                nomP: 'Power Drill',
                prix: 89.99,
                quantite: 50,
                imagePUrl: '/assets/images/products/product-1.jpg',
                description: 'Professional grade power drill with variable speed control',
                categorie: 'Tools'
            },
            {
                nomP: 'Safety Helmet',
                prix: 24.99,
                quantite: 100,
                imagePUrl: '/assets/images/products/product-2.jpg',
                description: 'OSHA approved safety helmet for construction sites',
                categorie: 'Safety'
            },
            {
                nomP: 'Measuring Tape',
                prix: 12.50,
                quantite: 75,
                imagePUrl: '/assets/images/products/product-3.jpg',
                description: '25ft professional measuring tape',
                categorie: 'Tools'
            },
            {
                nomP: 'Work Gloves',
                prix: 15.99,
                quantite: 200,
                imagePUrl: '/assets/images/products/product-4.jpg',
                description: 'Durable leather work gloves',
                categorie: 'Safety'
            },
            {
                nomP: 'Cement Mixer',
                prix: 450.00,
                quantite: 10,
                imagePUrl: '/assets/images/products/product-5.jpg',
                description: 'Industrial cement mixer for large projects',
                categorie: 'Equipment'
            }
        ]);

        console.log(`Inserted ${products.insertedCount} products`);

        // Seed Projects
        const engineerId = users.insertedIds[1]; // Jane Doe (Engineer)

        const projects = await db.collection('project').insertMany([
            {
                nom: 'Modern Villa Construction',
                dateD: new Date('2024-01-15'),
                dateF: new Date('2024-12-31'),
                cout: 500000,
                type: 'Residential',
                nbWorker: 15,
                maquetteUrl: '/assets/images/projects/projects-1.jpg',
                idUserEng: engineerId.toString()
            },
            {
                nom: 'Office Building Renovation',
                dateD: new Date('2024-02-01'),
                dateF: new Date('2024-08-30'),
                cout: 350000,
                type: 'Commercial',
                nbWorker: 10,
                maquetteUrl: '/assets/images/projects/projects-2.jpg',
                idUserEng: engineerId.toString()
            },
            {
                nom: 'Bridge Construction',
                dateD: new Date('2024-03-10'),
                dateF: new Date('2025-03-10'),
                cout: 1200000,
                type: 'Infrastructure',
                nbWorker: 25,
                maquetteUrl: '/assets/images/projects/projects-3.jpg',
                idUserEng: engineerId.toString()
            }
        ]);

        console.log(`Inserted ${projects.insertedCount} projects`);

        // Seed Orders
        const orders = await db.collection('order').insertMany([
            {
                dateArrivage: new Date('2024-01-20'),
                dateLivraison: new Date('2024-01-25'),
                status: 'Delivered',
                lines: [
                    { productId: products.insertedIds[0].toString(), quantity: 5, price: 89.99 },
                    { productId: products.insertedIds[1].toString(), quantity: 10, price: 24.99 }
                ]
            },
            {
                dateArrivage: new Date('2024-02-15'),
                dateLivraison: new Date('2024-02-20'),
                status: 'Pending',
                lines: [
                    { productId: products.insertedIds[2].toString(), quantity: 3, price: 12.50 }
                ]
            }
        ]);

        console.log(`Inserted ${orders.insertedCount} orders`);

        console.log('\n✅ Database seeded successfully!');
        console.log(`Total: ${users.insertedCount} users, ${products.insertedCount} products, ${projects.insertedCount} projects, ${orders.insertedCount} orders`);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await client.close();
    }
}

seedDatabase();
