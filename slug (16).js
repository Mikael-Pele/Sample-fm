const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateSlug(length = 7) {
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return slug;
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
