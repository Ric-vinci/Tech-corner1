/**
 * Real colour options per phone model (the "model info" catalogue). Keyed by the
 * clean model name. Used by the buy PDP so each product shows only its actual
 * colours (not a generic list). A model not listed falls back to a small default.
 *
 * NOTE: this is static catalogue reference data (colours rarely change). It can
 * later move to a Shopify `catalog.colours` metafield per model if needed.
 */
const MODEL_COLOURS: Record<string, string[]> = {
  // A-series
  "samsung galaxy a22 5g": ["Grey", "White", "Violet", "Mint"],
  "samsung galaxy a12": ["Black", "Blue", "White"],
  "samsung galaxy a13": ["Black", "White", "Blue", "Peach"],
  "samsung galaxy a14": ["Black", "Silver", "Red", "Green"],
  "samsung galaxy a15": ["Black", "Blue", "Yellow", "Light Blue"],
  "samsung galaxy a16": ["Black", "Blue", "Grey", "Green"],
  "samsung galaxy a20e": ["Black", "White", "Blue", "Coral"],
  "samsung galaxy a41": ["Black", "White", "Blue", "Red"],
  "samsung galaxy a55 5g": ["Ice Blue", "Lemon", "Lilac", "Navy"],
  "samsung galaxy a90 5g": ["Black", "White"],
  // Note series
  "samsung galaxy note 10": ["Silver", "Black", "Pink"],
  "samsung galaxy note 10 lite": ["Black", "Silver", "Red"],
  "samsung galaxy note 10 plus": ["Silver", "Black", "White"],
  "samsung galaxy note 10 plus 5g": ["Silver", "Black", "White"],
  "samsung galaxy note 20": ["Bronze", "Green", "Grey"],
  "samsung galaxy note 20 5g": ["Bronze", "Green", "Grey"],
  "samsung galaxy note 20 ultra 5g": ["Black", "Bronze", "White"],
  // S series
  "samsung galaxy s8": ["Black", "Grey", "Blue", "Silver"],
  "samsung galaxy s8 plus": ["Black", "Grey", "Blue", "Silver"],
  "samsung galaxy s9": ["Black", "Blue", "Purple", "Grey"],
  "samsung galaxy s9 plus": ["Black", "Blue", "Purple", "Grey"],
  "samsung galaxy s10": ["Black", "White", "Green", "Blue"],
  "samsung galaxy s10 5g": ["Black", "Silver"],
  "samsung galaxy s10 lite": ["Black", "White", "Blue"],
  "samsung galaxy s10 plus": ["Black", "White", "Blue"],
  "samsung galaxy s10e": ["Black", "White", "Yellow", "Blue"],
  "samsung galaxy s20": ["Grey", "Blue", "Pink"],
  "samsung galaxy s20 5g": ["Grey", "Blue", "Pink"],
  "samsung galaxy s20 fe": ["Navy", "Red", "Lavender", "Mint", "White", "Orange"],
  "samsung galaxy s20 fe 5g": ["Navy", "Red", "Lavender", "Mint", "White", "Orange"],
  "samsung galaxy s20 plus 5g": ["Black", "Grey", "Blue"],
  "samsung galaxy s20 ultra 5g": ["Black", "Grey"],
  "samsung galaxy s21 fe 5g": ["Grey", "White", "Lavender", "Olive"],
  "samsung galaxy s23 5g": ["Black", "Cream", "Green", "Lavender"],
  "samsung galaxy s23 plus 5g": ["Black", "Cream", "Green", "Lavender"],
  "samsung galaxy s23 ultra 5g": ["Black", "Cream", "Green", "Lavender"],
  "samsung galaxy s24 5g": ["Black", "Grey", "Violet", "Yellow"],
  "samsung galaxy s24 plus 5g": ["Black", "Grey", "Violet", "Yellow"],
  "samsung galaxy s24 ultra 5g": ["Black", "Grey", "Violet", "Yellow"],
  "samsung galaxy s25 5g": ["Navy", "Blue", "Mint", "Silver"],
  "samsung galaxy s25 plus 5g": ["Navy", "Blue", "Mint", "Silver"],
  "samsung galaxy s25 ultra 5g": ["Black", "Grey", "Silver"],
  // Z fold / flip
  "samsung galaxy z flip": ["Black", "Purple", "Gold"],
  "samsung galaxy z flip 5g": ["Grey", "Bronze"],
  "samsung galaxy z flip 3 5g": ["Cream", "Green", "Lavender", "Black"],
  "samsung galaxy fold 5g": ["Black", "Blue"],
  "samsung galaxy z fold 2 5g": ["Black", "Bronze"],
  "samsung galaxy z fold3 5g": ["Black", "Green", "Silver"],
  "samsung galaxy z fold7 5g": ["Blue", "Silver", "Black"],
};

const DEFAULT_COLOURS = ["Black", "Blue", "White"];

/** Real colours for a model (clean name), or a small default if unknown. */
export function coloursForModel(modelName: string): string[] {
  return MODEL_COLOURS[modelName.trim().toLowerCase()] ?? DEFAULT_COLOURS;
}
