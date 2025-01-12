import { URLSearchParams } from 'url';

const API_URL = "https://primary-production-079f.up.railway.app/webhook/cookies";

export interface ManufacturerResponse {
  data: string[];
  profile: {
    first_name: string;
    other_names: string;
    last_name: string;
    id_number: string;
    id_type: string;
    gender: string;
    date_of_birth: string;
    kra_pin: string;
  };
}

export interface ManufacturerDetails {
  taxpayerName: string;
  mainEmailId: string;
  mobileNumber: string;
  businessRegCertiNo?: string;
  busiRegDt?: string;
  busiCommencedDt?: string;
  postalAddress?: {
    postalCode: string;
    town: string;
    poBox: string;
  };
  descriptiveAddress?: string;
}

export async function fetchManufacturerDetails(id: string, firstName: string): Promise<ManufacturerDetails> {
  try {
    const response = await fetch(`/api/manufacturer?id=${encodeURIComponent(id)}&firstName=${encodeURIComponent(firstName)}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const { success, data, error } = await response.json();

    if (!success) {
      throw new Error(error || 'Failed to fetch manufacturer details');
    }

    return data;
  } catch (error) {
    console.error('Error fetching manufacturer details:', error);
    throw error;
  }
}
