// backend/scripts/initAttributes.js
// Script pour initialiser des exemples d'attributs

const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/annoncesDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
};

// Importation des modèles
const Categorie = require('../models/Categorie');
const Attribute = require('../models/Attribute');

const initAttributes = async () => {
  try {
    await connectDB();

    // Récupérer les catégories existantes
    const categories = await Categorie.find();
    
    if (categories.length === 0) {
      console.log('❌ Aucune catégorie trouvée. Créez d\'abord des catégories.');
      return;
    }

    // Exemples d'attributs pour différentes catégories
    const attributeExamples = [
      // Attributs pour Immobilier
      {
        categoryName: 'Immobilier',
        attributes: [
          {
            nom: 'Surface',
            type: 'number',
            placeholder: 'Surface en m²',
            description: 'Surface habitable en mètres carrés',
            required: true,
            ordre: 1
          },
          {
            nom: 'Nombre de pièces',
            type: 'number',
            placeholder: 'Nombre de pièces',
            required: true,
            ordre: 2
          },
          {
            nom: 'Type de bien',
            type: 'select',
            options: ['Appartement', 'Villa', 'Maison', 'Studio', 'Duplex', 'Riad'],
            required: true,
            ordre: 3
          },
          {
            nom: 'Étage',
            type: 'number',
            placeholder: 'Numéro d\'étage',
            ordre: 4
          },
          {
            nom: 'Ascenseur',
            type: 'boolean',
            ordre: 5
          },
          {
            nom: 'Parking',
            type: 'boolean',
            ordre: 6
          },
          {
            nom: 'Meublé',
            type: 'boolean',
            ordre: 7
          }
        ]
      },

      // Attributs pour Voitures
      {
        categoryName: 'Automobile',
        attributes: [
          {
            nom: 'Kilométrage',
            type: 'number',
            placeholder: 'Kilométrage en km',
            required: true,
            ordre: 1
          },
          {
            nom: 'Année',
            type: 'number',
            placeholder: 'Année de fabrication',
            required: true,
            ordre: 2
          },
          {
            nom: 'Carburant',
            type: 'select',
            options: ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'],
            required: true,
            ordre: 3
          },
          {
            nom: 'Boîte de vitesse',
            type: 'select',
            options: ['Manuelle', 'Automatique'],
            required: true,
            ordre: 4
          },
          {
            nom: 'Nombre de portes',
            type: 'select',
            options: ['2', '3', '4', '5'],
            ordre: 5
          },
          {
            nom: 'Couleur',
            type: 'string',
            placeholder: 'Couleur du véhicule',
            ordre: 6
          },
          {
            nom: 'Première main',
            type: 'boolean',
            ordre: 7
          },
          {
            nom: 'Climatisation',
            type: 'boolean',
            ordre: 8
          }
        ]
      },

      // Attributs pour Électronique
      {
        categoryName: 'Électronique',
        attributes: [
          {
            nom: 'Garantie',
            type: 'boolean',
            ordre: 1
          },
          {
            nom: 'Durée de garantie',
            type: 'string',
            placeholder: 'Ex: 2 ans, 6 mois',
            ordre: 2
          },
          {
            nom: 'Couleur',
            type: 'string',
            placeholder: 'Couleur du produit',
            ordre: 3
          },
          {
            nom: 'Capacité/Taille',
            type: 'string',
            placeholder: 'Ex: 64GB, 15 pouces, etc.',
            ordre: 4
          },
          {
            nom: 'Accessoires inclus',
            type: 'boolean',
            ordre: 5
          }
        ]
      }
    ];

    // Insérer les attributs
    for (const categoryExample of attributeExamples) {
      const category = categories.find(cat => cat.nom === categoryExample.categoryName);
      
      if (category) {
        console.log(`\n📝 Création des attributs pour ${categoryExample.categoryName}...`);
        
        for (const attrData of categoryExample.attributes) {
          // Vérifier si l'attribut existe déjà
          const existingAttr = await Attribute.findOne({
            nom: attrData.nom,
            categorie_id: category._id
          });

          if (!existingAttr) {
            const attribute = new Attribute({
              ...attrData,
              categorie_id: category._id
            });
            
            await attribute.save();
            console.log(`  ✅ ${attrData.nom} (${attrData.type})`);
          } else {
            console.log(`  ℹ️  ${attrData.nom} existe déjà`);
          }
        }
      } else {
        console.log(`❌ Catégorie "${categoryExample.categoryName}" non trouvée`);
      }
    }

    console.log('\n🎉 Initialisation des attributs terminée !');

    // Afficher un résumé
    const totalAttributes = await Attribute.countDocuments();
    console.log(`📊 Total des attributs dans la base : ${totalAttributes}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
if (require.main === module) {
  initAttributes();
}

module.exports = initAttributes;