import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        const formData = await request.formData();
        const frontImage = formData.get('frontImage');
        const backImage = formData.get('backImage');

        if (!frontImage) {
            return NextResponse.json({ 
                success: false, 
                error: 'Front image is required' 
            }, { status: 400 });
        }

        console.log('[ID EXTRACTION] Starting ID extraction process...');

        // Convert images to base64
        const frontBuffer = Buffer.from(await frontImage.arrayBuffer());
        const frontBase64 = frontBuffer.toString('base64');

        let backBase64 = null;
        if (backImage) {
            const backBuffer = Buffer.from(await backImage.arrayBuffer());
            backBase64 = backBuffer.toString('base64');
        }

        // Use Gemini Vision to extract ID information
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI assistant that extracts information from Kenyan National ID cards or Passports.

Analyze the provided ID image(s) and extract the following information in JSON format:

{
  "idNumber": "ID number or passport number",
  "surname": "Surname/Family name",
  "givenName": "Given name(s)",
  "dateOfBirth": "Date of birth in DD/MM/YYYY format",
  "sex": "MALE or FEMALE",
  "placeOfBirth": "Place of birth",
  "nationality": "Nationality code (e.g., KEN)",
  "dateOfExpiry": "Date of expiry in DD/MM/YYYY format",
  "placeOfIssue": "Place of issue",
  "county": "County name if visible",
  "subCounty": "Sub-county name if visible",
  "location": "Location if visible"
}

IMPORTANT:
- Extract ONLY the information that is clearly visible in the image
- For dates, use DD/MM/YYYY format (e.g., 15/05/2007)
- For sex, use either "MALE" or "FEMALE"
- If a field is not visible or unclear, set it to null
- Return ONLY valid JSON, no additional text or explanations
- The ID number is usually at the bottom in the MRZ (Machine Readable Zone) or clearly printed on the card
- Look for both the front and back of the ID if provided`;

        const imageParts = [
            {
                inlineData: {
                    data: frontBase64,
                    mimeType: frontImage.type
                }
            }
        ];

        if (backBase64) {
            imageParts.push({
                inlineData: {
                    data: backBase64,
                    mimeType: backImage.type
                }
            });
        }

        console.log('[ID EXTRACTION] Sending images to Gemini for analysis...');

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        console.log('[ID EXTRACTION] Gemini response:', text);

        // Parse JSON from response
        let extractedData;
        try {
            // Remove markdown code blocks if present
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extractedData = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('[ID EXTRACTION] Failed to parse JSON:', parseError);
            return NextResponse.json({ 
                success: false, 
                error: 'Failed to parse extracted data. Please try again with a clearer image.' 
            }, { status: 500 });
        }

        console.log('[ID EXTRACTION] Extracted data:', extractedData);

        // Format date of birth if needed
        if (extractedData.dateOfBirth) {
            // Convert from various formats to DD/MM/YYYY
            const dob = extractedData.dateOfBirth;
            if (dob.includes('.')) {
                // Format: 15.05.2007 -> 15/05/2007
                extractedData.dateOfBirth = dob.replace(/\./g, '/');
            }
        }

        return NextResponse.json({
            success: true,
            extractedData: {
                idNumber: extractedData.idNumber || '',
                surname: extractedData.surname || '',
                givenName: extractedData.givenName || '',
                dateOfBirth: extractedData.dateOfBirth || '',
                sex: extractedData.sex || '',
                placeOfBirth: extractedData.placeOfBirth || '',
                nationality: extractedData.nationality || 'KEN',
                dateOfExpiry: extractedData.dateOfExpiry || '',
                placeOfIssue: extractedData.placeOfIssue || '',
                county: extractedData.county || '',
                subCounty: extractedData.subCounty || '',
                location: extractedData.location || ''
            }
        });

    } catch (error) {
        console.error('[ID EXTRACTION] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to extract ID information' 
        }, { status: 500 });
    }
}
