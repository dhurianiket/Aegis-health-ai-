import { describe, it, expect } from 'vitest';
import { formatContextForPrompt } from '../contextService';
import { PatientContext, SpecialistConsultation, ClinicalReferral, CoachSessionSummary } from '../../../types/ai';
import { UserProfile, Gender } from '../../../types/medical';

describe('Cross-Agent Clinical Context Bus & Multi-AI Orchestration', () => {
  const mockProfile: UserProfile = {
    id: 'profile-123',
    userId: 'u1',
    name: 'Jane Doe',
    fullName: 'Jane Doe',
    dob: '1985-05-15',
    gender: Gender.FEMALE,
    height: 168,
    weight: 65,
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockSpecialistConsultations: SpecialistConsultation[] = [
    {
      specialistId: 'cardiologist',
      specialistName: 'AI Cardiologist',
      lastUpdated: '2026-09-20',
      summary: 'Stage 1 hypertension with resting tachycardia. Suggested DASH diet, BP tracking, and monitoring renal function with Nephrologist.',
      lastUserQuery: 'Why is my heart racing when climbing stairs?',
      activeReferrals: ['nephrologist | eGFR declining on ACE inhibitor'],
    },
    {
      specialistId: 'nephrologist',
      specialistName: 'AI Nephrologist',
      lastUpdated: '2026-09-21',
      summary: 'eGFR 58 mL/min (CKD 3a). Avoid NSAIDs; recommended checking ACR and consulting Endocrinologist on glycemic control.',
      lastUserQuery: 'Are my kidney numbers normal?',
    },
  ];

  const mockCoachSummary: CoachSessionSummary = {
    lastInteractionDate: '2026-09-21',
    recentTopics: ['Felt dizzy after morning medication', 'Fatigue in afternoon'],
    lastTriageNote: 'Advised hydration check, tracking orthostatic BP, and discussing dosage with Cardiologist.',
  };

  const mockActiveReferrals: ClinicalReferral[] = [
    {
      id: 'ref-456',
      fromAgent: 'AI Cardiologist',
      toSpecialist: 'nephrologist',
      reason: 'eGFR 58 mL/min while taking Lisinopril requires renal hemodynamic review',
      timestamp: '2026-09-21T10:00:00Z',
      status: 'pending',
    },
  ];

  it('formats multidisciplinary specialist cross-consultations into prompt', () => {
    const context: PatientContext = {
      profile: mockProfile,
      labHistory: [],
      medications: [
        { id: 'med-1', name: 'Lisinopril', dosage: '10mg', frequency: 'daily', status: 'active', userId: 'u1' } as any,
      ],
      recentInsights: [],
      alerts: [],
      specialistConsultations: mockSpecialistConsultations,
      coachSummary: mockCoachSummary,
      activeReferrals: mockActiveReferrals,
    };

    const formattedPrompt = formatContextForPrompt(context);

    // Verify Multi-Specialist consultations section exists
    expect(formattedPrompt).toContain('MULTI-SPECIALIST CROSS-CONSULTATIONS & TEAM ASSESSMENTS');
    expect(formattedPrompt).toContain('[AI Cardiologist] (Last consulted: 2026-09-20)');
    expect(formattedPrompt).toContain('Why is my heart racing when climbing stairs?');
    expect(formattedPrompt).toContain('Stage 1 hypertension with resting tachycardia');
    expect(formattedPrompt).toContain('[AI Nephrologist] (Last consulted: 2026-09-21)');
    expect(formattedPrompt).toContain('eGFR 58 mL/min (CKD 3a)');
  });

  it('formats Aura AI Coach interaction logs into shared prompt', () => {
    const context: PatientContext = {
      profile: mockProfile,
      labHistory: [],
      medications: [],
      recentInsights: [],
      alerts: [],
      coachSummary: mockCoachSummary,
    };

    const formattedPrompt = formatContextForPrompt(context);

    expect(formattedPrompt).toContain('AURA AI HEALTH COACH SESSIONS & TRIAGE');
    expect(formattedPrompt).toContain('Last Interaction: 2026-09-21');
    expect(formattedPrompt).toContain('Felt dizzy after morning medication');
    expect(formattedPrompt).toContain('Fatigue in afternoon');
    expect(formattedPrompt).toContain('Advised hydration check, tracking orthostatic BP');
  });

  it('formats active inter-agent clinical referrals into prompt', () => {
    const context: PatientContext = {
      profile: mockProfile,
      labHistory: [],
      medications: [],
      recentInsights: [],
      alerts: [],
      activeReferrals: mockActiveReferrals,
    };

    const formattedPrompt = formatContextForPrompt(context);

    expect(formattedPrompt).toContain('ACTIVE INTER-AGENT CLINICAL REFERRALS');
    expect(formattedPrompt).toContain('[PENDING ACTION]');
    expect(formattedPrompt).toContain('From AI Cardiologist to nephrologist');
    expect(formattedPrompt).toContain('eGFR 58 mL/min while taking Lisinopril requires renal hemodynamic review');
  });

  it('correctly parses [REFERRAL: specialistId | reason] tags', () => {
    const modelOutput = `Based on your creatinine levels, your kidneys need close monitoring. [REFERRAL: nephrologist | eGFR 58 mL/min on Lisinopril requires renal assessment] I will adjust your cardiac follow-up accordingly.`;
    const referralRegex = /\[REFERRAL:\s*([a-zA-Z0-9_-]+)\s*\|\s*([^\]]+)\]/gi;
    const matches: Array<{ specialist: string; reason: string }> = [];
    let match;
    while ((match = referralRegex.exec(modelOutput)) !== null) {
      matches.push({
        specialist: match[1].toLowerCase().trim(),
        reason: match[2].trim(),
      });
    }

    expect(matches).toHaveLength(1);
    expect(matches[0].specialist).toBe('nephrologist');
    expect(matches[0].reason).toBe('eGFR 58 mL/min on Lisinopril requires renal assessment');
  });

  it('synthesizes multi-specialist consultations alongside lab telemetry', () => {
    const context: PatientContext = {
      profile: mockProfile,
      labHistory: [
        {
          id: 'lab-1',
          markerName: 'eGFR',
          value: '58',
          unit: 'mL/min/1.73m2',
          referenceRange: '> 60',
          status: 'low',
          date: '2026-09-21',
          userId: 'u1',
        } as any,
      ],
      medications: [
        { id: 'med-1', name: 'Lisinopril', dosage: '10mg', frequency: 'daily', status: 'active', userId: 'u1' } as any,
      ],
      recentInsights: [
        {
          id: 'ins-1',
          specialty: 'Cardiology',
          timestamp: '2026-09-20',
          content: 'Borderline elevated BP with sinus tachycardia.',
          confidence: 0.95,
          flags: ['Hypertension'],
          userId: 'u1',
          sourceDocIds: [],
        },
      ],
      alerts: [
        {
          id: 'al-1',
          severity: 'moderate',
          type: 'lab_value',
          title: 'Decreased eGFR',
          description: 'Kidney filtration is sub-optimal.',
          createdAt: '2026-09-20',
          read: false,
        },
      ],
      specialistConsultations: mockSpecialistConsultations,
      coachSummary: mockCoachSummary,
      activeReferrals: mockActiveReferrals,
    };

    const prompt = formatContextForPrompt(context);

    // Check that all components are synthesized together in a unified clinical context
    expect(prompt).toContain('PATIENT PROFILE:');
    expect(prompt).toContain('ACTIVE MEDICATIONS:');
    expect(prompt).toContain('LAB RESULTS HISTORY');
    expect(prompt).toContain('eGFR:');
    expect(prompt).toContain('CLINICAL ALERTS:');
    expect(prompt).toContain('Decreased eGFR');
    expect(prompt).toContain('SPECIALIST CLINICAL INSIGHTS:');
    expect(prompt).toContain('[Cardiology]');
    expect(prompt).toContain('MULTI-SPECIALIST CROSS-CONSULTATIONS & TEAM ASSESSMENTS:');
    expect(prompt).toContain('AURA AI HEALTH COACH SESSIONS & TRIAGE:');
    expect(prompt).toContain('ACTIVE INTER-AGENT CLINICAL REFERRALS:');
  });
});
