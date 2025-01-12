import { NextResponse } from 'next/server';

const API_URL = "https://primary-production-079f.up.railway.app/webhook/cookies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const firstName = searchParams.get('firstName');

    if (!id || !firstName) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call the KRA PIN finder API
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}&firstName=${encodeURIComponent(firstName)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from KRA PIN finder API');
    }

    const data = await response.json();

    if (!data || !data[0]) {
      return NextResponse.json(
        { success: false, error: 'No data found' },
        { status: 404 }
      );
    }

    const mainData = JSON.parse(data[0].data);
    const profileData = data[0].profile;

    // Format the response similar to the HTML implementation
    const formattedData = {
      pin: profileData.kra_pin || '',
      password: mainData.timsManBasicRDtlDTO?.password || profileData.password || '',
      taxpayerName: [
        profileData.first_name,
        profileData.other_names,
        profileData.last_name
      ].filter(Boolean).join(' '),
      mainEmailId: mainData.manContactRDtlDTO?.mainEmail || '',
      mobileNumber: mainData.manContactRDtlDTO?.mobileNo || '',
      businessInfo: {
        registrationNumber: mainData.timsManBasicRDtlDTO?.businessRegCertiNo || '',
        registrationDate: mainData.timsManBasicRDtlDTO?.busiRegDt || '',
        commencementDate: mainData.timsManBasicRDtlDTO?.busiCommencedDt || ''
      },
      postalAddress: mainData.manAddRDtlDTO?.postalAddress || {},
      descriptiveAddress: mainData.manAddRDtlDTO?.descriptiveAddress || '',
      secondaryEmail: mainData.manContactRDtlDTO?.secondaryEmail || '',
      status: mainData.timsManBasicRDtlDTO?.status || '',
      type: mainData.timsManBasicRDtlDTO?.type || ''
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

