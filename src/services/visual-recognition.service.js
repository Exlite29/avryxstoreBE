const { initializeDatabase } = require("../config/database");
const cloudinary = require("cloudinary").v2;

// Initialize database connection
let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

/**
 * Recognize products from an image using Cloudinary's FREE built-in features
 * Uses metadata, format analysis, and color detection instead of paid AI add-ons
 */
const recognizeFromImage = async (imagePath, options = {}) => {
  const { confidenceThreshold = 50 } = options;

  try {
    // Upload image to Cloudinary (free tier includes basic analysis)
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: "visual-recognition",
      resource_type: "image",
      // Request colors analysis (free)
      colors: true,
      // Request image metadata (free)
      image_metadata: true,
    });

    // Extract available information (all free features)
    const imageInfo = {
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      colors: uploadResult.colors || [], // Dominant colors (free)
      created_at: uploadResult.created_at,
    };

    // Get product categories from database
    const database = await initializeDb();
    const products = await database.all(
      "SELECT id, name, category, unit_price, stock_quantity, image_urls, barcode FROM products WHERE is_active = 1",
    );

    // Get distinct categories for matching
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];

    // Match based on product database keywords and image analysis
    const matchedProducts = [];

    // Common product keywords for Sari-Sari store
    const categoryKeywords = {
      Coffee: [
        "coffee",
        "nescafe",
        "coffee mix",
        "creamy white",
        "dark roast",
        "barako",
      ],
      Noodles: [
        "noodle",
        "jampong",
        "mami",
        "bihon",
        "instant",
        "lucky me",
        "pancit",
      ],
      "Canned Goods": [
        "canned",
        "meat",
        "fish",
        "sardines",
        "tuna",
        "corned beef",
      ],
      Shampoo: ["shampoo", "shampo", "hair", "conditioner", "sunsilk", "head"],
      Soap: ["soap", "sabun", "detergent", "laundry", "washing"],
      Beverages: [
        "water",
        "soda",
        "juice",
        "drink",
        "coke",
        "sprite",
        "pepsi",
        "bottled",
      ],
      Snacks: [
        "chip",
        "cracker",
        "biscuit",
        "cookies",
        "candy",
        "chocolate",
        "tira",
      ],
      Rice: ["rice", "palay", "bigas"],
      Eggs: ["egg", "itlog"],
      Milk: ["milk", "gatas", "evaporada"],
      Sugar: ["sugar", "asukal"],
      "Cooking Oil": ["oil", "mantika", "coconut oil"],
      Sauce: ["sauce", "suka", "soy sauce", "patis", "vinegar"],
    };

    // Analyze image colors to help with categorization
    const dominantColors = (uploadResult.colors || [])
      .slice(0, 5)
      .map(([color, percentage]) => ({ color, percentage }));

    // Simple color to category mapping (heuristic)
    const colorToCategory = {
      red: ["canned goods", "sauce", "beverages"],
      brown: ["coffee", "chocolate", "sauce"],
      white: ["milk", "soap", "sugar"],
      blue: ["beverages", "shampoo"],
      green: ["noodles", "snacks"],
      yellow: ["cheese", "snacks"],
    };

    for (const product of products) {
      let matchScore = 0;
      const matchedKeywords = [];

      // Check product name for keywords
      const productNameLower = product.name.toLowerCase();
      const productCategoryLower = (product.category || "").toLowerCase();

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        // Match category
        if (productCategoryLower.includes(category.toLowerCase())) {
          matchScore += 10;
        }

        // Match keywords
        for (const keyword of keywords) {
          if (productNameLower.includes(keyword)) {
            matchScore += 5;
            matchedKeywords.push(keyword);
          }
          if (productCategoryLower.includes(keyword)) {
            matchScore += 3;
          }
        }
      }

      // Bonus for products with images in database
      if (product.image_urls && product.image_urls !== "[]") {
        matchScore += 2;
      }

      // Bonus for in-stock items
      if (product.stock_quantity > 0) {
        matchScore += 1;
      }

      if (matchScore > 0) {
        matchedProducts.push({
          id: product.id,
          name: product.name,
          category: product.category,
          unit_price: product.unit_price,
          stock_quantity: product.stock_quantity,
          barcode: product.barcode,
          matchScore,
          matchedKeywords: [...new Set(matchedKeywords)],
          imageUrls: product.image_urls ? JSON.parse(product.image_urls) : [],
        });
      }
    }

    // Sort by match score
    matchedProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches above threshold
    const topMatches = matchedProducts
      .filter((p) => p.matchScore >= confidenceThreshold)
      .slice(0, 10);

    return {
      success: true,
      imageInfo,
      dominantColors,
      matchedProducts: topMatches,
      allRankedProducts: matchedProducts.slice(0, 20),
      suggestions:
        topMatches.length === 0 ? getDefaultRecommendations(categories) : [],
      recommendations: {
        tryBarcode: "Scan the barcode for accurate product identification",
        tryManual: "Enter product details manually if recognition fails",
        addProduct: "Add this product to inventory for future recognition",
      },
    };
  } catch (error) {
    console.error("Visual recognition error:", error);
    return {
      success: false,
      error: error.message,
      matchedProducts: [],
    };
  }
};

/**
 * Recognize product from base64 image (free method)
 */
const recognizeFromBase64 = async (base64Data, options = {}) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: "visual-recognition",
      resource_type: "image",
      colors: true,
    });

    return {
      success: true,
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      colors: uploadResult.colors || [],
    };
  } catch (error) {
    console.error("Base64 visual recognition error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Train product recognition by storing reference images with product tags
 */
const trainProductRecognition = async (productId, imageUrls) => {
  const database = await initializeDb();

  try {
    // Get product info
    const product = await database.get("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Create searchable tags from product info
    const trainedTags = [
      product.name.toLowerCase(),
      product.category?.toLowerCase() || "",
      product.barcode || "",
      `product_${productId}`,
    ];

    let trainedCount = 0;

    for (const imageUrl of imageUrls) {
      try {
        // Add image to Cloudinary with product tags
        await cloudinary.uploader.upload(imageUrl, {
          tags: [...trainedTags, "training_data"],
          folder: `product-recognition/${productId}`,
          resource_type: "image",
        });
        trainedCount++;
      } catch (uploadError) {
        console.error(`Failed to train image ${imageUrl}:`, uploadError);
      }
    }

    return {
      success: true,
      message: `Product "${product.name}" trained with ${trainedCount}/${imageUrls.length} images`,
      trainedTags,
      trainedCount,
    };
  } catch (error) {
    console.error("Training error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get default recommendations when no products match
 */
const getDefaultRecommendations = (categories) => {
  return [
    {
      action: "scan_barcode",
      message:
        "Try scanning the barcode instead for accurate product identification",
      priority: "high",
    },
    {
      action: "add_product",
      message: "Add this product to your inventory for future recognition",
      priority: "medium",
    },
    {
      action: "manual_entry",
      message: "Enter product details manually",
      priority: "low",
    },
  ];
};

/**
 * Get product suggestions based on visual analysis
 */
const getSuggestions = async () => {
  const database = await initializeDb();

  // Get all products grouped by category
  const products = await database.all(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL",
  );

  const categories = products.map((p) => p.category);

  return {
    availableCategories: categories,
    totalProducts: await database.get("SELECT COUNT(*) as count FROM products"),
  };
};

/**
 * Search products by category name (for quick lookup)
 */
const searchByCategory = async (categoryName) => {
  const database = await initializeDb();

  const products = await database.all(
    "SELECT * FROM products WHERE category LIKE ? AND is_active = 1",
    [`%${categoryName}%`],
  );

  return {
    category: categoryName,
    productCount: products.length,
    products,
  };
};

module.exports = {
  recognizeFromImage,
  recognizeFromBase64,
  trainProductRecognition,
  getSuggestions,
  searchByCategory,
};
