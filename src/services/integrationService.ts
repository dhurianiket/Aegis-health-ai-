export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const separator = ',';
  const keys = Object.keys(data[0]);
  
  const csvContent = [
    keys.join(separator),
    ...data.map(row => keys.map(key => {
      let cell = row[key] === null || row[key] === undefined ? '' : row[key];
      cell = cell instanceof Date ? cell.toISOString() : String(cell).replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToFHIR = (profile: any) => {
  // Simple FHIR Patient Resource Stub
  const fhirPatient = {
    resourceType: "Patient",
    id: profile.id,
    name: [{ text: profile.name }],
    birthDate: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : undefined,
    gender: profile.gender?.toLowerCase(),
    // ... more mapping
  };

  const blob = new Blob([JSON.stringify(fhirPatient, null, 2)], { type: 'application/fhir+json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FHIR_Record_${profile.name}.json`;
  link.click();
};
