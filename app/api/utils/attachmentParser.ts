// app/api/utils/attachmentParser.ts
// Utility function to safely parse attachments that might be stored in different formats

/**
 * Safely parse attachments field which might be:
 * 1. JSON array of URLs: ["url1", "url2", "url3"]
 * 2. Single URL string: "https://example.com/file.pdf"
 * 3. Empty/null value
 * 4. Invalid JSON
 */
export function parseAttachments(attachmentsField: any): string[] {
  // Handle null, undefined, or empty string
  if (!attachmentsField || attachmentsField === '' || attachmentsField === 'null') {
    return [];
  }

  // If it's already an array, return it
  if (Array.isArray(attachmentsField)) {
    return attachmentsField.filter(item => typeof item === 'string' && item.trim() !== '');
  }

  // If it's a string, try to parse as JSON first
  if (typeof attachmentsField === 'string') {
    const trimmed = attachmentsField.trim();
    
    // Check if it looks like JSON (starts with [ or ")
    if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string' && item.trim() !== '');
        }
        // If parsed JSON is a single string, wrap it in an array
        if (typeof parsed === 'string' && parsed.trim() !== '') {
          return [parsed.trim()];
        }
      } catch (parseError) {
        if (parseError && typeof parseError === 'object' && 'message' in parseError) {
          console.warn('Failed to parse attachments as JSON:', (parseError as Error).message);
        } else {
          console.warn('Failed to parse attachments as JSON:', parseError);
        }
        // Fall through to treat as single URL
      }
    }
    
    // Treat as single URL if it looks like a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return [trimmed];
    }
    
    // If it doesn't look like a URL and isn't valid JSON, return empty array
    console.warn('Attachments field contains unrecognized format:', trimmed.substring(0, 50) + '...');
    return [];
  }

  console.warn('Attachments field has unexpected type:', typeof attachmentsField);
  return [];
}

/**
 * Convert attachments array back to JSON string for database storage
 */
export function stringifyAttachments(attachments: string[]): string {
  if (!Array.isArray(attachments)) {
    return '[]';
  }
  
  // Filter out empty strings and ensure all items are strings
  const validAttachments = attachments.filter(item => 
    typeof item === 'string' && item.trim() !== ''
  );
  
  return JSON.stringify(validAttachments);
}

/**
 * Validate that a string looks like a valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean and validate attachments array
 */
export function cleanAttachments(attachments: string[]): string[] {
  if (!Array.isArray(attachments)) {
    return [];
  }
  
  return attachments
    .filter(url => typeof url === 'string' && url.trim() !== '')
    .map(url => url.trim())
    .filter(url => isValidUrl(url));
}