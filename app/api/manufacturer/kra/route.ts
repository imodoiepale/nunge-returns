import { NextResponse } from 'next/server';

const API_URL = 'https://primary-production-079f.up.railway.app/webhook/manufucturerDetails';
const API_URL2 = 'https://primary-production-079f.up.railway.app/webhook/manufucturerDetails';

interface ManufacturerDetails {
  pin: string;
  name: string;
  contactDetails: {
    mobile: string;
    email: string;
    secondaryEmail: string;
  };
  businessDetails: {
    name: string;
    registrationNumber: string;
    registrationDate: string;
    commencedDate: string;
  };
  postalAddress: {
    postalCode: string;
    town: string;
    poBox: string;
  };
  physicalAddress: {
    descriptive: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'Missing PIN parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching from URL:', `${API_URL}?pin=${pin}`);
    const response = await fetch(`${API_URL}?pin=${pin}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manufacturer details: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    console.log('Raw API Response:', JSON.stringify(rawData, null, 2));

    if (!Array.isArray(rawData) || rawData.length === 0 || !rawData[0].data) {
      throw new Error('Invalid response format from manufacturer details API');
    }

    const parsedData = JSON.parse(rawData[0].data);
    console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));

    const details: ManufacturerDetails = {
      pin: pin,
      name: parsedData.timsManBasicRDtlDTO?.manufacturerName || '',
      contactDetails: {
        mobile: parsedData.manContactRDtlDTO?.mobileNo || '',
        email: parsedData.manContactRDtlDTO?.mainEmail || '',
        secondaryEmail: parsedData.manContactRDtlDTO?.secondaryEmail || ''
      },
      businessDetails: {
        name: parsedData.manBusinessRDtlDTO?.businessName || parsedData.timsManBasicRDtlDTO?.manufacturerName || '',
        registrationNumber: parsedData.timsManBasicRDtlDTO?.manufacturerBrNo || '',
        registrationDate: parsedData.manBusinessRDtlDTO?.businessRegDate || '',
        commencedDate: parsedData.manBusinessRDtlDTO?.businessComDate || ''
      },
      postalAddress: {
        postalCode: parsedData.manAddRDtlDTO?.postalCode?.toString() || '',
        town: parsedData.manAddRDtlDTO?.town || '',
        poBox: parsedData.manAddRDtlDTO?.poBox?.toString() || ''
      },
      physicalAddress: {
        descriptive: parsedData.manAddRDtlDTO?.descriptiveAddress || ''
      }
    };

    console.log('Formatted Details:', details);
    return NextResponse.json({ success: true, data: details });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
