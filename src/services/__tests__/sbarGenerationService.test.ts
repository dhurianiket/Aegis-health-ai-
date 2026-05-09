import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSBAR } from '../sbarGenerationService';
import { MedicationStatus } from '../../types/medical';

// Mock the AI SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({ text: "AI generated SBAR summary" })
        },
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({ response: { text: () => "AI generated SBAR summary" } })
        })
      };
    })
  };
});

describe('SBARGenerationService', () => {
  const mockProfile: any = {
    name: 'John Doe',
    dob: '1980-01-01',
    gender: 'Male',
    chronicConditions: ['Hypertension'],
    allergies: ['Penicillin']
  };

  const mockLabs: any[] = [
    { markerName: 'Glucose', value: 200, unit: 'mg/dL', status: 'critical' }
  ];

  const mockMeds: any[] = [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', status: MedicationStatus.ACTIVE }
  ];

  it('should generate SBAR when AI succeeds', async () => {
    const sbar = await generateSBAR(mockProfile, mockLabs, mockMeds);
    expect(sbar).toBe('AI generated SBAR summary');
  });

  it('should generate a fallback SBAR when AI fails', async () => {
    // Mock failure for this specific test
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const GoogleGenAI = (await import('@google/genai')).GoogleGenAI;
    const mockInstance = vi.mocked(GoogleGenAI).mock.results[0].value;
    vi.mocked(mockInstance.models.generateContent).mockRejectedValueOnce(new Error('AI Failure'));
    
    const sbar = await generateSBAR(mockProfile, mockLabs, mockMeds);
    
    expect(sbar).toContain('SITUATION:');
    expect(sbar).toContain('BACKGROUND:');
    expect(sbar).toContain('ASSESSMENT:');
    expect(sbar).toContain('RECOMMENDATION:');
    expect(sbar).toContain('Hypertension');
    expect(sbar).toContain('Glucose: 200');
  });
});
