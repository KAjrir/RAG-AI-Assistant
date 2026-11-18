export async function sdbGroepRetrieve({ question, keywords }) {
	const embedding = await embed(question);

	const lowercaseKeywords = keywords.map((k) => k.toLowerCase());
	const likePatterns = keywords.map((k) => `%${k}%`);

	const rows = await db`
    SELECT
      content,
      videos,
      links,
      images,
      metadata,
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity,
      CASE 
        WHEN (
          metadata->>'title' ILIKE ANY (${likePatterns})
          OR metadata->>'category' ILIKE ANY (${likePatterns})
          OR string_to_array(lower(metadata->>'tags'), ', ') && ${lowercaseKeywords}::text[]
        ) THEN 0.3
        ELSE 0.0 
      END AS text_boost
    FROM sdb_groep_articles
    WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.42
    ORDER BY (
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) + 
      CASE 
        WHEN (
          metadata->>'title' ILIKE ANY (${likePatterns})
          OR metadata->>'category' ILIKE ANY (${likePatterns})
          OR string_to_array(lower(metadata->>'tags'), ', ') && ${lowercaseKeywords}::text[]
        ) THEN 0.3 
        ELSE 0.0 
      END
    ) DESC
    LIMIT 5;
  `;

	return rows;
}
