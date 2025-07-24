// backend/scripts/smartMigrateAnnonces.js
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

const Annonce = require('../models/Annonce');
const Attribute = require('../models/Attribute');
const AnnonceAttributeValue = require('../models/AnnonceAttributeValue');
const Categorie = require('../models/Categorie');


const smartMigrateAnnonces = async () => {
  try {
    await connectDB();

    console.log('🔄 Migration intelligente des annonces existantes...\n');

    // Récupérer toutes les annonces
    const annonces = await Annonce.find().populate('categorie_id');
    console.log(`📋 ${annonces.length} annonces trouvées`);

    let migratedCount = 0;
    let skippedCount = 0;
    let totalAttributesCreated = 0;

    for (const annonce of annonces) {
      if (!annonce.categorie_id) {
        console.log(`⚠️  Annonce "${annonce.titre}" sans catégorie - ignorée`);
        skippedCount++;
        continue;
      }

      // Vérifier si l'annonce a déjà des attributs
      const existingAttributeValues = await AnnonceAttributeValue.countDocuments({
        annonce_id: annonce._id
      });

      if (existingAttributeValues > 0) {
        console.log(`   ℹ️  "${annonce.titre}" - ${existingAttributeValues} attributs existants`);
        continue;
      }

      // Récupérer les attributs disponibles pour cette catégorie
      const availableAttributes = await Attribute.find({
        categorie_id: annonce.categorie_id._id,
        isActive: true
      });

      if (availableAttributes.length === 0) {
        console.log(`   ⚠️  "${annonce.titre}" - catégorie "${annonce.categorie_id.nom}" sans attributs`);
        skippedCount++;
        continue;
      }

      console.log(`🔧 Migration: "${annonce.titre}" (${annonce.categorie_id.nom})`);

      const valuesToCreate = [];

      // Mapper les données existantes vers les attributs
      for (const attribute of availableAttributes) {
        let valueToSave = null;

        switch (attribute.nom.toLowerCase()) {
          case 'marque':
            if (annonce.marque && annonce.marque.trim() !== '') {
              valueToSave = annonce.marque.trim();
            }
            break;

          case 'état':
          case 'etat':
            if (annonce.etat && annonce.etat.trim() !== '') {
              valueToSave = annonce.etat.trim();
            }
            break;

          // Mapping intelligent basé sur le type d'attribut et le contenu
          case 'garantie':
            // Si l'annonce contient des mots-clés liés à la garantie
            if (annonce.description && 
                (annonce.description.toLowerCase().includes('garantie') ||
                 annonce.description.toLowerCase().includes('garanti'))) {
              valueToSave = true;
            }
            break;

          case 'couleur':
            // Extraction de couleur depuis la description ou le titre
            const couleurs = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'rose', 'gris', 'marron'];
            const text = `${annonce.titre} ${annonce.description}`.toLowerCase();
            
            for (const couleur of couleurs) {
              if (text.includes(couleur)) {
                valueToSave = couleur.charAt(0).toUpperCase() + couleur.slice(1);
                break;
              }
            }
            break;

          case 'type de contrat':
            // Pour les annonces d'emploi
            const typesContrat = ['cdi', 'cdd', 'stage', 'freelance', 'temps partiel'];
            const textContrat = `${annonce.titre} ${annonce.description}`.toLowerCase();
            
            for (const type of typesContrat) {
              if (textContrat.includes(type)) {
                valueToSave = type.toUpperCase();
                break;
              }
            }
            break;

          case 'âge recommandé':
          case 'age recommandé':
            // Extraction d'âge depuis le texte
            const ageMatch = annonce.description?.match(/(\d+)\s*(ans?|mois)/i);
            if (ageMatch) {
              valueToSave = `${ageMatch[1]} ${ageMatch[2]}`;
            }
            break;

          // Pour les attributs de type boolean, essayer de détecter des indices
          default:
            if (attribute.type === 'boolean') {
              const keywords = {
                'ascenseur': ['ascenseur', 'elevator'],
                'parking': ['parking', 'garage'],
                'meublé': ['meublé', 'meuble', 'furnished'],
                'climatisation': ['climatisation', 'clim', 'air conditionné'],
                'première main': ['première main', '1ere main', 'premier propriétaire'],
                'télétravail possible': ['télétravail', 'remote', 'à distance'],
                'vacciné': ['vacciné', 'vaccination'],
                'sécurité conforme': ['sécurité', 'conforme', 'norme'],
                'certification': ['certifié', 'certification', 'diplôme'],
                'en ligne': ['en ligne', 'online', 'digital']
              };

              const attrKeywords = keywords[attribute.nom.toLowerCase()];
              if (attrKeywords) {
                const searchText = `${annonce.titre} ${annonce.description}`.toLowerCase();
                const hasKeyword = attrKeywords.some(keyword => searchText.includes(keyword));
                if (hasKeyword) {
                  valueToSave = true;
                }
              }
            }
            break;
        }

        // Sauvegarder la valeur si elle existe
        if (valueToSave !== null && valueToSave !== undefined && valueToSave !== '') {
          // Valider selon le type d'attribut
          let finalValue = valueToSave;

          if (attribute.type === 'number') {
            finalValue = parseFloat(valueToSave);
            if (isNaN(finalValue)) {
              continue; // Ignorer si ce n'est pas un nombre valide
            }
          } else if (attribute.type === 'select' && attribute.options) {
            // Vérifier si la valeur est dans les options (avec une recherche flexible)
            const matchingOption = attribute.options.find(option => 
              option.toLowerCase() === valueToSave.toLowerCase() ||
              option.toLowerCase().includes(valueToSave.toLowerCase()) ||
              valueToSave.toLowerCase().includes(option.toLowerCase())
            );
            if (matchingOption) {
              finalValue = matchingOption;
            } else {
              continue; // Ignorer si l'option n'existe pas
            }
          }

          valuesToCreate.push({
            annonce_id: annonce._id,
            attribute_id: attribute._id,
            value: finalValue
          });

          console.log(`   ✅ ${attribute.nom}: ${finalValue}`);
        }
      }

      // Créer les valeurs d'attributs
      if (valuesToCreate.length > 0) {
        try {
          await AnnonceAttributeValue.insertMany(valuesToCreate);
          totalAttributesCreated += valuesToCreate.length;
          migratedCount++;
          console.log(`   🎉 ${valuesToCreate.length} attributs créés pour cette annonce`);
        } catch (error) {
          console.log(`   ❌ Erreur lors de la création des attributs:`, error.message);
        }
      } else {
        console.log(`   ℹ️  Aucun attribut à migrer pour cette annonce`);
      }

      console.log(''); // Ligne vide pour la lisibilité
    }

    console.log(`\n🎉 MIGRATION TERMINÉE :`);
    console.log(`   - ${migratedCount} annonces migrées avec succès`);
    console.log(`   - ${skippedCount} annonces ignorées (sans catégorie ou déjà migrées)`);
    console.log(`   - ${totalAttributesCreated} valeurs d'attributs créées au total`);

    // Statistiques finales
    const annoncesWithAttributes = await AnnonceAttributeValue.distinct('annonce_id');
    const totalAnnonces = await Annonce.countDocuments();
    
    console.log(`\n📊 STATISTIQUES FINALES :`);
    console.log(`   - ${totalAnnonces} annonces au total`);
    console.log(`   - ${annoncesWithAttributes.length} annonces avec attributs`);
    console.log(`   - ${((annoncesWithAttributes.length / totalAnnonces) * 100).toFixed(1)}% des annonces ont des attributs`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Exécuter la migration
smartMigrateAnnonces();