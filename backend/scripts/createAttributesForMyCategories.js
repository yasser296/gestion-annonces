// backend/scripts/createAttributesForMyCategories.js
const mongoose = require('mongoose');
require('dotenv').config();

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

const Categorie = require('../models/Categorie');
const Attribute = require('../models/Attribute');

// Templates d'attributs spécifiques pour VOS catégories exactes
const myAttributeTemplates = {
  // Attributs génériques pour toutes catégories
  generic: [
    {
      nom: 'Marque',
      type: 'string',
      placeholder: 'Marque du produit',
      description: 'Nom de la marque ou du fabricant',
      required: false,
      ordre: 1
    },
    {
      nom: 'État',
      type: 'select',
      options: ['Neuf', 'Comme neuf', 'Bon état', 'État moyen', 'À réparer'],
      required: true,
      ordre: 2
    }
  ],

  // Templates spécifiques par catégorie (noms EXACTES de votre base)
  specific: {
    // 💼 Emploi - 6 annonces
    'Emploi': [
      {
        nom: 'Type de contrat',
        type: 'select',
        options: ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Intérim', 'Apprentissage'],
        required: true,
        ordre: 3
      },
      {
        nom: 'Secteur d\'activité',
        type: 'select',
        options: ['Informatique', 'Commerce', 'Santé', 'Éducation', 'Finance', 'BTP', 'Restauration', 'Transport', 'Marketing', 'Autre'],
        required: true,
        ordre: 4
      },
      {
        nom: 'Expérience requise',
        type: 'select',
        options: ['Débutant accepté', '1-2 ans', '3-5 ans', '5-10 ans', '10+ ans'],
        required: false,
        ordre: 5
      },
      {
        nom: 'Niveau d\'études',
        type: 'select',
        options: ['Sans diplôme', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat'],
        required: false,
        ordre: 6
      },
      {
        nom: 'Télétravail possible',
        type: 'boolean',
        ordre: 7
      },
      {
        nom: 'Date de début',
        type: 'date',
        placeholder: 'Date de début souhaitée',
        required: false,
        ordre: 8
      }
    ],

    // 🛋️ Meubles - 6 annonces  
    'Meubles': [
      {
        nom: 'Type de meuble',
        type: 'select',
        options: ['Canapé', 'Table', 'Chaise', 'Lit', 'Armoire', 'Commode', 'Bureau', 'Étagère', 'Fauteuil', 'Table basse'],
        required: true,
        ordre: 3
      },
      {
        nom: 'Matériau principal',
        type: 'select',
        options: ['Bois massif', 'Bois aggloméré', 'Métal', 'Plastique', 'Tissu', 'Cuir', 'Verre', 'Rotin'],
        required: false,
        ordre: 4
      },
      {
        nom: 'Dimensions',
        type: 'string',
        placeholder: 'L x l x h (ex: 120x80x75 cm)',
        description: 'Dimensions en centimètres',
        required: false,
        ordre: 5
      },
      {
        nom: 'Couleur',
        type: 'string',
        placeholder: 'Couleur principale',
        required: false,
        ordre: 6
      },
      {
        nom: 'Style',
        type: 'select',
        options: ['Moderne', 'Classique', 'Scandinave', 'Industriel', 'Vintage', 'Contemporain', 'Rustique'],
        required: false,
        ordre: 7
      },
      {
        nom: 'Assemblage requis',
        type: 'boolean',
        ordre: 8
      }
    ],

    // 🛠️ Services - 6 annonces
    'Services': [
      {
        nom: 'Type de service',
        type: 'select',
        options: ['Réparation', 'Installation', 'Nettoyage', 'Livraison', 'Cours/Formation', 'Consultation', 'Maintenance', 'Autre'],
        required: true,
        ordre: 3
      },
      {
        nom: 'Domaine',
        type: 'select',
        options: ['Informatique', 'Électroménager', 'Plomberie', 'Électricité', 'Jardinage', 'Ménage', 'Beauté', 'Transport', 'Éducation'],
        required: true,
        ordre: 4
      },
      {
        nom: 'Durée estimée',
        type: 'string',
        placeholder: 'ex: 2h, 1 jour, 1 semaine',
        description: 'Durée approximative du service',
        required: false,
        ordre: 5
      },
      {
        nom: 'À domicile',
        type: 'boolean',
        ordre: 6
      },
      {
        nom: 'Urgence',
        type: 'boolean',
        ordre: 7
      },
      {
        nom: 'Disponibilité',
        type: 'select',
        options: ['Immédiate', 'Cette semaine', 'Ce mois', 'À convenir'],
        required: false,
        ordre: 8
      }
    ],

    // ⚽ Sports & Loisirs - 6 annonces
    'Sports & Loisirs': [
      {
        nom: 'Catégorie',
        type: 'select',
        options: ['Sport', 'Fitness', 'Jeux', 'Musique', 'Livres', 'Collection', 'Loisirs créatifs', 'Autre'],
        required: true,
        ordre: 3
      },
      {
        nom: 'Discipline sportive',
        type: 'select',
        options: ['Football', 'Basketball', 'Tennis', 'Running', 'Cyclisme', 'Natation', 'Fitness', 'Yoga', 'Autre'],
        required: false,
        ordre: 4
      },
      {
        nom: 'Niveau',
        type: 'select',
        options: ['Débutant', 'Intermédiaire', 'Avancé', 'Professionnel'],
        required: false,
        ordre: 5
      },
      {
        nom: 'Âge recommandé',
        type: 'string',
        placeholder: 'ex: 8-12 ans, Adulte, Tout âge',
        required: false,
        ordre: 6
      },
      {
        nom: 'Garantie',
        type: 'boolean',
        ordre: 7
      },
      {
        nom: 'Date d\'achat',
        type: 'date',
        placeholder: 'Date d\'achat original',
        required: false,
        ordre: 8
      }
    ],

    // 👔 Vêtements - 6 annonces
    'Vêtements': [
      {
        nom: 'Type de vêtement',
        type: 'select',
        options: ['T-shirt', 'Chemise', 'Pantalon', 'Jupe', 'Robe', 'Veste', 'Manteau', 'Pull', 'Short', 'Autre'],
        required: true,
        ordre: 3
      },
      {
        nom: 'Taille',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
        required: true,
        ordre: 4
      },
      {
        nom: 'Genre',
        type: 'select',
        options: ['Homme', 'Femme', 'Enfant', 'Unisexe'],
        required: true,
        ordre: 5
      },
      {
        nom: 'Couleur',
        type: 'string',
        placeholder: 'Couleur principale',
        required: false,
        ordre: 6
      },
      {
        nom: 'Matière',
        type: 'select',
        options: ['Coton', 'Polyester', 'Laine', 'Soie', 'Cuir', 'Jean', 'Lin', 'Cachemire', 'Synthétique'],
        required: false,
        ordre: 7
      },
      {
        nom: 'Saison',
        type: 'select',
        options: ['Printemps/Été', 'Automne/Hiver', 'Toute saison'],
        required: false,
        ordre: 8
      }
    ]
  }
};

// Améliorer aussi les attributs existants d'Automobile pour ajouter le type date
const improveExistingCategories = {
  'Automobile': [
    {
      nom: 'Date de première immatriculation',
      type: 'date',
      placeholder: 'Date de première immatriculation',
      description: 'Date de première mise en circulation',
      required: false,
      ordre: 9
    },
    {
      nom: 'Dernière révision',
      type: 'date',
      placeholder: 'Date de la dernière révision',
      required: false,
      ordre: 10
    }
  ],
  'Immobilier': [
    {
      nom: 'Date de construction',
      type: 'date',
      placeholder: 'Date de construction estimée',
      required: false,
      ordre: 8
    },
    {
      nom: 'Disponible à partir du',
      type: 'date',
      placeholder: 'Date de disponibilité',
      required: false,
      ordre: 9
    }
  ],
  'Électronique': [
    {
      nom: 'Date d\'achat',
      type: 'date',
      placeholder: 'Date d\'achat original',
      required: false,
      ordre: 6
    },
    {
      nom: 'Fin de garantie',
      type: 'date',
      placeholder: 'Date de fin de garantie',
      required: false,
      ordre: 7
    }
  ]
};

const createAttributesForMyCategories = async () => {
  try {
    await connectDB();

    console.log('🚀 Création d\'attributs pour VOS catégories spécifiques...\n');

    // Récupérer VOS catégories par nom exact
    const categories = await Categorie.find();
    let categoriesUpdated = 0;
    let totalAttributesCreated = 0;

    // Améliorer les catégories existantes avec des attributs de date
    console.log('🔧 Amélioration des catégories existantes avec attributs de date...');
    for (const [categoryName, additionalAttributes] of Object.entries(improveExistingCategories)) {
      const category = categories.find(cat => cat.nom === categoryName);
      if (category) {
        console.log(`📅 Ajout d'attributs de date pour: ${category.icone} ${category.nom}`);
        
        for (const attrData of additionalAttributes) {
          // Vérifier si l'attribut existe déjà
          const existingAttr = await Attribute.findOne({
            categorie_id: category._id,
            nom: attrData.nom
          });

          if (!existingAttr) {
            try {
              const attribute = new Attribute({
                ...attrData,
                categorie_id: category._id
              });
              await attribute.save();
              totalAttributesCreated++;
              console.log(`   ✅ Ajouté: ${attrData.nom} (${attrData.type})`);
            } catch (error) {
              console.log(`   ❌ Erreur pour "${attrData.nom}":`, error.message);
            }
          } else {
            console.log(`   ℹ️  "${attrData.nom}" existe déjà`);
          }
        }
      }
    }

    console.log('\n📋 Création d\'attributs pour les catégories sans attributs...');

    // Créer des attributs pour les catégories sans attributs
    for (const category of categories) {
      const existingAttributeCount = await Attribute.countDocuments({ 
        categorie_id: category._id, 
        isActive: true 
      });

      // Traiter les catégories sans attributs OU celles qu'on veut améliorer
      const needsAttributes = existingAttributeCount === 0;
      const categoryName = category.nom;

      if (needsAttributes) {
        console.log(`\n📋 Création d'attributs pour: ${category.icone} ${categoryName}`);

        const attributesToCreate = [];

        // Ajouter les attributs génériques pour toutes les catégories sans attributs
        attributesToCreate.push(...myAttributeTemplates.generic);

        // Ajouter les attributs spécifiques selon le nom exact de la catégorie
        if (myAttributeTemplates.specific[categoryName]) {
          console.log(`   → Attributs spécifiques trouvés pour "${categoryName}"`);
          attributesToCreate.push(...myAttributeTemplates.specific[categoryName]);
        } else {
          console.log(`   ⚠️  Aucun template spécifique pour "${categoryName}"`);
        }

        // Créer les attributs
        for (const attrData of attributesToCreate) {
          try {
            const attribute = new Attribute({
              ...attrData,
              categorie_id: category._id
            });
            await attribute.save();
            totalAttributesCreated++;
            console.log(`   ✅ ${attrData.nom} (${attrData.type})`);
          } catch (error) {
            console.log(`   ❌ Erreur création attribut "${attrData.nom}":`, error.message);
          }
        }

        console.log(`   🎉 ${attributesToCreate.length} attributs créés`);
        categoriesUpdated++;
      } else {
        console.log(`   ℹ️  ${category.icone} ${categoryName} - ${existingAttributeCount} attributs existants`);
      }
    }

    console.log(`\n🎉 RÉSUMÉ:`);
    console.log(`   - ${categoriesUpdated} catégories mises à jour avec de nouveaux attributs`);
    console.log(`   - ${totalAttributesCreated} attributs créés au total`);
    
    if (categoriesUpdated > 0) {
      console.log(`\n✅ Prêt pour la migration de vos 30 annonces !`);
      console.log(`\n📋 Prochaines étapes:`);
      console.log(`   1. Testez le formulaire de création d'annonce`);
      console.log(`   2. Migrez vos annonces existantes avec:`);
      console.log(`      node scripts/smartMigrateAnnonces.js`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des attributs:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Exécuter la création
createAttributesForMyCategories();