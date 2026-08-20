import { Medication, DrugInteraction } from '../types/health';
import { db } from '../lib/firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { explainInteraction } from './ai/promptFramework';
import { resolveRxCuiFuzzy } from './drugInteractionService';

export async function lookupRxCUI(drugName: string): Promise<string | null> {
  try {
    const match = await resolveRxCuiFuzzy(drugName);
    return match ? match.rxcui : null;
  } catch (err) {
    console.error("Failed to lookup RxCUI:", err);
    return null;
  }
}

export async function checkInteractions(rxcuis: string[]): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = [];
  if (rxcuis.length < 2) return interactions;
  
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`);
    if (!res.ok) return interactions;
    const data = await res.json();
    
    if (data.fullInteractionTypeGroup) {
      for (const group of data.fullInteractionTypeGroup) {
        for (const type of group.fullInteractionType) {
          for (const pair of type.interactionPair) {
            const rxcuiA = pair.interactionConcept[0].minConceptItem.rxcui;
            const rxcuiB = pair.interactionConcept[1].minConceptItem.rxcui;
            const drugA = pair.interactionConcept[0].minConceptItem.name;
            const drugB = pair.interactionConcept[1].minConceptItem.name;
            const desc = pair.description;
            const severityRaw = pair.severity?.toLowerCase();
            
            let severity: 'mild' | 'moderate' | 'severe' = 'mild';
            if (severityRaw === 'high') severity = 'severe';
            else if (severityRaw === 'moderate') severity = 'moderate';
            
            const plainSummaryRaw = await explainInteraction(pair);
            let plainSummary = "No summary available.";
            
            if (typeof plainSummaryRaw === 'string') {
               plainSummary = plainSummaryRaw;
            } else if (plainSummaryRaw && typeof plainSummaryRaw === 'object' && plainSummaryRaw.summary) {
               plainSummary = plainSummaryRaw.summary;
            }

            interactions.push({
              id: `${rxcuiA}-${rxcuiB}`,
              drugA,
              drugB,
              rxcuiA,
              rxcuiB,
              severity,
              description: desc,
              plainSummary: plainSummary,
              source: 'rxnorm',
              checkedAt: new Date().toISOString()
            });
          }
        }
      }
    }
    return interactions;
  } catch (err) {
    console.error("Failed to check drug interactions:", err);
    return [];
  }
}

export async function getActiveMedications(userId: string): Promise<Medication[]> {
  const q = query(
    collection(db, 'users', userId, 'medications'),
    where('endDate', '==', null),
    orderBy('addedAt', 'desc')
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
}

export async function getInteractions(userId: string): Promise<DrugInteraction[]> {
  const q = query(collection(db, 'users', userId, 'drugInteractions'));
  const snap = await getDocs(q);
  
  const interactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DrugInteraction));
  
  return interactions.sort((a, b) => {
    const sevScore = { severe: 3, moderate: 2, mild: 1 };
    return sevScore[b.severity] - sevScore[a.severity];
  });
}

export async function saveMedication(userId: string, med: Omit<Medication, "id" | "addedAt">): Promise<string> {
  const addedAt = new Date().toISOString();
  const baseDoc = await addDoc(collection(db, 'users', userId, 'medications'), { ...med, addedAt });

  // Post-Save Hook: update interactions
  const activeMeds = await getActiveMedications(userId);
  const rxcuis = activeMeds.map(m => m.rxcui).filter(x => x !== null) as string[];
  
  if (rxcuis.length >= 2) {
     const newInteractions = await checkInteractions(rxcuis);
     // Note: "overwrite outputs to Firestore collection path: users/{userId}/drugInteractions."
     // According to instructions, we should overwrite. For safety against unbounded growth, 
     // we can just delete old interactions and add new, but simplest is to just overwrite if they exist, or just add new.
     // To strictly overwrite, we fetch old ones and delete them, or use a specific doc id.
     const oldInteractionsSnap = await getDocs(collection(db, 'users', userId, 'drugInteractions'));
     const { deleteDoc } = await import('firebase/firestore');
     await Promise.all(oldInteractionsSnap.docs.map(d => deleteDoc(d.ref)));
     
     await Promise.all(newInteractions.map(interaction => {
       const { id, ...data } = interaction;
       return addDoc(collection(db, 'users', userId, 'drugInteractions'), data);
     }));
  }
  
  return baseDoc.id;
}
