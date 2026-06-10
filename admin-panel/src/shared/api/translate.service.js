/**
 * Translate text using Google Translate public endpoint.
 *
 * @param {string} text - Source text to translate
 * @param {string} source - Source language code (ISO 639-1, e.g. 'uk', 'en')
 * @param {string} target - Target language code (ISO 639-1, e.g. 'en', 'uk')
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, source = 'uk', target = 'en') {
  if (!text?.trim()) return '';

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Translation request failed with status ${response.status}`);
  }

  const data = await response.json();

  // Google returns: [ [ [translated_chunk, original_chunk, ...], ... ], ..., source_lang ]
  return data[0].map((item) => item[0]).join('');
}
